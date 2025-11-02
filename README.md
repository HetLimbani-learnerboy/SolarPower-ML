# 🌞 Solar Power Prediction System

An **AI-powered Solar Power Output Prediction System** that predicts real-time solar power generation (kW) using weather and location data through a trained Random Forest model.

---

## ⚡ Features
- 🤖 **AI Predictions:** Trained ML model for accurate solar output forecasting.  
- 🔗 **Full-Stack Integration:** React (Frontend) → Node.js (Backend) → Python (ML Engine).  
- 🧠 **Flask ML API:** Hosts `random_forest_model.pkl` & `scaler.pkl` for live inference.  
- 📊 **Data Normalization:** Auto-scaling for weather data to match training input.  
- 🌐 **CORS Enabled:** Smooth API communication across all layers.

---

## 🏗️ Architecture
React.js (Frontend)
↓ sends weather/location data
Node.js (Backend)
↓ forwards to Flask API
Flask (Python ML API)
↓ returns predicted solar power (kW)
React.js (Displays prediction)

yaml
Copy code

---

## 📂 Project Structure
SolarPower-ML/
├── Front-end/ # React.js UI
│ ├── src/Components/ (MainDashboard.jsx, TryModelPage.jsx)
│ └── package.json
│
├── Back-end/ # Node.js + Express server
│ ├── index.js
│ ├── .env
│ └── package.json
│
└── ModelTrain-ML/ # Python ML model + Flask API
├── trainmodel.py
├── app.py
├── random_forest_model.pkl
├── scaler.pkl
└── Solar_Power_Prediction.csv

yaml
Copy code

---

## 🚀 Quick Setup

### 1️⃣ Flask ML Server
```bash
cd ModelTrain-ML
python3 -m venv venv
source venv/bin/activate     # (Windows: venv\Scripts\activate)
pip install flask flask-cors scikit-learn pandas numpy joblib
python3 trainmodel.py        # generate model/scaler files
python3 app.py               # run Flask at http://localhost:5000
2️⃣ Node.js Backend
bash
Copy code
cd Back-end
npm install
# .env
FLASK_API_URL=http://localhost:5000/predict
npm run dev                  # run at http://localhost:3011
3️⃣ React Frontend
bash
Copy code
cd Front-end
npm install
# .env
VITE_WEATHER_API_KEY=YOUR_OPENWEATHERMAP_API_KEY
VITE_WEATHER_BASE_URL=https://api.openweathermap.org/data/2.5/forecast
VITE_BACKEND_API_URL=http://localhost:3011/api/predict/solarpowerforecast
npm run dev                  # run at http://localhost:5173
📡 Example API Call
POST: http://localhost:3011/api/predict/solarpower
Body:

json
Copy code
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

json
Copy code
{ "predicted_power_kW": 3.471 }
👨‍💻 Authors
Name	Role
Het Limbani	MERN + Python Developer
Anuj Raval	Python Developer

💡 Notes
Run all three servers (React, Node, Flask) together.

Keep ports consistent (5173 → 3011 → 5000).

Use flask_cors for cross-origin requests.

🏁 One-Command Summary
bash
Copy code
# Run Flask ML Server
cd ModelTrain-ML && source venv/bin/activate && python3 app.py

# Run Node Backend
cd Back-end && npm run dev

# Run React Frontend
cd Front-end && npm run dev
