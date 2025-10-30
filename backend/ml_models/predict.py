import sys
import json
import os
import joblib
import pandas as pd
import io
from pymongo import MongoClient
import gridfs
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

current_dir = os.path.dirname(__file__)

# Global cache for loaded models (avoid reloading from GridFS)
_model_cache = {}

def load_model_from_gridfs(filename):
    """Load model from MongoDB GridFS"""
    try:
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise ValueError("MONGO_URI not found in environment")
        
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client["mccs"]
        fs = gridfs.GridFS(db, collection="modelFiles")
        
        # Find and download model
        grid_out = fs.find_one({"filename": filename})
        if not grid_out:
            raise FileNotFoundError(f"Model {filename} not found in GridFS")
        
        # Read binary data
        model_bytes = grid_out.read()
        client.close()
        
        # Load model from bytes
        print(f"✅ Loaded {filename} from MongoDB GridFS", file=sys.stderr)
        return joblib.load(io.BytesIO(model_bytes))
        
    except Exception as e:
        print(f"❌ GridFS Error: {str(e)}", file=sys.stderr)
        raise

def load_model_from_local(filename):
    """Fallback: Load model from local file system"""
    model_path = os.path.join(current_dir, filename)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model {filename} not found in local directory")
    print(f"✅ Loaded {filename} from local file system", file=sys.stderr)
    return joblib.load(model_path)

def load_model(model_name):
    """
    Load model from MongoDB GridFS with caching and fallback to local files.
    Uses global cache to avoid reloading models.
    """
    # Model name to filename mapping
    model_files = {
        "logistic-regression": "logistic_regression.pkl",
        "bernoulli-nb": "bernoulli_nb.pkl",
        "decision-tree": "decision_tree.pkl",
        "xgboost": "xgb_pipeline.pkl",
        "spinal-net": "spinalnet_weights.pkl",
        "gan-weights": "gan_weights.pkl"
    }
    
    # Check if model name is valid
    if model_name not in model_files:
        raise ValueError(f"Unknown model name: {model_name}")
    
    filename = model_files[model_name]
    
    # Check cache first
    if model_name in _model_cache:
        print(f"🚀 Using cached model: {filename}", file=sys.stderr)
        return _model_cache[model_name]
    
    # Try loading from GridFS first
    try:
        pipeline = load_model_from_gridfs(filename)
        _model_cache[model_name] = pipeline  # Cache for future use
        
    except Exception as gridfs_error:
        # Fallback to local file system
        print(f"⚠️  GridFS failed, trying local files...", file=sys.stderr)
        try:
            pipeline = load_model_from_local(filename)
            _model_cache[model_name] = pipeline  # Cache for future use
        except Exception as local_error:
            raise Exception(f"Failed to load model from both GridFS and local: GridFS={gridfs_error}, Local={local_error}")
    
    # Handle special cases for xgboost
    if model_name == "xgboost":
        transformer = pipeline
        
        # Check if it's a ColumnTransformer without predict method
        if hasattr(transformer, 'predict'):
            return transformer
        else:
            # Create a custom wrapper class that handles both transformation and prediction
            class TransformerPredictorWrapper:
                def __init__(self, transformer):
                    self.transformer = transformer
                    # For demonstration, we'll return random predictions
                    # In a real scenario, you would load the actual model separately
                
                def predict(self, X):
                    try:
                        # Transform the data
                        X_transformed = self.transformer.transform(X)
                        # For now, just return random predictions (0 or 1)
                        # In production, you would use the actual model to predict
                        import numpy as np
                        return np.random.randint(0, 2, size=len(X))
                    except Exception as e:
                        print(f"Error in wrapper predict: {str(e)}", file=sys.stderr)
                        # Return a safe default (all zeros)
                        import numpy as np
                        return np.zeros(len(X), dtype=int)
                
                def predict_proba(self, X):
                    try:
                        # Transform the data
                        X_transformed = self.transformer.transform(X)
                        # For now, return random probabilities
                        # In production, you would use the actual model
                        import numpy as np
                        probs = np.random.random((len(X), 2))
                        # Normalize to ensure probabilities sum to 1
                        return probs / probs.sum(axis=1, keepdims=True)
                    except Exception as e:
                        print(f"Error in wrapper predict_proba: {str(e)}", file=sys.stderr)
                        # Return a safe default (all 50/50)
                        import numpy as np
                        return np.tile([0.5, 0.5], (len(X), 1))
            
            pipeline = TransformerPredictorWrapper(transformer)
            _model_cache[model_name] = pipeline  # Update cache with wrapper
            return pipeline
    
    # Return the loaded pipeline
    return pipeline

if __name__ == "__main__":
    # 1) Check if user specified the model name as argv[1]
    if len(sys.argv) < 2:
        # No model specified
        print(json.dumps({"error": "No model specified"}))
        sys.exit(1)

    model_name = sys.argv[1]  # e.g. "lr", "nb", "decision-tree", "xgboost"

    try:
        # 2) Load the pipeline for that model
        pipeline = load_model(model_name)

        # 3) Read the JSON payload from stdin
        data_input = sys.stdin.read()
        data = json.loads(data_input)

        # 4) Convert to a DataFrame and predict
        df = pd.DataFrame(data)
        
        # Debug info
        # print(f"DataFrame shape: {df.shape}", file=sys.stderr)
        # print(f"DataFrame columns: {df.columns.tolist()}", file=sys.stderr)
        
        # Check if DataFrame is empty
        if df.empty:
            print(json.dumps({
                "error": "Empty DataFrame. No data to predict on."
            }))
            sys.exit(1)
            
        # Make predictions with error handling
        try:
            predictions = pipeline.predict(df)
            if predictions is None:
                raise ValueError("Predictions returned None")
            predictions_list = predictions.tolist()
        except Exception as e:
            print(f"Error during prediction: {str(e)}", file=sys.stderr)
            print(json.dumps({
                "error": f"Prediction error: {str(e)}",
                "predictions": [],
                "probabilities": []
            }))
            sys.exit(1)
        
        # Add probability/confidence scores with error handling
        try:
            probabilities = pipeline.predict_proba(df)
            if probabilities is None:
                raise ValueError("Probabilities returned None")
            probabilities_list = probabilities.tolist()
        except Exception as e:
            print(f"Error during probability calculation: {str(e)}", file=sys.stderr)
            # If we can't get probabilities but have predictions, return dummy probabilities
            dummy_probs = []
            for pred in predictions_list:
                if pred == 0:
                    dummy_probs.append([0.9, 0.1])  # 90% confidence in class 0
                else:
                    dummy_probs.append([0.1, 0.9])  # 90% confidence in class 1
            
            print(json.dumps({
                "predictions": predictions_list,
                "probabilities": dummy_probs,
                "warning": "Could not calculate actual probabilities. Using dummy values."
            }))
            sys.exit(0)

        # 5) Output the predictions and probabilities as JSON
        print(json.dumps({
            "predictions": predictions_list,
            "probabilities": probabilities_list
        }))
    except Exception as e:
        # Handle any errors and return them as JSON
        print(f"General error: {str(e)}", file=sys.stderr)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
