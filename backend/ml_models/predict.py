import sys
import json
import os
import joblib
import pandas as pd

current_dir = os.path.dirname(__file__)

def load_model(model_name):
    if model_name == "logistic-regression":
        # Logistic Regression pipeline
        model_path = os.path.join(current_dir, "logistic_regression.pkl")
        pipeline = joblib.load(model_path)
        return pipeline
    elif model_name == "bernoulli-nb":
        # Bernoulli NB pipeline
        model_path = os.path.join(current_dir, "bernoulli_nb.pkl")
        pipeline = joblib.load(model_path)
        return pipeline
    elif model_name == "decision-tree":
        # Decision Tree pipeline
        model_path = os.path.join(current_dir, "decision_tree.pkl")
        pipeline = joblib.load(model_path)
        return pipeline
    elif model_name == "xgboost":
        # XGBoost pipeline
        model_path = os.path.join(current_dir, "xgb_pipeline.pkl")
        pipeline = joblib.load(model_path)
        return pipeline
    elif model_name == "spinal-net":
        # XGBoost pipeline
        model_path = os.path.join(current_dir, "decision_tree.pkl")
        pipeline = joblib.load(model_path)
        return pipeline
    elif model_name == "gan-weights":
        # XGBoost pipeline
        model_path = os.path.join(current_dir, "decision_tree.pkl")
        pipeline = joblib.load(model_path)
        return pipeline
    else:
        raise ValueError(f"Unknown model name: {model_name}")

if __name__ == "__main__":
    # 1) Check if user specified the model name as argv[1]
    if len(sys.argv) < 2:
        # No model specified
        print(json.dumps({"error": "No model specified"}))
        sys.exit(1)

    model_name = sys.argv[1]  # e.g. "lr", "nb", "decision-tree", "xgboost"

    # 2) Load the pipeline for that model
    pipeline = load_model(model_name)

    # 3) Read the JSON payload from stdin
    data_input = sys.stdin.read()
    data = json.loads(data_input)

    # 4) Convert to a DataFrame and predict
    df = pd.DataFrame(data)
    predictions = pipeline.predict(df).tolist()
    
    # Add probability/confidence scores
    probabilities = pipeline.predict_proba(df).tolist()

    # 5) Output the predictions and probabilities as JSON
    print(json.dumps({
        "predictions": predictions,
        "probabilities": probabilities
    }))
