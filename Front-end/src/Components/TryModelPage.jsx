import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TryModelPage.css";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = import.meta.env.VITE_WEATHER_BASE_URL;
const ML_API = import.meta.env.VITE_ML_API || 'http://localhost:8000'

const TryModelPage = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [forecast, setForecast] = useState(null);
  const [extendedForecast, setExtendedForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const theme = localStorage.getItem("sp_theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);

  // Helper — average wind direction on compass (1–32)
  const avgWindDirection = (dirs) => {
    if (!dirs.length) return 0;
    const radians = dirs.map((deg) => (deg * Math.PI) / 180);
    const sinSum = radians.reduce((sum, rad) => sum + Math.sin(rad), 0);
    const cosSum = radians.reduce((sum, rad) => sum + Math.cos(rad), 0);
    const meanRad = Math.atan2(sinSum / dirs.length, cosSum / dirs.length);
    const meanDeg = (meanRad * 180) / Math.PI;
    const normalized = (meanDeg + 360) % 360;
    const scale = Math.floor((normalized + 11.25 / 2) / 11.25) + 1;
    return scale > 32 ? 1 : scale;
  };

  // Helper function for scaling (if needed for display, but not for prediction payload)
  const scaleToRange = (
    value,
    oldMin,
    oldMax,
    newMin = 0.050400916,
    newMax = 1.141361257
  ) => {
    const scaled =
      ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin;
    return Number(scaled.toFixed(6));
  };

  const calculateDailyAverages = (entries, longitude, latitude) => {
    const avg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const temps = entries.map((e) => e.main.temp);
    const directions = entries.map((e) => e.wind.deg);
    const humidities = entries.map((e) => e.main.humidity);
    const winds = entries.map((e) => e.wind.speed);
    const clouds = entries.map((e) => e.clouds.all);
    const pressures = entries.map((e) => e.main.pressure);
    const visibilities = entries.map((e) => e.visibility || 0);

    const avgTempC = avg(temps);
    const avgTempF = (avgTempC * 9 / 5) + 32;

    const avgWind_ms = avg(winds);
    const avgWind_kmh = (avgWind_ms * 3.6).toFixed(1);
    const avgWind_mph = (avgWind_ms * 2.23694).toFixed(1);

    const avgClouds = avg(clouds);
    const avgVisibility = avg(visibilities);
    const avgPressure = avg(pressures);

    const scaledClouds = Math.round((avgClouds / 100) * 4);
    const finalClouds = Math.min(Math.max(scaledClouds, 0), 4);

    const MAX_EXPECTED_VISIBILITY = 10000;
    const visibilityRatio = avgVisibility / MAX_EXPECTED_VISIBILITY;
    const visibilityScore = Math.pow(visibilityRatio, 0.5) * 10;
    const finalVisibility = Math.min(Math.max(Math.round(visibilityScore), 1), 10);

    const pressureInHg = (avgPressure * 0.02953).toFixed(2);

    const scaledLongitude = scaleToRange(longitude, -180, 180);
    const scaledLatitude = scaleToRange(latitude, -90, 90);

    return {
      temp_c: Math.round(avgTempC),
      temp_f: Math.round(avgTempF),
      wind_speed_kmh: avgWind_kmh,
      wind_speed_mph: parseFloat(avgWind_mph),
      winddirection: avgWindDirection(directions),
      humidity: Math.round(avg(humidities)),
      clouds: finalClouds,
      pressure: parseFloat(pressureInHg),
      visibility: finalVisibility,
      longitude: scaledLongitude,
      latitude: scaledLatitude,
    };
  };

  const fetchWeatherData = async (e) => {
    e.preventDefault();
    if (!location) return alert("Please enter a location!");

    setLoading(true);
    setForecast(null);
    setExtendedForecast([]);

    try {
      const response = await fetch(
        `${BASE_URL}?q=${location}&appid=${API_KEY}&units=metric`
      );
      const data = await response.json();

      if (response.ok) {
        const { lon, lat } = data.city.coord;
        setCity(`${data.city.name}, ${data.city.country}`);

        const grouped = data.list.reduce((acc, entry) => {
          const date = entry.dt_txt.split(" ")[0];
          acc[date] = acc[date] ? [...acc[date], entry] : [entry];
          return acc;
        }, {});

        const dates = Object.keys(grouped);
        const today = dates[0];

        const todayAvg = calculateDailyAverages(grouped[today], lon, lat);

        setForecast({
          date: today,
          ...todayAvg,
          raw_lon: lon,
          raw_lat: lat,
        });

        const nextDays = dates.slice(1, 7).map((d) => ({
          date: d,
          ...calculateDailyAverages(grouped[d], lon, lat),
          raw_lon: lon,
          raw_lat: lat,
        }));
        setExtendedForecast(nextDays);
      } else {
        alert("Failed to fetch weather data. Please check the city name.");
      }
    } catch (err) {
      console.error("Error fetching weather data:", err);
      alert("An error occurred while fetching weather data.");
    } finally {
      setLoading(false);
    }
  };


  const handlePredict = async () => {
    if (!forecast) return alert("Please fetch weather data first!");

    setLoading(true);
    setPrediction(null);

    const forecastDate = new Date(forecast.date);

    const payload = {
      "Is Daylight": 1,
      "Average Temperature (Day)": forecast.temp_f,
      "Average Wind Direction (Day)": forecast.winddirection,
      "Average Wind Speed (Day)": forecast.wind_speed_mph,
      "Sky Cover": forecast.clouds,
      "Visibility": forecast.visibility,
      "Relative Humidity": forecast.humidity,
      "Average Barometric Pressure (Period)": forecast.pressure,
      "Month": forecastDate.getMonth() + 1,
      "Day": forecastDate.getDate(),
    };

    try {
      const response = await fetch(
        `${ML_API}/api/predict/solarpower`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setPrediction(data.predicted_power_kW);
      } else {
        alert("Failed to get prediction from backend.");
      }
    } catch (err) {
      console.error("Error fetching prediction:", err);
      alert("Backend or Python server not reachable.");
    } finally {
      setLoading(false);
    }
  };


  const handleUnlock = () => {
    const loggedIn = localStorage.getItem("user_logged_in");
    if (!loggedIn) {
      alert("Please sign in to unlock 6-day Power-Prediction and report!");
    } else {
      setShowExtended(true);
    }
  };

  return (
    <div className="trymodel-page">
      <h1>☀️ Try Solar Power Prediction Model</h1>

      <form className="trymodel-fetch-form" onSubmit={fetchWeatherData}>
        <label>Enter Location:</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter city name"
        />
        <div className="form-buttons">
          <button type="submit">Get Weather Info</button>
          <button type="button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </form>

      {loading && <p className="loading">⏳ Loading forecast...</p>}

      {forecast && (
        <div className="forecast-results">
          <div className="forecast-card">
            <h2>📍 Forecast for {city}</h2>
            <h3>📅 1-Day Summary ({forecast.date})</h3>
            <h4>You're prediction based on a Solar Power capacity is 19 kWh (Approx). Unlock your full 6-day power forecast and other features by signing in!</h4>
            <p>Longitude: {forecast.longitude}</p>
            <p>Latitude: {forecast.latitude}</p>
            <p>🌡️ Avg Temp: {forecast.temp_c}°C ({forecast.temp_f}°F)</p>
            <p>💧 Humidity: {forecast.humidity}%</p>
            <p>💨 Wind Speed: {forecast.wind_speed_kmh} km/h</p>
            <p>🎯 Wind Direction(1-32): {forecast.winddirection} </p>
            <p>☁️ Cloud Cover: {forecast.clouds} out of 4 </p>
            <p>👁️ Visibility: {forecast.visibility} out of 10 </p>
            <p>🔽 Pressure: {forecast.pressure} inHg</p>
          </div>
          <div className="button-formate">
            <button className="prediction-btn" onClick={handlePredict}>
              ⚡ Predict Solar Power
            </button>
            <button className="unlock-btn" onClick={handleUnlock}>
              🔓 Unlock 6-Day Power Prediction & Report
            </button>
          </div>
          {prediction !== null && (
            <div className="prediction-result">     
                ⚡ Predicted Solar Power Output: {prediction.toFixed(3)} kWh
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TryModelPage;