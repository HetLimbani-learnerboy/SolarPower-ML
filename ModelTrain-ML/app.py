# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import pandas as pd
# import numpy as np
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import PolynomialFeatures, StandardScaler
# from sklearn.linear_model import LinearRegression, Ridge, Lasso
# from sklearn.tree import DecisionTreeRegressor
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.svm import SVR
# from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
# from sklearn.impute import KNNImputer
# import joblib
# import os

# app = Flask(__name__)
# CORS(app)

# MODEL_PATH = "random_forest_model.pkl"
# SCALER_PATH = "scaler.pkl"

# # ✅ Function to train model
# def train_model():
#     df = pd.read_csv("Solar_Power_Prediction.csv")
#     print("✅ Dataset loaded successfully!")

#     # Convert "Is Daylight" to numeric binary
#     df["Is Daylight"] = (
#         df["Is Daylight"]
#         .astype(str)
#         .str.upper()
#         .replace({"TRUE": 1, "FALSE": 0, "YES": 1, "NO": 0})
#         .astype(int)
#     )

#     # Handle daylight zero values
#     mask = (df["Is Daylight"] == 1) & (df["Power Generated"] == 0)
#     df.loc[mask, "Power Generated"] = np.nan

#     # Handle missing numeric values
#     numeric_df = df.select_dtypes(include=[np.number])
#     imputer = KNNImputer(n_neighbors=3)
#     df[numeric_df.columns] = imputer.fit_transform(numeric_df)

#     # Convert Power Generated from W → kW
#     df["Power Generated"] = df["Power Generated"] / 1000

#     # Group by Day
#     daily_power = (
#         df.groupby(["Year", "Month", "Day"], as_index=False)
#         .agg({
#             "Is Daylight": "max",
#             "Distance to Solar Noon": "mean",
#             "Average Temperature (Day)": "mean",
#             "Average Wind Direction (Day)": "mean",
#             "Average Wind Speed (Day)": "mean",
#             "Sky Cover": "mean",
#             "Visibility": "mean",
#             "Relative Humidity": "mean",
#             "Average Wind Speed (Period)": "mean",
#             "Average Barometric Pressure (Period)": "mean",
#             "Power Generated": "sum",
#         })
#     ).sort_values(by=["Year", "Month", "Day"]).reset_index(drop=True)

#     # Prepare data
#     drop_cols = ["Power Generated", "Year", "Average Wind Speed (Period)"]
#     X = daily_power.drop(columns=drop_cols)
#     y = daily_power["Power Generated"]

#     # Split and scale
#     X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
#     scaler = StandardScaler()
#     X_train_scaled = scaler.fit_transform(X_train)
#     X_test_scaled = scaler.transform(X_test)

#     # Train Random Forest
#     model = RandomForestRegressor(n_estimators=100, random_state=42)
#     model.fit(X_train_scaled, y_train)

#     # Evaluate
#     y_pred = model.predict(X_test_scaled)
#     r2 = r2_score(y_test, y_pred)
#     mae = mean_absolute_error(y_test, y_pred)
#     rmse = np.sqrt(mean_squared_error(y_test, y_pred))

#     # Save model + scaler
#     joblib.dump(model, MODEL_PATH)
#     joblib.dump(scaler, SCALER_PATH)

#     return {
#         "message": "Random Forest model trained successfully!",
#         "R2 Score": round(r2, 4),
#         "MAE": round(mae, 4),
#         "RMSE": round(rmse, 4),
#         "feature_count": X.shape[1]
#     }

# # ✅ Endpoint to train model
# @app.route('/train', methods=['GET'])
# def train():
#     result = train_model()
#     return jsonify(result)

# # ✅ Endpoint for prediction
# @app.route('/predict', methods=['POST'])
# def predict():
#     data = request.get_json()

#     if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
#         return jsonify({"error": "Model not trained yet. Please train first."}), 400

#     model = joblib.load(MODEL_PATH)
#     scaler = joblib.load(SCALER_PATH)

#     features = np.array(data["features"]).reshape(1, -1)
#     scaled_features = scaler.transform(features)
#     prediction = model.predict(scaled_features)[0]

#     return jsonify({"predicted_power_kW": round(float(prediction), 3)})


# @app.route('/', methods=['GET'])
# def home():
#     return jsonify({"message": "Solar Power Prediction API is running!"})

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8000, debug=True)


from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import os
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

MODEL_PATH = "random_forest_model.pkl"
SCALER_PATH = "scaler.pkl"
FEATURE_PATH = "feature_columns.csv"

print("Attempting to load model files...")
if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(FEATURE_PATH):
    print("❌ ERROR: Model files not found!")
    print(f"Make sure '{MODEL_PATH}', '{SCALER_PATH}', and '{FEATURE_PATH}' exist.")
    print("👉 You must run 'python trainmodel.py' first to create these files! 👈")
    model = None
    scaler = None
    feature_columns = []
else:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    feature_columns = pd.read_csv(FEATURE_PATH).columns.tolist()
    print("✅ Model, Scaler, and Features loaded successfully!")
    print(f"Expecting features: {feature_columns}")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "☀️ Solar Power Prediction Flask API is running!"})


@app.route("/predict", methods=["POST"])
def predict_power():
    if model is None or scaler is None:
        return jsonify({"error": "Model not loaded on server. Please check server logs."}), 500

    data = request.get_json()

    required_fields = [
        "Is Daylight",
        "Average Temperature (Day)",
        "Average Wind Direction (Day)",
        "Average Wind Speed (Day)",
        "Sky Cover",
        "Visibility",
        "Relative Humidity",
        "Average Barometric Pressure (Period)",
        "Month",
        "Day"
    ]

    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        input_dict = {
            "Is Daylight": data["Is Daylight"],
            # "Distance to Solar Noon": ❌ REMOVED
            "Average Temperature (Day)": data["Average Temperature (Day)"],
            "Average Wind Direction (Day)": data["Average Wind Direction (Day)"],
            "Average Wind Speed (Day)": data["Average Wind Speed (Day)"],
            "Sky Cover": data["Sky Cover"],
            "Visibility": data["Visibility"],
            "Relative Humidity": data["Relative Humidity"],
            "Average Barometric Pressure (Period)": data["Average Barometric Pressure (Period)"],
            "Month": data["Month"],
            "Day": data["Day"],
        }

        df_input = pd.DataFrame([input_dict])
        df_input = df_input.reindex(columns=feature_columns, fill_value=0)

        scaled_features = scaler.transform(df_input)
        predicted_kw = float(model.predict(scaled_features)[0])

        return jsonify({
            "predicted_power_kW": round(predicted_kw, 3),
            "input_used": input_dict
        })
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": "An error occurred during prediction.", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)