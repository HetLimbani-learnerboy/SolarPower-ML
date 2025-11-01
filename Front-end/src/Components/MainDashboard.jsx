import React, { useState } from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import "./MainDashboard.css";

// 1. Import the PDF libraries
import jsPDF from "jspdf";
import "jspdf-autotable";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = import.meta.env.VITE_WEATHER_BASE_URL;

const MainDashboard = () => {
  const [light, setLight] = useState(
    localStorage.getItem("sp_theme") === "light"
  );
  document.documentElement.setAttribute(
    "data-theme",
    light ? "light" : "dark"
  );

  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.setAttribute("data-theme", next ? "light" : "dark");
    localStorage.setItem("sp_theme", next ? "light" : "dark");
  };

  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [sixDayForecast, setSixDayForecast] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);

  const [predictionData, setPredictionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false); // PDF loading state

  // --- Helper Functions ---
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
      wind_speed_kmh: parseFloat(avgWind_kmh),
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

  // --- Data Fetching ---
  const fetchWeatherData = async (e) => {
    e.preventDefault();
    if (!location) return alert("Enter a city name!");
    setLoading(true);
    setPredictionData([]);
    setSelectedDays([]);
    const res = await fetch(`${BASE_URL}?q=${location}&appid=${API_KEY}&units=metric`);
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      return alert("City not found!");
    }
    setCity(`${data.city.name}, ${data.city.country}`);
    const lon = data.city.coord.lon;
    const lat = data.city.coord.lat;
    const grouped = data.list.reduce((acc, entry) => {
      const date = entry.dt_txt.split(" ")[0];
      acc[date] = acc[date] ? [...acc[date], entry] : [entry];
      return acc;
    }, {});
    const sixDays = Object.keys(grouped)
      .slice(0, 6)
      .map((d) => ({
        date: d,
        ...calculateDailyAverages(grouped[d], lon, lat),
      }));
    setSixDayForecast(sixDays);
    setLoading(false);
  };

  // --- Prediction ---
  const handlePredictSolar = async () => {
    if (selectedDays.length === 0)
      return alert("Select at least one day for prediction!");
    const selectedData = sixDayForecast.filter((d) =>
      selectedDays.includes(d.date)
    );
    const payloads = selectedData.map(day => {
      const forecastDate = new Date(day.date);
      return {
        "Is Daylight": 1,
        "Average Temperature (Day)": day.temp_c,
        "Average Wind Direction (Day)": day.winddirection,
        "Average Wind Speed (Day)": day.wind_speed_kmh,
        "Sky Cover": day.clouds,
        "Visibility": day.visibility,
        "Relative Humidity": day.humidity,
        "Average Barometric Pressure (Period)": day.pressure,
        "Month": forecastDate.getMonth() + 1,
        "Day": forecastDate.getDate(),
      };
    });
    const response = await fetch("http://localhost:3011/api/predict/solarpowerforecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloads),
    });
    const result = await response.json();
    if (response.ok) {
      const combinedData = selectedData.map((day, index) => ({
        ...day,
        power: result.predictions[index].predicted_power_kW,
      }));
      setPredictionData(combinedData);
    } else {
      alert("Prediction failed: " + (result.message || "Unknown error"));
    }
  };

  // 2. Helper function to get a chart's image data (MORE ROBUST)
  const getChartDataUrl = (chartId) => {
    return new Promise((resolve, reject) => {
      // We must add a brief timeout to allow the chart to render before capturing
      setTimeout(() => {
        const svg = document.getElementById(chartId)?.querySelector("svg");
        if (!svg) {
          reject(new Error(`Chart SVG with id ${chartId} not found. Ensure it is rendered.`));
          return;
        }

        try {
          const data = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          // ✅ Use getBoundingClientRect for more reliable dimensions
          const rect = svg.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            reject(new Error(`Chart ${chartId} has zero dimensions. Cannot capture.`));
            return;
          }
          canvas.width = rect.width;
          canvas.height = rect.height;

          const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);

          img.onload = () => {
            // Draw a white background for the chart
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL("image/png");
            URL.revokeObjectURL(url);
            resolve(dataUrl);
          };

          img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load image for chart ${chartId}. Error: ${err}`));
          };

          img.src = url;

        } catch (e) {
          reject(new Error(`Error serializing or drawing chart ${chartId}: ${e.message}`));
        }
      }, 1000); // ✅ Increased timeout to 1 second
    });
  };

  // 3. New PDF generation function
  const handleSavePDF = async () => {
    if (predictionData.length === 0) {
      alert("Please predict some data first!");
      return;
    }

    setIsDownloadingPDF(true); // Show loading state

    try {
      const doc = new jsPDF();

      // --- Add Title ---
      doc.text("Solar Power Prediction Report", 14, 15);
      doc.text(`City: ${city}`, 14, 22);

      // --- Define Table Data ---
      const head = [
        [
          "Date",
          "Prediction (kWh)",
          "Is Daylight",
          "Temp (°C)",
          "Wind Dir (1-32)",
          "Wind Spd (km/h)",
          "Clouds (0-4)",
          "Visibility (1-10)",
          "Humidity (%)",
          "Pressure (inHg)",
          "Month",
          "Day",
        ],
      ];

      const body = predictionData.map(day => {
        const forecastDate = new Date(day.date);
        return [
          day.date,
          day.power.toFixed(3),
          1,
          day.temp_c,
          day.winddirection,
          day.wind_speed_kmh,
          day.clouds,
          day.visibility,
          day.humidity,
          day.pressure,
          forecastDate.getMonth() + 1,
          forecastDate.getDate(),
        ];
      });

      // --- Add Table ---
      doc.autoTable({
        head: head,
        body: body,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
        styles: { fontSize: 7 },
      });

      // --- Add Charts ---
      doc.addPage();
      doc.text("Prediction Charts", 14, 15);

      // Get image data for all three charts
      const chart1Data = await getChartDataUrl("chart1");
      const chart2Data = await getChartDataUrl("chart2");
      const chart3Data = await getChartDataUrl("chart3");
      const chartWidth = 65;
      const chartHeight = 45;
      const chartY = 25;
      const margin = 10;

      doc.addImage(chart1Data, "PNG", margin, chartY, chartWidth, chartHeight);
      doc.addImage(chart2Data, "PNG", margin + chartWidth + 5, chartY, chartWidth, chartHeight);
      doc.addImage(chart3Data, "PNG", margin + chartWidth * 2 + 10, chartY, chartWidth, chartHeight);

      // --- Save PDF ---
      doc.save("solar_prediction_report.pdf");

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. See console for details.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const toggleDaySelection = (date) => {
    setSelectedDays((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date]
    );
  };


  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <h1 className="dashboard-title typewriter">Welcome Solar Weather Dashboard 🚀</h1>
        <div className="header-actions">
          <button className="profile-btn" onClick={() => setShowProfile(true)}>
            👤 User Profile
          </button>
          <button onClick={toggleTheme} className="lp-toggle">
            {light ? "🌙 Dark" : "☀️ Light"}
          </button>
          <button className="logout-btn" onClick={() => {
            localStorage.clear();
            window.location.href = "/signinpage";
          }}>
            🔒 Logout
          </button>
        </div>
      </header>

      <form onSubmit={fetchWeatherData} className="wp-form">
        <h2>Enter Location:</h2>
        <input
          type="text"
          placeholder="Enter City Name"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="wp-input"
        />
        <button type="submit" className="wp-btn">
          Get Forecast
        </button>
      </form>

      {loading && <p className="loading">⏳ Fetching forecast...</p>}

      {sixDayForecast.length > 0 && (
        <>
          <h2 className="forecast-title">🌤️ 6-Day Extended Forecast</h2>
          <div className="forecast-grid">
            {sixDayForecast.map((day) => (
              <div
                key={day.date}
                className={`forecast-card ${selectedDays.includes(day.date) ? "selected" : ""}`}
                onClick={() =>
                  setSelectedDays((prev) =>
                    prev.includes(day.date)
                      ? prev.filter((d) => d !== day.date)
                      : [...prev, day.date]
                  )
                }
              >
                <div className="forecast-header">
                  <input type="checkbox" checked={selectedDays.includes(day.date)} readOnly />
                  <h4>{day.date}</h4>
                </div>
                <p> Temperature: {day.temp_c}°C ({day.temp_f}°F) </p>
                <p>Humidity: {day.humidity}%</p>
                <p>Wind Speed: {day.wind_speed_kmh} km/h</p>
                <p>Wind Direction: {day.winddirection}°</p>
                <p>Clouds: {day.clouds}</p>
                <p>Visibility: {day.visibility} Out of 10</p>
                <p>Pressure: {day.pressure} inHg</p>
              </div>
            ))}
          </div>

          <button onClick={handlePredictSolar} className="unlock-btn">
            ⚡ Predict Solar Power
          </button>
        </>
      )}


      {/* --- Prediction Results --- */}
      {predictionData.length > 0 && (
        <div className="prediction-results">
          <div className="results-header">
            <h2>🔆 Solar Power Predictions</h2>
            {/* ✅ Cleaned PDF Button */}
            <button
              onClick={handleSavePDF}
              className="wp-btn"
              disabled={isDownloadingPDF}
            >
              {isDownloadingPDF ? "📥 Generating PDF..." : "📥 Save Report as PDF"}
            </button>
          </div>
          <h3>Predictied Power Output:</h3>

          {predictionData.map((p) => (
            <p key={p.date}>📅 {p.date}: ⚡ {p.power.toFixed(2)} kWh</p>
          ))}

          <div className="charts-container">
            {/* Graph 1: Power Comparison */}
            <div id="chart1">
              <h3>📊 Power Output Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="power" stroke="#facc15" name="Predicted Power (kWh)" />
                  <Line type="monotone" dataKey="temp_c" stroke="#3b82f6" name="Temperature (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Graph 2: Cloud vs Power */}
            <div id="chart2">
              <h3>☁️ Cloud Impact on Power</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="power" fill="#facc15" name="Power (kWh)" />
                  <Bar dataKey="clouds" fill="#60a5fa" name="Clouds (0-4)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Graph 3: Wind vs Power */}
            <div id="chart3">
              <h3>💨 Wind Speed vs Power Output</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="power" stroke="#facc15" name="Power (kWh)" />
                  <Line type="monotone" dataKey="wind_speed_kmh" stroke="#10b981" name="Wind (km/h)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- Profile Modal --- */}
      {showProfile && (
        <div className="profile-modal">
          <div className="modal-content">
            <h3>User Profile</h3>
            <h4>Name: {localStorage.getItem("fullname")}</h4>
            <h4>Email: {localStorage.getItem("email")}</h4>
            <p>Select forecast days to predict solar output.</p>
            <div className="modal-checkboxes">
              {sixDayForecast.map((day, idx) => (
                <label key={idx}>
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day.date)}
                    onChange={() => toggleDaySelection(day.date)}
                  />{" "}
                  {day.date}
                </label>
              ))}
            </div>
            <button className="close-btn" onClick={() => setShowProfile(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboard;
