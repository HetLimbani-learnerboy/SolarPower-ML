import os
import random
import datetime
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
import pandas as pd
import joblib
import numpy as np
from bson.objectid import ObjectId
from sklearn.impute import KNNImputer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# -------------------------------------------------------------------
# 🌞 Load environment + Flask setup
# -------------------------------------------------------------------
load_dotenv()
app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# -------------------------------------------------------------------
# 🗄️ MongoDB Connection
# -------------------------------------------------------------------
mongo_uri = os.environ.get("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["SolarPower-ML"]
users_collection = db["users"]

# -------------------------------------------------------------------
# 📧 Resend API Setup (Replaces Flask-Mail)
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("EMAIL_FROM") or "SolarPower-ML <no-reply@resend.dev>"

def send_email(to_email, otp, subject):
    """Send OTP Email using Resend API (HTTPS-based)."""
    html_content = f"""
    <div style="font-family: Arial; font-size:16px; color:#222; background:#f9f9f9; padding:20px; border-radius:8px;">
        <h2 style="color:#007BFF;">{subject}</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="letter-spacing:2px;">{otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <hr>
        <p>Best Regards,<br><strong>SolarPower-ML Team ☀️</strong></p>
    </div>
    """
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }

    try:
        r = requests.post("https://api.resend.com/emails", headers=headers, json=payload)
        if r.status_code not in [200, 202]:
            print("❌ Resend API Error:", r.text)
            raise Exception(r.text)
        print(f"✅ OTP email sent to {to_email}")
    except Exception as e:
        print("❌ Email send failed:", e)
        raise

# -------------------------------------------------------------------
# 🤖 ML Model Loading
# -------------------------------------------------------------------
MODEL_PATH = "random_forest_model.pkl"
SCALER_PATH = "scaler.pkl"
FEATURE_PATH = "feature_columns.csv"

print("Attempting to load model files...")
if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(FEATURE_PATH):
    print("❌ Model files missing. Please run 'trainmodel.py' first.")
    model, scaler, feature_columns = None, None, []
else:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    feature_columns = pd.read_csv(FEATURE_PATH).columns.tolist()
    print("✅ Model, Scaler, and Feature Columns Loaded")

# -------------------------------------------------------------------
# 🔧 Utility Functions
# -------------------------------------------------------------------
def generate_otp():
    """Generate a random 6-digit OTP"""
    return str(random.randint(100000, 999999))


def train_model():
    """Train Random Forest model for Solar Power Prediction"""
    df = pd.read_csv("Solar_Power_Prediction.csv")
    print("✅ Dataset loaded successfully!")

    df["Is Daylight"] = df["Is Daylight"].astype(str).str.upper().replace({"TRUE": 1, "FALSE": 0, "YES": 1, "NO": 0}).astype(int)
    mask = (df["Is Daylight"] == 1) & (df["Power Generated"] == 0)
    df.loc[mask, "Power Generated"] = np.nan

    numeric_df = df.select_dtypes(include=[np.number])
    imputer = KNNImputer(n_neighbors=3)
    df[numeric_df.columns] = imputer.fit_transform(numeric_df)

    df["Power Generated"] = df["Power Generated"] / 1000  

    daily_power = (
        df.groupby(["Year", "Month", "Day"], as_index=False)
        .agg({
            "Is Daylight": "max",
            "Average Temperature (Day)": "mean",
            "Average Wind Direction (Day)": "mean",
            "Average Wind Speed (Day)": "mean",
            "Sky Cover": "mean",
            "Visibility": "mean",
            "Relative Humidity": "mean",
            "Average Barometric Pressure (Period)": "mean",
            "Power Generated": "sum"
        })
        .sort_values(by=["Year", "Month", "Day"])
    )

    X = daily_power.drop(columns=["Power Generated", "Year"])
    y = daily_power["Power Generated"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    pd.DataFrame(X.columns).to_csv(FEATURE_PATH, index=False)

    return {
        "message": "Model trained successfully!",
        "R2 Score": round(r2, 4),
        "MAE": round(mae, 4),
        "RMSE": round(rmse, 4),
        "feature_count": len(X.columns)
    }

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "☀️ SolarPower-ML Flask API (Auth + ML) is Running!"})

