from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load the complete MCCS pipeline from MongoDB
pipeline = joblib.load("xgboost_pipeline.pkl")

@app.route('/predict', methods=['POST'])
def predict():
    # The incoming JSON should match your dataframe columns
    payload = request.json  # e.g. { "Transaction Amount": [123.33], "Payment Method": ["credit card"], ... }
    df = pd.DataFrame(payload)
    
    # Use the complete pipeline for predictions
    fraud_probabilities = pipeline.predict_proba(df)[:, 1]
    binary_preds = pipeline.predict(df)
    
    # Determine risk levels based on probability thresholds
    risk_levels = []
    for prob in fraud_probabilities:
        if prob >= 0.8:
            risk_levels.append("Critical")
        elif prob >= 0.6:
            risk_levels.append("High")
        elif prob >= 0.4:
            risk_levels.append("Medium")
        elif prob >= 0.2:
            risk_levels.append("Low")
        else:
            risk_levels.append("Minimal")
    
    # Return comprehensive predictions
    results = []
    for i in range(len(fraud_probabilities)):
        results.append({
            "isFraud": int(binary_preds[i]),
            "fraudProbability": float(fraud_probabilities[i]),
            "riskLevel": risk_levels[i],
            "confidence": float(max(fraud_probabilities[i], 1 - fraud_probabilities[i]))
        })
    
    return jsonify({
        "predictions": results,
        "model": "XGBoost",
        "evaluationMetric": "ROC-AUC"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
