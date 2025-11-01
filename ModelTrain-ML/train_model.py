# # import numpy as np
# # import joblib
# # import pandas as pd
# # from sklearn.model_selection import train_test_split
# # from sklearn.preprocessing import PolynomialFeatures, StandardScaler
# # from sklearn.linear_model import LinearRegression, Ridge, Lasso
# # from sklearn.tree import DecisionTreeRegressor
# # from sklearn.ensemble import RandomForestRegressor
# # from sklearn.svm import SVR
# # from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
# # from sklearn.impute import KNNImputer

# # # ======================================
# # # 1️⃣ Load and Clean Data
# # # ======================================
# # df = pd.read_csv("Solar_Power_Prediction.csv")
# # print("Dataset loaded successfully!\n")

# # # Convert "Is Daylight" to numeric binary (1/0)
# # df["Is Daylight"] = (
# #     df["Is Daylight"]
# #     .astype(str)
# #     .str.upper()
# #     .replace({"TRUE": 1, "FALSE": 0, "YES": 1, "NO": 0})
# #     .astype(int)
# # )

# # # If Power Generated = 0 during daylight, mark as NaN
# # mask = (df["Is Daylight"] == 1) & (df["Power Generated"] == 0)
# # df.loc[mask, "Power Generated"] = np.nan
# # # print(f"⚡ Converted {mask.sum()} daylight-zero Power values to NaN")

# # # Handle missing numeric values using KNN imputer
# # numeric_df = df.select_dtypes(include=[np.number])
# # imputer = KNNImputer(n_neighbors=3)
# # df[numeric_df.columns] = imputer.fit_transform(numeric_df)
# # # print("✅ Missing values handled using KNN Imputer")

# # # Convert Power Generated from W → kW
# # df["Power Generated"] = df["Power Generated"] / 1000

# # # ======================================
# # # 2️⃣ Group by Day (Aggregate Features)
# # # ======================================
# # daily_power = (
# #     df.groupby(["Year", "Month", "Day"], as_index=False)
# #     .agg({
# #         "Is Daylight": "max",
# #         "Distance to Solar Noon": "mean",
# #         "Average Temperature (Day)": "mean",
# #         "Average Wind Direction (Day)": "mean",
# #         "Average Wind Speed (Day)": "mean",
# #         "Sky Cover": "mean",
# #         "Visibility": "mean",
# #         "Relative Humidity": "mean",
# #         "Average Wind Speed (Period)":"mean",
# #         "Average Barometric Pressure (Period)": "mean",
# #         "Power Generated": "sum",
# #     })
# # )

# # # Sort chronologically
# # daily_power = daily_power.sort_values(by=["Year", "Month", "Day"]).reset_index(drop=True)

# # # print("\n✅ Grouped Power Data with Daily Aggregates:")
# # # print(daily_power.head())
# # # print(pd.DataFrame(daily_power))

# # # ======================================
# # # 3️⃣ Prepare Data for Training
# # # ======================================
# # # Drop unnecessary columns (year identifiers and unused features)
# # drop_cols = ["Power Generated", "Year","Average Wind Speed (Period)"]

# # X = daily_power.drop(columns=drop_cols)
# # y = daily_power["Power Generated"]

# # # Split data (80% training, 20% testing)
# # X_train, X_test, y_train, y_test = train_test_split(
# #     X, y, test_size=0.2, random_state=42
# # )

# # # Scale features
# # scaler = StandardScaler()
# # X_train_scaled = scaler.fit_transform(X_train)
# # X_test_scaled = scaler.transform(X_test)

# # # ======================================
# # # 4️⃣ Define Models
# # # ======================================
# # models = {
# #     "Linear Regression": LinearRegression(),
# #     "Polynomial Regression": LinearRegression(),
# #     "Ridge Regression": Ridge(alpha=1.0),
# #     "Lasso Regression": Lasso(alpha=0.01),
# #     "Decision Tree": DecisionTreeRegressor(random_state=42),
# #     "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
# #     "Support Vector Machine": SVR(kernel='rbf')
# # }

# # # Polynomial transformation
# # poly = PolynomialFeatures(degree=2)
# # X_train_poly = poly.fit_transform(X_train_scaled)
# # X_test_poly = poly.transform(X_test_scaled)

# # # ======================================
# # # 5️⃣ Train & Evaluate
# # # ======================================
# # results = []

