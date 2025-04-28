from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import os
import requests
from flask_cors import CORS
from datetime import datetime
app = Flask(__name__)
CORS(app)

# --- Load model and scaler ---
model_bundle = joblib.load('ensemble_models.pkl')
xgb_model = model_bundle['xgb_model']
gbr_model = model_bundle['gbr_model']
random_forest_model = model_bundle['random_forest_model']
ridge_model = model_bundle['ridge_model']
scaler = model_bundle['scaler']
feature_cols = model_bundle['features']

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json

        # Validate input
        required_fields = [
            'bedrooms', 'grade', 'has_basement', 'living_in_m2', 'renovated',
            'nice_view', 'perfect_condition', 'real_bathrooms', 'has_lavatory',
            'single_floor', 'lot_m2'
        ]
        for field in required_fields:
            if field not in data or data[field] in [None, '']:
                return jsonify({'error': f'Missing or invalid value for {field}', 'success': False})

        if data['bedrooms'] == 0 or data['real_bathrooms'] == 0:
            return jsonify({'error': 'Bedrooms and bathrooms must be greater than zero.', 'success': False})

        current_month = datetime.now().month

        # Prepare input
        input_data = pd.DataFrame({
            'bedrooms': [data['bedrooms']],
            'grade': [data['grade']],
            'has_basement': [1 if data['has_basement'] else 0],
            'living_in_m2': [data['living_in_m2']],
            'renovated': [1 if data['renovated'] else 0],
            'nice_view': [1 if data['nice_view'] else 0],
            'perfect_condition': [1 if data['perfect_condition'] else 0],
            'real_bathrooms': [data['real_bathrooms']],
            'has_lavatory': [1 if data['has_lavatory'] else 0],
            'single_floor': [1 if data['single_floor'] else 0],
            'month': [current_month],
            'quartile_zone': [2],
            'lot_m2': [data['lot_m2']]
        })

        # Feature engineering
        input_data['total_rooms'] = input_data['bedrooms'] + input_data['real_bathrooms']
        input_data['area_per_room'] = input_data['living_in_m2'] / input_data['total_rooms']
        input_data['living_in_m2_squared'] = input_data['living_in_m2'] ** 2
        input_data['quality_score'] = input_data['grade'] + input_data['nice_view'] + input_data['perfect_condition']
        input_data['grade_area'] = input_data['grade'] * input_data['living_in_m2']
        input_data['bathroom_bedroom_ratio'] = input_data['real_bathrooms'] / input_data['bedrooms']

        input_data = input_data[feature_cols]

        # Check for NaN/Inf
        if input_data.isnull().any().any() or np.isinf(input_data.values).any():
            return jsonify({'error': 'Invalid input: NaN or infinite values detected.', 'success': False})

        # Scale input
        input_scaled = scaler.transform(input_data)

        # Predict
        preds = np.column_stack([
            xgb_model.predict(input_scaled),
            gbr_model.predict(input_scaled),
            random_forest_model.predict(input_scaled),
            ridge_model.predict(input_scaled)
        ])

        final_pred = np.mean(preds, axis=1)[0]

        return jsonify({'prediction': round(final_pred, 2), 'success': True})

    except Exception as e:
        return jsonify({'error': str(e), 'success': False})

if __name__ == '__main__':
    app.run(debug=True)
