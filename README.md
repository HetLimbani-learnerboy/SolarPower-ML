🌞 Solar Power Prediction System

An AI-powered Solar Power Output Prediction System that predicts real-time solar power generation (kW) using weather and location data through a trained Random Forest model.

⚡ Features

🤖 AI Predictions: Trained ML model for accurate solar output forecasting.

🔗 Full-Stack Integration: React (Frontend) → Node.js (Backend) → Python (ML Engine).

🧠 Flask ML API: Hosts random_forest_model.pkl & scaler.pkl for live inference.

📊 Data Normalization: Auto-scaling for weather data to match training input.

🌐 CORS Enabled: Smooth API communication across all layers.

🏗️ Architecture

The system runs on three separate services: a React frontend for the user, a Node.js backend as a middle-man, and a Python Flask API to serve the ML model.

React.js (Frontend) sends weather/location data to the Node.js backend.

Node.js (Backend) receives the request and forwards it to the Flask API.

Flask (Python ML API) uses the trained model to make a prediction.

The predicted solar power (kW) is returned to Node.js, which then sends it back to React.js to be displayed to the user.

📂 Project Structure

SolarPower-ML/
│
├── Front-end/            # React.js UI (the pretty part)
│   ├── src/
│   │   ├── Components/
│   │   │   └── MainDashboard.jsx
│   │   │   └── TryModelPage.jsx
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── Back-end/             # Node.js + Express (the middle-man)
│   ├── index.js
│   ├── package.json
│   └── .env
│
└── ModelTrain-ML/        # Python ML (the brain)
    ├── trainmodel.py       # Script to train the brain
    ├── app.py              # Flask server that runs the brain
    ├── random_forest_model.pkl
    ├── scaler.pkl
    ├── feature_columns.csv
    └── Solar_Power_Prediction.csv


🚀 Quick Setup

You must run all three services in three separate terminals.

<details>
<summary><strong>1️⃣ Run the Flask ML Server (Terminal 1)</strong></summary>

cd ModelTrain-ML

python3 -m venv venv

source venv/bin/activate (or venv\Scripts\activate on Windows)

pip install flask flask-cors scikit-learn pandas numpy joblib

python3 trainmodel.py (Only needed once to generate model files)

python3 app.py

Server will run at http://localhost:5000

</details>

<details>
<summary><strong>2️⃣ Run the Node.js Backend (Terminal 2)</strong></summary>

cd Back-end

npm install

Create a .env file in this folder with the following content:

FLASK_API_URL=http://localhost:5000/predict


npm run dev

Server will run at http://localhost:3011

</details>

<details>
<summary><strong>3️⃣ Run the React Frontend (Terminal 3)</strong></summary>

cd Front-end

npm install

Create a .env file in this folder with the following content:

VITE_WEATHER_API_KEY=YOUR_OPENWEATHERMAP_API_KEY
VITE_WEATHER_BASE_URL=[https://api.openweathermap.org/data/2.5/forecast](https://api.openweathermap.org/data/2.5/forecast)
VITE_BACKEND_API_URL=http://localhost:3011/api/predict/solarpowerforecast


npm run dev

App will be available at http://localhost:5173

</details>

📡 Example API Call

You can test the full stack by sending a POST request to the Node.js backend:

URL: POST http://localhost:3011/api/predict/solarpower

Body:

{
  "IsDaylight": 1,
  "Average_Temperature": 29.8,
  "Average_Wind_Direction": 5,
  "Average_Wind_Speed": 4.2,
  "Sky_Cover": 2,
  "Visibility": 8,
  "Relative_Humidity": 65,
  "Average_Barometric_Pressure": 29.6,
  "Month": 10,
  "Day": 15
}


Response:

{
  "predicted_power_kW": 3.471
}


👨‍💻 Authors

Het Limbani: 🌞 Solar Power ML Integration | MERN + Python Developer

Anuj Raval: 🌞 Solar Power ML Integration | Python Developer

💡 Notes

Run all three servers (React, Node, Flask) at the same time for the app to work.

Keep the ports consistent (5173 → 3011 → 5000).

flask_cors is used in app.py to handle cross-origin requests from the Node.js backend.