# # for name, model in models.items():
# #     if name == "Polynomial Regression":
# #         model.fit(X_train_poly, y_train)
# #         y_train_pred = model.predict(X_train_poly)
# #         y_test_pred = model.predict(X_test_poly)
# #     else:
# #         model.fit(X_train_scaled, y_train)
# #         y_train_pred = model.predict(X_train_scaled)
# #         y_test_pred = model.predict(X_test_scaled)

# #     # Train metrics
# #     train_mae = mean_absolute_error(y_train, y_train_pred)
# #     train_mse = mean_squared_error(y_train, y_train_pred)
# #     train_rmse = np.sqrt(train_mse)
# #     train_r2 = r2_score(y_train, y_train_pred)

# #     # Test metrics
# #     test_mae = mean_absolute_error(y_test, y_test_pred)
# #     test_mse = mean_squared_error(y_test, y_test_pred)
# #     test_rmse = np.sqrt(test_mse)
# #     test_r2 = r2_score(y_test, y_test_pred)

# #     results.append([
# #         name, train_mae, train_mse, train_rmse, train_r2,
# #         test_mae, test_mse, test_rmse, test_r2
# #     ])


# # # Save only the best-performing model (Random Forest)
# # best_model = models["Random Forest"]

# # # Fit again on full scaled dataset
# # best_model.fit(scaler.transform(X), y)

# # joblib.dump(best_model, "random_forest_model.pkl")
# # joblib.dump(scaler, "scaler.pkl")
# # X.to_csv("feature_columns.csv", index=False)

# # print("\n✅ Random Forest model, scaler, and feature columns saved successfully!")



# # # ======================================
# # # 6️⃣ Display Results
# # # ======================================
# # results_df = pd.DataFrame(results, columns=[
# #     "Model", "Train MAE", "Train MSE", "Train RMSE", "Train R²",
# #     "Test MAE", "Test MSE", "Test RMSE", "Test R²"
# # ])

# # print("\n📊 Model Train vs Test Performance Comparison:")
# # print(results_df.to_string(index=False))

# import numpy as np
# import joblib
# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import StandardScaler
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
# from sklearn.impute import KNNImputer

# # ======================================
# # 1️⃣ Load and Clean Data
# # ======================================
# df = pd.read_csv("Solar_Power_Prediction.csv")
# print("Dataset loaded successfully!\n")

# # Convert "Is Daylight" to numeric binary (1/0)
# df["Is Daylight"] = (
#     df["Is Daylight"]
#     .astype(str)
#     .str.upper()
#     .replace({"TRUE": 1, "FALSE": 0, "YES": 1, "NO": 0})
#     .astype(int)
# )

# # ... (rest of your cleaning is fine) ...
# mask = (df["Is Daylight"] == 1) & (df["Power Generated"] == 0)
# df.loc[mask, "Power Generated"] = np.nan
# numeric_df = df.select_dtypes(include=[np.number])
# imputer = KNNImputer(n_neighbors=3)
# df[numeric_df.columns] = imputer.fit_transform(numeric_df)
# df["Power Generated"] = df["Power Generated"] / 1000

# # ======================================
# # 2️⃣ Group by Day (Aggregate Features)
# # ======================================
# daily_power = (
#     df.groupby(["Year", "Month", "Day"], as_index=False)
#     .agg({
#         "Is Daylight": "max",
#         # "Distance to Solar Noon": "mean", # 👈 We remove this
#         "Average Temperature (Day)": "mean",
#         "Average Wind Direction (Day)": "mean",
#         "Average Wind Speed (Day)": "mean",
#         "Sky Cover": "mean",
#         "Visibility": "mean",
#         "Relative Humidity": "mean",
#         "Average Wind Speed (Period)":"mean",
#         "Average Barometric Pressure (Period)": "mean",
#         "Power Generated": "sum",
#     })
# )

# daily_power = daily_power.sort_values(by=["Year", "Month", "Day"]).reset_index(drop=True)

# # ======================================
# # 3️⃣ Prepare Data for Training
# # ======================================

# # ✅ Drop the problematic feature 'Distance to Solar Noon'
# if "Distance to Solar Noon" in daily_power.columns:
#     daily_power = daily_power.drop(columns=["Distance to Solar Noon"])

# # ✅ Updated drop_cols (we also remove the unused 'Average Wind Speed (Period)')
# drop_cols = ["Power Generated", "Year", "Average Wind Speed (Period)"]