@app.route("/predict", methods=["POST"])
def predict_power():
    """Predict solar power output using ML model"""
    if not model or not scaler:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.get_json()
    required_fields = [
        "Is Daylight", "Average Temperature (Day)", "Average Wind Direction (Day)",
        "Average Wind Speed (Day)", "Sky Cover", "Visibility", "Relative Humidity",
        "Average Barometric Pressure (Period)", "Month", "Day"
    ]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    df = pd.DataFrame([{key: data[key] for key in required_fields}])
    df = df.reindex(columns=feature_columns, fill_value=0)
    scaled = scaler.transform(df)
    predicted_kw = float(model.predict(scaled)[0])

    return jsonify({
        "predicted_power_kW": round(predicted_kw, 3),
        "input_used": data
    })


# -------------------------------------------------------------------
# 🧾 SIGNUP - Register User and Send OTP
# -------------------------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    fullname, email, password = data.get("fullname"), data.get("email"), data.get("password")

    if not fullname or not email or not password:
        return jsonify({"message": "Please fill all required fields"}), 400

    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        if existing_user.get("isverified"):
            return jsonify({"message": "User already exists"}), 400
        else:
            users_collection.delete_one({"email": email})

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    otp = generate_otp()
    otp_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

    new_user = {
        "fullname": fullname,
        "email": email,
        "password": hashed_pw,
        "isverified": False,
        "otp": otp,
        "otpExpiry": otp_expiry
    }
    user_id = str(users_collection.insert_one(new_user).inserted_id)

    try:
        send_email(email, otp, "Verify your SolarPower-ML Account")
    except Exception:
        return jsonify({"message": "Failed to send OTP email"}), 500

    return jsonify({
        "message": "User registered successfully. OTP sent to email.",
        "user": {"id": user_id, "fullname": fullname, "email": email}
    }), 201

# -------------------------------------------------------------------
# 🔁 RESEND OTP
# -------------------------------------------------------------------
@app.route("/api/signup/resend-otp/<string:user_id>", methods=["GET"])
def resend_otp(user_id):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return jsonify({"message": "Invalid user ID"}), 400

    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.get("isverified"):
        return jsonify({"message": "User already verified"}), 400

    otp = generate_otp()
    otp_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"otp": otp, "otpExpiry": otp_expiry}}
    )

    try:
        send_email(user["email"], otp, "Resend: Verify your SolarPower-ML Account")
    except Exception:
        return jsonify({"message": "Failed to resend OTP"}), 500

    return jsonify({"message": "OTP resent successfully"}), 200

