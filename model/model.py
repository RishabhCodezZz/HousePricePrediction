import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import RidgeCV
from xgboost import XGBRegressor
import joblib

# Load and preprocess data
data = pd.read_csv("dataset.csv")
if 'date' in data.columns:
    data = data.drop(['date'], axis=1)

# Encode categorical columns
le = LabelEncoder()
for col in ['has_basement', 'renovated', 'nice_view', 'perfect_condition', 'has_lavatory', 'single_floor']:
    if data[col].dtype == object:
        data[col] = le.fit_transform(data[col])
    else:
        data[col] = data[col].astype(int)

# Ensure necessary columns exist
if 'lot_m2' not in data.columns:
    data['lot_m2'] = data['living_in_m2'] * 2
if 'month' not in data.columns:
    data['month'] = 6
if 'quartile_zone' not in data.columns:
    data['quartile_zone'] = 2

# Feature engineering
data['total_rooms'] = data['bedrooms'] + data['real_bathrooms']
data['area_per_room'] = data['living_in_m2'] / data['total_rooms']
data['living_in_m2_squared'] = data['living_in_m2'] ** 2
data['quality_score'] = data['grade'] + data['nice_view'] + data['perfect_condition']
data['grade_area'] = data['grade'] * data['living_in_m2']
data['bathroom_bedroom_ratio'] = data['real_bathrooms'] / data['bedrooms']

# Define feature columns
feature_cols = [
    'bedrooms', 'grade', 'has_basement', 'living_in_m2', 'renovated',
    'nice_view', 'perfect_condition', 'real_bathrooms', 'has_lavatory',
    'single_floor', 'month', 'quartile_zone', 'total_rooms',
    'area_per_room', 'living_in_m2_squared', 'quality_score',
    'grade_area', 'bathroom_bedroom_ratio', 'lot_m2'
]

# Drop rows with NaN or infinite values
data = data.replace([np.inf, -np.inf], np.nan).dropna(subset=feature_cols + ['price'])

X = data[feature_cols]
y = data['price']

# Standardize features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train individual models
xgb_model = XGBRegressor(n_estimators=250, learning_rate=0.05, random_state=42)
xgb_model.fit(X_scaled, y)

gbr_model = GradientBoostingRegressor(n_estimators=250, learning_rate=0.11, random_state=42)
gbr_model.fit(X_scaled, y)

random_forest_model = RandomForestRegressor(n_estimators=200, random_state=42)
random_forest_model.fit(X_scaled, y)

ridge_model = RidgeCV(alphas=[0.1, 0.01, 0.001], cv=5)
ridge_model.fit(X_scaled, y)

# Create ensemble predictions (averaging)
predictions = np.column_stack([
    xgb_model.predict(X_scaled),
    gbr_model.predict(X_scaled),
    random_forest_model.predict(X_scaled),
    ridge_model.predict(X_scaled)
])
ensemble_prediction = np.mean(predictions, axis=1)

# Final training output (optional)
print("Models trained. Ensemble ready.")

# Save models and scaler if needed
joblib.dump({
    'xgb_model': xgb_model,
    'gbr_model': gbr_model,
    'random_forest_model': random_forest_model,
    'ridge_model': ridge_model,
    'scaler': scaler,
    'features': feature_cols
}, 'ensemble_models.pkl')

print("Models and scaler saved to 'ensemble_models.pkl'.")