# X = daily_power.drop(columns=drop_cols)
# y = daily_power["Power Generated"]

# # Save feature columns *before* scaling
# X.to_csv("feature_columns.csv", index=False)
# print(f"✅ Features saved. Using: {X.columns.tolist()}")


# X_train, X_test, y_train, y_test = train_test_split(
#     X, y, test_size=0.2, random_state=42
# )

# # Scale features
# scaler = StandardScaler()
# X_train_scaled = scaler.fit_transform(X_train)
# X_test_scaled = scaler.transform(X_test)

# # ======================================
# # 4️⃣ Train & Save Best Model
# # ======================================
# # We will just train Random Forest as it was the best
# print("\nTraining Random Forest model...")
# model = RandomForestRegressor(n_estimators=100, random_state=42)

# model.fit(X_train_scaled, y_train)
# y_test_pred = model.predict(X_test_scaled)
# test_r2 = r2_score(y_test, y_test_pred)

# print(f"Model trained. Test R²: {test_r2:.4f}")

# # Fit again on *full* scaled dataset for final model
# full_X_scaled = scaler.fit_transform(X) # Use fit_transform for the final scaler
# model.fit(full_X_scaled, y)

# joblib.dump(model, "random_forest_model.pkl")
# joblib.dump(scaler, "scaler.pkl")

# print("\n✅ Random Forest model, scaler, and feature columns saved successfully!")


import numpy as np
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.impute import KNNImputer

print("Starting model training...")

try:
    df = pd.read_csv("Solar_Power_Prediction.csv")
    print("Dataset loaded successfully!")
except FileNotFoundError:
    print("❌ ERROR: Solar_Power_Prediction.csv not found!")
    print("Please make sure the file is in the same directory.")
    exit()


# Convert "Is Daylight" to numeric binary (1/0)
df["Is Daylight"] = (
    df["Is Daylight"]
    .astype(str)
    .str.upper()
    .replace({"TRUE": 1, "FALSE": 0, "YES": 1, "NO": 0})
    .astype(int)
)

# Handle missing values
mask = (df["Is Daylight"] == 1) & (df["Power Generated"] == 0)
df.loc[mask, "Power Generated"] = np.nan
numeric_df = df.select_dtypes(include=[np.number])
imputer = KNNImputer(n_neighbors=3)
df[numeric_df.columns] = imputer.fit_transform(numeric_df)
print("Missing values handled.")

df["Power Generated"] = df["Power Generated"] / 1000

daily_power = (
    df.groupby(["Year", "Month", "Day"], as_index=False)
    .agg({
        "Is Daylight": "max",
        # "Distance to Solar Noon": "mean", # 👈 BUGGY FEATURE IS REMOVED
        "Average Temperature (Day)": "mean",
        "Average Wind Direction (Day)": "mean",
        "Average Wind Speed (Day)": "mean",
        "Sky Cover": "mean",
        "Visibility": "mean",
        "Relative Humidity": "mean",
        "Average Wind Speed (Period)":"mean",
        "Average Barometric Pressure (Period)": "mean",
        "Power Generated": "sum",
    })
)

daily_power = daily_power.sort_values(by=["Year", "Month", "Day"]).reset_index(drop=True)

drop_cols = ["Power Generated", "Year", "Average Wind Speed (Period)"]

if "Distance to Solar Noon" in daily_power.columns:
    daily_power = daily_power.drop(columns=["Distance to Solar Noon"])

X = daily_power.drop(columns=drop_cols)
y = daily_power["Power Generated"]

X.to_csv("feature_columns.csv", index=False)
print(f"✅ Features saved. Using: {X.columns.tolist()}")


X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


print("\nTraining Random Forest model...")
model = RandomForestRegressor(n_estimators=100, random_state=42)

model.fit(X_train_scaled, y_train)
y_test_pred = model.predict(X_test_scaled)
test_r2 = r2_score(y_test, y_test_pred)

print(f"Model trained. Test R²: {test_r2:.4f}")

full_X_scaled = scaler.fit_transform(X) 
model.fit(full_X_scaled, y)

joblib.dump(model, "random_forest_model.pkl")
joblib.dump(scaler, "scaler.pkl")

print("\n✅✅✅ FINISHED! ✅✅✅")
print("New 'random_forest_model.pkl', 'scaler.pkl', and 'feature_columns.csv' are saved.")
print("You can now run app.py")