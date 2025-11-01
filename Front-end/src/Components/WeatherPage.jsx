import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WeatherPage.css";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = import.meta.env.VITE_WEATHER_BASE_URL;

const WeatherPage = () => {
  const navigate = useNavigate();
  const [forecast, setForecast] = useState(null);
  const [extendedForecast, setExtendedForecast] = useState([]);
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExtended, setShowExtended] = useState(false);

  // Apply saved theme
  const theme = localStorage.getItem("sp_theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);

  // 🌬️ Average wind direction (convert to 1–32 compass scale)
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

  // 📊 Helper function to calculate averages and scaling
  const calculateDailyAverages = (entries) => {
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const temps = entries.map((e) => e.main.temp);
    const directions = entries.map((e) => e.wind.deg);
    const humidities = entries.map((e) => e.main.humidity);
    const winds = entries.map((e) => e.wind.speed);
    const clouds = entries.map((e) => e.clouds.all);
    const pressures = entries.map((e) => e.main.pressure);
    const visibilities = entries.map((e) => e.visibility || 0);

    const avgClouds = avg(clouds);
    const avgVisibility = avg(visibilities);
    const avgPressure = avg(pressures);

    // ☁️ Scale clouds: 0–100 → 0–4
    const scaledClouds = Math.round((avgClouds / 100) * 4);
    const finalClouds = Math.min(Math.max(scaledClouds, 0), 4);

    // 👁️ Scale visibility: 0–10000 → 1–10 (√ curve for sensitivity)
    const visibilityScore = Math.pow(avgVisibility / 10000, 0.5) * 10;
    const finalVisibility = Math.min(Math.max(Math.round(visibilityScore), 1), 10);

    // 🔽 Convert pressure from hPa → inHg (1000 hPa ≈ 29.53 inHg)
    const pressureInHg = (avgPressure * 0.02953).toFixed(2);

    return {
      temp: Math.round(avg(temps)), // °C
      humidity: Math.round(avg(humidities)), // %
      wind_speed: (avg(winds) * 3.6).toFixed(1), // m/s → km/h
      winddirection: avgWindDirection(directions), // 1–32 scale
      clouds: finalClouds, // 0–4
      pressure: parseFloat(pressureInHg), // inHg
      visibility: finalVisibility, // 1–10
    };
  };

  // 🌦️ Fetch weather data
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
        setCity(`${data.city.name}, ${data.city.country}`);

        // Group forecast by day
        const grouped = data.list.reduce((acc, entry) => {
          const date = entry.dt_txt.split(" ")[0];
          acc[date] = acc[date] ? [...acc[date], entry] : [entry];
          return acc;
        }, {});

        const dates = Object.keys(grouped);
        const today = dates[0];
        const todayAvg = calculateDailyAverages(grouped[today]);

        setForecast({ date: today, ...todayAvg });

        const nextDays = dates.slice(1, 7).map((d) => ({
          date: d,
          ...calculateDailyAverages(grouped[d]),
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

  // 🔓 Handle sign-in unlock
  const handleUnlock = () => {
    const loggedIn = localStorage.getItem("user_logged_in");
    if (!loggedIn) {
      alert("Please sign in to unlock 6-day forecast!");
    } else {
      setShowExtended(true);
    }
  };

  return (
    <div className="wp-root">
      <h1 className="wp-title">Weather Forecast</h1>
      <p className="wp-description">
        Get a summarized 1-day forecast and unlock 6-day extended view after sign-in.
      </p>

      {/* 🔍 Input form */}
      <form className="wp-form" onSubmit={fetchWeatherData}>
        <label className="wp-label">Enter Location:</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="wp-input"
          placeholder="City, Country"
        />
        <div className="wp-btn-group">
          <button type="submit" className="wp-btn">
            Get Forecast
          </button>
          <button type="button" className="back-button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </form>

      {loading && <p className="loading">⏳ Loading forecast...</p>}

      {/* 🌤️ 1-Day Forecast */}
      {forecast && (
        <div className="forecast-results">
          <h2>📍 Forecast for {city}</h2>
          <h3>📅 1-Day Summary ({forecast.date})</h3>
          <div className="forecast-card">
            <p>🌡️ Avg Temp: {forecast.temp}°C</p>
            <p>💧 Humidity: {forecast.humidity}%</p>
            <p>💨 Wind Speed: {forecast.wind_speed} km/h</p>
            <p>🎯 Wind Direction (1–32): {forecast.winddirection}</p>
            <p>☁️ Cloud Cover: {forecast.clouds} out of 4</p>
            {/* <p>👁️ Visibility: {forecast.visibility} out of 10</p> */}
            <p>🔽 Pressure: {forecast.pressure} inHg</p>
          </div>

          <button className="unlock-btn" onClick={handleUnlock}>
            🔓 Unlock 6-Day Forecast (Sign In Required)
          </button>
        </div>
      )}

      {/* 📆 Extended Forecast */}
      {showExtended && extendedForecast.length > 0 && (
        <div className="forecast-results">
          <h3>📆 Extended 6-Day Forecast</h3>
          {extendedForecast.map((d, i) => (
            <div key={i} className="forecast-card">
              <h4>{d.date}</h4>
              <p>🌡️ Avg Temp: {d.temp}°C</p>
              <p>💧 Humidity: {d.humidity}%</p>
              <p>💨 Wind Speed: {d.wind_speed} km/h</p>
              <p>🎯 Wind Dir (1–32): {d.winddirection}</p>
              <p>☁️ Clouds: {d.clouds} / 4</p>
              <p>👁️ Visibility: {d.visibility} / 10</p>
              <p>🔽 Pressure: {d.pressure} inHg</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherPage;
