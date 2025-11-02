 ☀️ Solar Power Prediction System (MERN + Python ML): 
An AI-powered Solar Power Output Prediction system that uses weather data + location info to predict solar power generation (kW) in real time.
Built with:

1. Frontend: React.js
2. Backend: Node.js + Express
3. ML Engine: Python (Flask + Scikit-learn + Random Forest)

📂 Project Structure
SolarPower-ML/
│
├── Front-end/                # React.js UI
│   ├── src/
│   │   ├──Components/
│   │   │   └── MainDashboard.jsx
│   │   │   └── TryModelPage.jsx
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── Back-end/                # Node.js + Express server
│   ├── index.js
│   ├── package.json
│   └── .env
│
└── ModelTrain-ML/           # Python ML model & Flask API
    ├── trainmodel.py        # Training script (Random Forest)
    ├── app.py               # Flask server (prediction API)
    ├── random_forest_model.pkl
    ├── scaler.pkl
    ├── feature_columns.csv
    └── Solar_Power_Prediction.csv

⚡ Features

✅ Predict solar power generation based on live weather data
✅ Real-time API integration between Node.js ↔ Python ↔ React
✅ Flask-based ML API using trained Random Forest model
✅ Auto-scaling, visibility, pressure & wind normalization
✅ Cross-Origin (CORS) supported for seamless communication

🧠 Model Training (Python)
1️⃣ Setup Python Environment
cd ModelTrain-ML
python3 -m venv venv
source venv/bin/activate     # (Mac/Linux)
venv\Scripts\activate        # (Windows)

2️⃣ Install Dependencies
pip install flask flask-cors scikit-learn pandas numpy joblib

3️⃣ Train Model
python3 trainmodel.py
--> This will generate:
random_forest_model.pkl
scaler.pkl
feature_columns.csv

4️⃣ Run Flask Server
python3 app.py

How to run:
🌤️ Frontend (React.js)
1️⃣ Navigate to Frontend
cd Frontend

2️⃣ Install Dependencies
npm install

3️⃣ Create .env File
VITE_WEATHER_API_KEY=YOUR_API_KEY
VITE_WEATHER_BASE_URL= YOUR_BASE_URL

4️⃣ Start React App
npm run dev


The app will run on:
👉 http://localhost:5173

🔁 Full Workflow
React.js (Frontend) 
     ↓ (POST /api/predict/solarpower)
Node.js (Backend)
     ↓ (calls Flask via HTTP)
Flask (Python ML API)
     ↓
Random Forest Model → Predicted Power (kW)
     ↓
Node.js → React.js → Display result

📡 Example API Call (Postman)

POST http://localhost:3011/api/predict/solarpower

Body (JSON):

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

1️⃣ Start Python Flask server
cd ModelTrain-ML
python3 app.py

2️⃣ Start Node backend
cd Back-end
npm run dev

3️⃣ Start React frontend
cd Frontend
npm run dev

👨‍💻 Author
1. Het Limbani
🌞 Solar Power ML Integration | MERN + Python Developer
2: Anuj Raval
🌞 Solar Power ML Integration | Python Developer

