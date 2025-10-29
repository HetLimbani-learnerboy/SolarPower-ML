import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Landingpagestyle.css";
import solarImage from "../assets/SolarPowerImg.png";

const Landingpage = () => {
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("sp_theme");
    if (saved) {
      setDark(saved === "dark");
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefersDark);
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    const val = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", val);
    localStorage.setItem("sp_theme", val);
  };

  return (
    <main className="lp-root">
      <div className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-sun" />
          <div className="lp-cloud lp-cloud-1" />
          <div className="lp-cloud lp-cloud-2" />
          <div className="lp-cloud lp-cloud-3" />
        </div>

        <header className="lp-header">
          <div className="lp-brand">
            <h1 className="lp-title">SolarPower Forecaster ☀️</h1>
            <p className="lp-tag">Machine learning + real-time weather → reliable solar energy forecasts</p>
          </div>

          <div className="lp-actions">
            <button className="lp-btn lp-ghost" aria-label="Log in" onClick={() => navigate('/signinpage')}>Log In</button>
            <button className="lp-btn lp-ghost" aria-label="Sign up" onClick={() => navigate('/signuppage')}>Sign Up</button>
            <button className="lp-btn lp-primary" aria-label="Get forecast" onClick={()=>navigate('/weatherpage')}>Get Forecast</button>
            <a href="#features" className="lp-btn lp-link" aria-label="Learn more">Learn More ↓</a>
            <button
              className="lp-toggle"
              onClick={toggleTheme}
              aria-pressed={dark}
              aria-label="Toggle dark mode"
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </header>

        <section className="lp-hero-content">
          <div className="lp-hero-left">
            <h2 className="lp-hero-heading">Predict, visualize and optimize your solar energy ⚡️</h2>
            <p className="lp-hero-lead">
              Built with React, Node.js and Python ML — integrate weather APIs, visualize predictions and export reports. Ideal for demonstration and production. 💻
            </p>

            <div className="lp-cta-row">
              <button className="lp-btn lp-primary">Try Demo</button>
              <a
                className="lp-btn lp-outline"
                href="https://github.com/HetLimbani-learnerboy/SolarPower-ML.git"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Repo
              </a>

            </div>
          </div>

          <figure className="lp-hero-right" aria-hidden="true">
            <img src={solarImage} alt="Solar panel dashboard illustration" className="lp-hero-image" />
          </figure>
        </section>
      </div>

      <section id="features" className="lp-features">
        <div className="lp-container">
          <h3 className="lp-section-title">How it works 🚀</h3>
          <p className="lp-section-sub">Combine historical data, live weather, and ML models to estimate solar output with confidence intervals.</p>

          <div className="lp-grid">
            <article className="lp-card">
              <h4>🤖 AI-Powered Predictions</h4>
              <p>1. Multiple models (Linear, RandomForest, XGBoost, LSTM) with model comparison and metrics (MAE, RMSE, R²).</p>
            </article>

            <article className="lp-card">
              <h4>🌦️ Weather API Integration</h4>
              <p>2. Plug in OpenWeatherMap, Meteostat or NASA Power — uses cloud cover, irradiance and temperature in predictions.</p>
            </article>

            <article className="lp-card">
              <h4>📈 Interactive Dashboard</h4>
              <p>3. Actual vs. predicted charts, download CSV/PDF reports, and an exportable summary for stakeholders.</p>
            </article>
          </div>

          <div className="lp-team">
            <h4 className="lp-team-title">Project By</h4>
            <p className="lp-team-names">Anuj Raval &amp; Het Limbani — <strong>Adani University</strong></p>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <small>&copy; 2025 SolarPower Forecaster. All rights reserved.</small>
        </div>
      </footer>
    </main>
  );
};

export default Landingpage;