# SINGLE DAY SOLAR POWER PREDICTION (TryModelPage)
@app.route("/api/predict/solarpower", methods=["POST"])
def predict_single_day():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(FEATURE_PATH):
        return jsonify({"error": "Model not trained yet. Please run trainmodel.py first."}), 400

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    feature_columns = pd.read_csv(FEATURE_PATH).columns.tolist()

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data received"}), 400

    missing = [f for f in feature_columns if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        df_input = pd.DataFrame([{col: data[col] for col in feature_columns}])
        scaled_features = scaler.transform(df_input)
        predicted_kw = float(model.predict(scaled_features)[0])

        return jsonify({
            "predicted_power_kW": round(predicted_kw, 3),
            "input_used": data
        }), 200

    except Exception as e:
        print("❌ Error during single-day prediction:", e)
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500


@app.route("/api/predict/solarpowerforecast", methods=["POST"])
def predict_multiple_days():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(FEATURE_PATH):
        return jsonify({"error": "Model not trained yet. Please run trainmodel.py first."}), 400

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    feature_columns = pd.read_csv(FEATURE_PATH).columns.tolist()

    payload = request.get_json()
    if not isinstance(payload, list) or len(payload) == 0:
        return jsonify({"error": "Request body must be a non-empty JSON array"}), 400

    predictions = []

    try:
        for day_data in payload:
            missing = [f for f in feature_columns if f not in day_data]
            if missing:
                return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
            
            df_input = pd.DataFrame([{col: day_data[col] for col in feature_columns}])
            scaled_features = scaler.transform(df_input)
            predicted_kw = float(model.predict(scaled_features)[0])

            predictions.append({
                "input": day_data,
                "predicted_power_kW": round(predicted_kw, 3)
            })

        return jsonify({"predictions": predictions}), 200

    except Exception as e:
        print("❌ Error predicting solar power:", e)
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500


# -------------------------------------------------------------------
# ✅ VERIFY OTP
# -------------------------------------------------------------------
@app.route("/api/signup/verify/<string:user_id>", methods=["POST"])
def verify_email(user_id):
    data = request.get_json()
    otp = data.get("otp")

    if not otp:
        return jsonify({"message": "OTP is required"}), 400

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return jsonify({"message": "Invalid user ID"}), 400

    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.get("isverified"):
        return jsonify({"message": "User already verified"}), 400
    if datetime.datetime.utcnow() > user["otpExpiry"]:
        return jsonify({"message": "OTP expired. Please resend OTP"}), 400
    if user["otp"] != otp:
        return jsonify({"message": "Invalid OTP"}), 400

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"isverified": True, "otp": None, "otpExpiry": None}}
    )

    return jsonify({
        "message": "Email verified successfully!",
        "user": {"id": str(user["_id"]), "fullname": user["fullname"], "email": user["email"]}
    }), 200

# -------------------------------------------------------------------
# 🔑 SIGNIN
# -------------------------------------------------------------------
@app.route("/api/signin", methods=["POST"])
def signin():
    data = request.get_json()
    email, password = data.get("email"), data.get("password")

    if not email or not password:
        return jsonify({"message": "Please enter all required fields"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"message": "User does not exist"}), 401
    if not user.get("isverified", False):
        users_collection.delete_one({"email": email})
        return jsonify({"message": "Email not verified. Please sign up again."}), 403
    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {"id": str(user["_id"]), "fullname": user["fullname"], "email": user["email"]}
    }), 200


@app.route("/api/signin/emailnotverified", methods=["DELETE"])
def delete_unverified_user():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    try:
        result = users_collection.find_one_and_delete({"email": email, "isverified": False})

        if not result:
            return jsonify({"message": "No unverified user found with this email"}), 404

        return jsonify({"message": "Unverified user deleted successfully"}), 200

    except Exception as e:
        print("Error deleting unverified user:", e)
        return jsonify({"message": "Server error"}), 500


@app.route("/api/signin/forgotpassword/auth", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")
    if not email:
        return jsonify({"message": "Email is required"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found. Please sign up first."}), 404

    otp = generate_otp()
    otp_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    users_collection.update_one({"email": email}, {"$set": {"otp": otp, "otpExpiry": otp_expiry}})

    try:
        send_email(email, otp, "SolarPower-ML Password Reset OTP")
    except Exception:
        return jsonify({"message": "Failed to send OTP email"}), 500

    return jsonify({"message": "Password reset OTP sent successfully"}), 200

@app.route("/api/signin/forgotpassword/verify", methods=["POST"])
def verify_forgot_otp():
    data = request.get_json()
    email, otp = data.get("email"), data.get("otp")

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.get("otp") != otp:
        return jsonify({"message": "Invalid OTP"}), 400
    if datetime.datetime.utcnow() > user["otpExpiry"]:
        return jsonify({"message": "OTP expired"}), 400

    return jsonify({"message": "OTP verified"}), 200

@app.route("/api/signin/forgotpassword/reset", methods=["PATCH"])
def reset_password():
    data = request.get_json()
    email, otp, password = data.get("email"), data.get("otp"), data.get("password")

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.get("otp") != otp:
        return jsonify({"message": "Invalid OTP"}), 400
    if datetime.datetime.utcnow() > user["otpExpiry"]:
        return jsonify({"message": "OTP expired"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_pw, "otp": None, "otpExpiry": None}}
    )
    return jsonify({"message": "Password reset successful"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
