🌞 Solar Power Prediction SystemAn AI-powered Solar Power Output Prediction system that uses weather data and location info to predict solar power generation (kW) in real-time.⚡ Features✅ AI-Powered Predictions: Uses a Random Forest ML model trained on historical data to predict solar power output.✅ Full-Stack Integration: Real-time API communication between React (Frontend), Node.js (Backend), and Python (ML Engine).✅ Flask-Based ML API: Dedicated Python server to host the trained scaler.pkl and random_forest_model.pkl for predictions.✅ Data Normalization: Includes auto-scaling for visibility, pressure, and wind data to match the model's training.✅ CORS Enabled: Pre-configured for seamless cross-origin communication between the frontend, backend, and ML servers.🏗️ System ArchitectureThis project operates with three distinct services running concurrently: a React frontend, a Node.js backend, and a Python/Flask ML API.The data flows as follows:React.js (Frontend) sends a JSON request with weather/location data to the Node.js backend.Node.js (Backend) receives the request and forwards it to the Python Flask ML API.Flask (Python ML API) uses the loaded Scikit-learn model to make a prediction.The Predicted Power (kW) is returned to Node.js, which then sends it back to React to be displayed to the user.📂 Project StructureSolarPower-ML/
│
├── Front-end/            # React.js UI
│   ├── src/
│   │   ├── Components/
│   │   │   └── MainDashboard.jsx
│   │   │   └── TryModelPage.jsx
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── Back-end/             # Node.js + Express server
│   ├── index.js
│   ├── package.json
│   └── .env
│
└── ModelTrain-ML/        # Python ML model & Flask API
    ├── trainmodel.py       # Training script (Random Forest)
    ├── app.py              # Flask server (prediction API)
    ├── random_forest_model.pkl
    ├── scaler.pkl
    ├── feature_columns.csv
    └── Solar_Power_Prediction.csv
🚀 Getting StartedTo run this project, you will need to set up and run all three parts (ML Model, Backend, and Frontend) in separate terminal sessions.<details><summary><strong>1️⃣ Setup & Run: Python ML Server (Flask)</strong></summary>Navigate to the Model Directorycd ModelTrain-ML
Create and Activate a Virtual Environment# Mac/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
Install Python Dependenciespip install flask flask-cors scikit-learn pandas numpy joblib
Train the Model (First-time setup)This script will read Solar_Power_Prediction.csv and generate the following files:random_forest_model.pklscaler.pklfeature_columns.csvpython3 trainmodel.py
Run the Flask ServerThis will host your ML model at http://localhost:5000 (or as specified in app.py).python3 app.py
</details><details><summary><strong>2️⃣ Setup & Run: Node.js Backend (Express)</strong></summary>Navigate to the Backend Directorycd Back-end
Install Node.js Dependenciesnpm install
Create .env FileCreate a file named .env in the Back-end/ directory.It should contain the URL of your Flask API.# .env
FLASK_API_URL=http://localhost:5000/predict
Start the Node.js ServerThis will run the backend server (e.g., at http://localhost:3011).npm run dev
</details><details><summary><strong>3️⃣ Setup & Run: React.js Frontend</strong></summary>Navigate to the Frontend Directorycd Front-end
Install Node.js Dependenciesnpm install
Create .env FileCreate a file named .env in the Front-end/ directory.You need to provide your weather API key/URL and the URL of your Node.js backend.# .env
VITE_WEATHER_API_KEY=YOUR_OPENWEATHERMAP_API_KEY
VITE_WEATHER_BASE_URL=[https://api.openweathermap.org/data/2.5/forecast](https://api.openweathermap.org/data/2.5/forecast)
VITE_BACKEND_API_URL=http://localhost:3011/api/predict/solarpowerforecast
Start the React AppThis will run the frontend development server.npm run dev
Access the ApplicationOpen your browser and go to http://localhost:5173 (or the URL specified in your terminal).</details>📡 Example API Call (Postman)You can test the full API stack by sending a POST request to your Node.js backend:URL: POST http://localhost:3011/api/predict/solarpowerBody (JSON):{
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
Example Success Response:{
  "predicted_power_kW": 3.471
}
🖼️ Application ScreenshotsAs requested, here is a table to add your screenshots:FeatureScreenshotMain DashboardAdd your screenshot hereWeather Forecast InputAdd your screenshot herePrediction ResultsAdd your screenshot hereTry Model PageAdd your screenshot here👨‍💻 AuthorsHet Limbani - MERN + Python DeveloperAnuj Raval - Python Developer
