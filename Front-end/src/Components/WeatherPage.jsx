import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./WeatherPage.css";

const API_KEY = "b960d4c56b35feccf353975a4257aab2";
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

export default function WeatherApp() {
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchWeather = async () => {
    if (!city) {
      setError("Please enter a city name.");
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}weather`, {
        params: { q: city, appid: API_KEY, units: "metric" },
      });
      setWeatherData(response.data);
      setError("");
    } catch {
      setError("City not found or API error.");
      setWeatherData(null);
    }
  };

  return (
    <div className="weather-container">
      <h1 className="weather-title">🌤️ City Weather Dashboard</h1>

      <div className="input-section">
        <input
          type="text"
          placeholder="Enter city name (e.g. Ahmedabad)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="city-input"
        />
        <button onClick={fetchWeather} className="get-btn">
          Get Weather
        </button>
        <button onClick={()=>navigate(-1)} className="get-btn">Back to Home</button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {weatherData && (
        <div className="weather-card">
          <h2>
            {weatherData.name}, {weatherData.sys.country}
          </h2>
          <table className="weather-table">
            <tbody>
              <tr>
                <td>🌍 Longitude</td>
                <td>{weatherData.coord.lon}</td>
              </tr>
              <tr>
                <td>🌎 Latitude</td>
                <td>{weatherData.coord.lat}</td>
              </tr>
              <tr>
                <td>🌡️ Temperature</td>
                <td>{weatherData.main.temp}°C</td>
              </tr>
              <tr>
                <td>🤒 Feels Like</td>
                <td>{weatherData.main.feels_like}°C</td>
              </tr>
              <tr>
                <td>🔼 Max Temp</td>
                <td>{weatherData.main.temp_max}°C</td>
              </tr>
              <tr>
                <td>🔽 Min Temp</td>
                <td>{weatherData.main.temp_min}°C</td>
              </tr>
              <tr>
                <td>💧 Humidity</td>
                <td>{weatherData.main.humidity}%</td>
              </tr>
              <tr>
                <td>⚡ Pressure</td>
                <td>{weatherData.main.pressure} hPa</td>
              </tr>
              <tr>
                <td>🌬️ Wind Speed</td>
                <td>{weatherData.wind.speed} m/s</td>
              </tr>
              <tr>
                <td>🌪️ Wind Direction</td>
                <td>{weatherData.wind.deg}°</td>
              </tr>
              <tr>
                <td>☁️ Clouds</td>
                <td>{weatherData.clouds.all}%</td>
              </tr>
              <tr>
                <td>🌤️ Description</td>
                <td>{weatherData.weather[0].description}</td>
              </tr>
              <tr>
                <td>📍 Visibility</td>
                <td>{weatherData.visibility} m</td>
              </tr>
              <tr>
                <td>🌅 Sunrise</td>
                <td>{new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}</td>
              </tr>
              <tr>
                <td>🌇 Sunset</td>
                <td>{new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
