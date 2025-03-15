from flask import Flask, request, jsonify
import joblib
import pandas as pd
from xgboost import XGBClassifier

app = Flask(__name__)

# Load your pipeline pieces
transformer = joblib.load("transformer.pkl")
xgb_model = XGBClassifier()
xgb_model.load_model("xgb_model.json")

@app.route('/predict', methods=['POST'])
def predict():
    # The incoming JSON should match your dataframe columns
    payload = request.json  # e.g. { "Transaction Amount": [123.33], "Payment Method": ["credit card"], ... }
    df = pd.DataFrame(payload)
    
    # Transform and predict
    transformed = transformer.transform(df)
    preds = xgb_model.predict(transformed)
    
    # Return predictions
    return jsonify({"predictions": preds.tolist()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
