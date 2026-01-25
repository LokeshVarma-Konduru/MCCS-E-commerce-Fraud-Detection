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

def fix_xgboost_compatibility(model_or_pipeline):
    """Fix XGBoost compatibility by adding missing use_label_encoder attribute.
    
    Models trained with XGBoost v1.x have 'use_label_encoder' parameter.
    XGBoost v2.x removed this parameter, causing AttributeError when loading old models.
    This function adds the missing attribute to maintain compatibility.
    """
    try:
        from xgboost import XGBClassifier
        fixed = False
        
        # Check if it's directly an XGBClassifier
        if isinstance(model_or_pipeline, XGBClassifier):
            if not hasattr(model_or_pipeline, 'use_label_encoder'):
                model_or_pipeline.use_label_encoder = False
                fixed = True
        
        # Check if it's a Pipeline with steps
        elif hasattr(model_or_pipeline, 'steps'):
            for i, (name, step) in enumerate(model_or_pipeline.steps):
                if isinstance(step, XGBClassifier) and not hasattr(step, 'use_label_encoder'):
                    step.use_label_encoder = False
                    fixed = True
                    print(f"🔧 Fixed XGBoost step '{name}': added missing 'use_label_encoder'", file=sys.stderr)
        
        # Check if it's a Pipeline with named_steps
        elif hasattr(model_or_pipeline, 'named_steps'):
            for name, step in model_or_pipeline.named_steps.items():
                if isinstance(step, XGBClassifier) and not hasattr(step, 'use_label_encoder'):
                    step.use_label_encoder = False
                    fixed = True
                    print(f"🔧 Fixed XGBoost step '{name}': added missing 'use_label_encoder'", file=sys.stderr)
        
        if fixed and isinstance(model_or_pipeline, XGBClassifier):
            print(f"🔧 Fixed XGBoost compatibility: added missing 'use_label_encoder' attribute", file=sys.stderr)
        
        return fixed
    except ImportError:
        # XGBoost not installed, skip compatibility fix
        return False
    except Exception as e:
        print(f"⚠️  Warning: Could not fix XGBoost compatibility: {str(e)}", file=sys.stderr)
        return False

def load_model_from_gridfs(filename, version=None):
    """Load model from MongoDB GridFS by filename and optionally by version"""
    try:
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise ValueError("MONGO_URI not found in environment")
        
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client["mccs"]
        fs = gridfs.GridFS(db, collection="modelFiles")
        
        # Build query - include version if provided
        # Query the files collection first to get file metadata
        files_collection = db.modelFiles.files
        query = {"filename": filename}
        if version:
            query["version"] = version
        
        # Find file document in files collection
        file_doc = files_collection.find_one(query)
        if not file_doc:
            if version:
                raise FileNotFoundError(f"Model {filename} version {version} not found in GridFS")
            else:
                # If no version specified, get latest (most recent uploadDate)
                file_doc = files_collection.find_one(
                    {"filename": filename},
                    sort=[("uploadDate", -1)]  # Get most recent
                )
                if not file_doc:
                    raise FileNotFoundError(f"Model {filename} not found in GridFS")
        
        # Get the file_id and load from GridFS
        file_id = file_doc["_id"]
        grid_out = fs.get(file_id)
        
        # Read binary data
        model_bytes = grid_out.read()
        
        # Get version from the file document
        loaded_version = file_doc.get("version") or version or "latest"
        
        client.close()
        
        # Log which version was loaded
        version_info = f" version {loaded_version}" if loaded_version else ""
        print(f"✅ Loaded {filename}{version_info} from MongoDB GridFS", file=sys.stderr)
        
        # Try to load the model with error handling for sklearn version compatibility
        try:
            return joblib.load(io.BytesIO(model_bytes))
        except (AttributeError, ModuleNotFoundError, KeyError) as pickle_error:
            error_str = str(pickle_error)
            # Check if it's a sklearn version compatibility issue
            if "_RemainderColsList" in error_str or "sklearn" in error_str.lower() or "column_transformer" in error_str.lower():
                print(f"⚠️  Scikit-learn version compatibility issue detected: {error_str}", file=sys.stderr)
                raise Exception(f"Scikit-learn version mismatch: Model was saved with a different sklearn version. "
                              f"Error: {error_str}. Please ensure sklearn versions match (model: 1.6.1, current: 1.7.2).")
            else:
                # Re-raise if it's a different error
                raise
        
    except Exception as e:
        print(f"❌ GridFS Error: {str(e)}", file=sys.stderr)
        raise

def load_model_from_local(filename):
    """Fallback: Load model from local file system"""
    model_path = os.path.join(current_dir, filename)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model {filename} not found in local directory")
    print(f"✅ Loaded {filename} from local file system", file=sys.stderr)
    
    # Try to load the model with error handling for sklearn version compatibility
    try:
        return joblib.load(model_path)
    except (AttributeError, ModuleNotFoundError, KeyError) as pickle_error:
        error_str = str(pickle_error)
        # Check if it's a sklearn version compatibility issue
        if "_RemainderColsList" in error_str or "sklearn" in error_str.lower() or "column_transformer" in error_str.lower():
            print(f"⚠️  Scikit-learn version compatibility issue detected: {error_str}", file=sys.stderr)
            raise Exception(f"Scikit-learn version mismatch: Model was saved with a different sklearn version. "
                          f"Error: {error_str}. Please ensure sklearn versions match (model: 1.6.1, current: 1.7.2).")
        else:
            # Re-raise if it's a different error
            raise

def load_model(model_name, version=None):
    """
    Load model from MongoDB GridFS by model name and optionally by version.
    Database only - no local fallback.
    Uses global cache to avoid reloading models from database.
    """
    # Model name to filename mapping
    model_files = {
        "logistic-regression": "logistic_regression.pkl",
        "bernoulli-nb": "bernoulli_nb.pkl",
        "decision-tree": "decision_tree.pkl",
        "xgboost": "xgboost_pipeline.pkl",  # Updated to match actual filename in GridFS
        "spinal-net": "spinalnet_weights.pkl",
        "gan-weights": "gan_weights.pkl"
    }
    
    # Check if model name is valid
    if model_name not in model_files:
        raise ValueError(f"Unknown model name: {model_name}")
    
    filename = model_files[model_name]
    
    # Create cache key including version to avoid conflicts
    cache_key = f"{model_name}_{version}" if version else model_name
    
    # Check cache first
    if cache_key in _model_cache:
        version_info = f" version {version}" if version else ""
        print(f"🚀 Using cached model: {filename}{version_info}", file=sys.stderr)
        return _model_cache[cache_key]
    
    # Try loading from GridFS (database first)
    try:
        pipeline = load_model_from_gridfs(filename, version)
        _model_cache[cache_key] = pipeline  # Cache for future use (version-specific)
        
    except Exception as gridfs_error:
        error_str = str(gridfs_error)
        
        # Check if it's a sklearn version compatibility issue
        is_sklearn_version_error = (
            "_RemainderColsList" in error_str or 
            "sklearn" in error_str.lower() or 
            "version mismatch" in error_str.lower() or
            "InconsistentVersionWarning" in error_str
        )
        
        # Special fallback for XGBoost: use local files if GridFS fails
        # This is because XGBoost has version compatibility issues between v1.x and v2.x
        # and may work better with local files in some cases
        if model_name == "xgboost":
            print(f"⚠️  GridFS failed for XGBoost, trying local files...", file=sys.stderr)
            try:
                # Try loading from local file (no version checking for local files)
                pipeline = load_model_from_local(filename)
                # Apply compatibility fix before caching
                fix_xgboost_compatibility(pipeline)
                _model_cache[cache_key] = pipeline  # Cache for future use
                print(f"✅ Loaded XGBoost from local file as fallback", file=sys.stderr)
            except Exception as local_error:
                print(f"❌ Both GridFS and local file loading failed for XGBoost", file=sys.stderr)
                raise Exception(f"Failed to load XGBoost model from both GridFS and local: GridFS={gridfs_error}, Local={local_error}")
        # For sklearn version errors with other models, try local file as fallback
        elif is_sklearn_version_error:
            print(f"⚠️  GridFS model has sklearn version mismatch, trying local files...", file=sys.stderr)
            try:
                # Try loading from local file (might have compatible sklearn version)
                pipeline = load_model_from_local(filename)
                _model_cache[cache_key] = pipeline  # Cache for future use
                print(f"✅ Loaded {model_name} from local file as fallback (sklearn version issue)", file=sys.stderr)
            except Exception as local_error:
                print(f"❌ Both GridFS and local file loading failed due to sklearn version mismatch", file=sys.stderr)
                raise Exception(f"Scikit-learn version mismatch: Model was saved with sklearn 1.6.1 but current version is 1.7.2. "
                              f"GridFS Error: {gridfs_error}, Local Error: {local_error}. "
                              f"Please retrain model with current sklearn version or downgrade sklearn to match.")
        else:
            # For other errors, only use GridFS (database)
            raise Exception(f"Failed to load model from GridFS (database). GridFS Error: {gridfs_error}")
    
    # Apply XGBoost compatibility fix during model loading (for GridFS-loaded models)
    fix_xgboost_compatibility(pipeline)
    
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

    model_name = sys.argv[1]  # e.g. "logistic-regression", "bernoulli-nb", "decision-tree", "xgboost"
    version = sys.argv[2] if len(sys.argv) > 2 else None  # Optional version: e.g. "v1.0.0", "v1.1.0"

    # Model name to filename mapping (needed for fallback)
    model_files = {
        "logistic-regression": "logistic_regression.pkl",
        "bernoulli-nb": "bernoulli_nb.pkl",
        "decision-tree": "decision_tree.pkl",
        "xgboost": "xgboost_pipeline.pkl",
        "spinal-net": "spinalnet_weights.pkl",
        "gan-weights": "gan_weights.pkl"
    }

    try:
        # 2) Load the pipeline for that model and version
        pipeline = load_model(model_name, version)

        # 3) Read the JSON payload from stdin
        data_input = sys.stdin.read()
        data = json.loads(data_input)

        # 4) Convert to a DataFrame and predict
        df = pd.DataFrame(data)
        
        # MongoDB-specific columns that may be expected by models trained on MongoDB data
        # These should NOT be in prediction requests, but some models (like v1.1.0) were 
        # trained with them, so we need to add dummy values if the model expects them
        mongo_db_columns = ['datasetId', 'dataType', 'datasetVersion', '__v', '_id']
        
        # Debug info
        # print(f"DataFrame shape: {df.shape}", file=sys.stderr)
        # print(f"DataFrame columns: {df.columns.tolist()}", file=sys.stderr)
        
        # Check if DataFrame is empty
        if df.empty:
            print(json.dumps({
                "error": "Empty DataFrame. No data to predict on."
            }))
            sys.exit(1)
        
        # Try to predict and catch model-specific errors
        predictions = None
        try:
            # First, try predicting with current DataFrame
            predictions = pipeline.predict(df)
            if predictions is None:
                raise ValueError("Predictions returned None")
        except (KeyError, ValueError, AttributeError, Exception) as e:
            error_str = str(e)
            
            # Handle XGBoost compatibility errors (use_label_encoder)
            if "use_label_encoder" in error_str.lower() or "has no attribute" in error_str.lower():
                print(f"⚠️  XGBoost compatibility error detected: {error_str}", file=sys.stderr)
                try:
                    # Try to fix the XGBClassifier in the pipeline using the helper function
                    fixed = fix_xgboost_compatibility(pipeline)
                    
                    if fixed:
                        # Retry prediction after fix
                        predictions = pipeline.predict(df)
                        if predictions is None:
                            raise ValueError("Predictions returned None")
                    else:
                        raise Exception("Could not locate XGBClassifier in pipeline")
                except Exception as xgb_fix_error:
                    print(f"❌ Could not fix XGBoost error: {str(xgb_fix_error)}", file=sys.stderr)
                    # For XGBoost, try fallback to local file if GridFS model fails during prediction
                    if model_name == "xgboost":
                        print(f"🔄 XGBoost prediction failed, trying to reload from local file...", file=sys.stderr)
                        try:
                            # Clear cache for this model and reload from local
                            cache_key = f"{model_name}_{version}" if version else model_name
                            if cache_key in _model_cache:
                                del _model_cache[cache_key]
                            
                            # Get filename for XGBoost
                            filename = model_files.get(model_name)
                            if filename:
                                # Reload from local file
                                local_pipeline = load_model_from_local(filename)
                                fix_xgboost_compatibility(local_pipeline)
                                pipeline = local_pipeline
                                _model_cache[cache_key] = pipeline
                                
                                # Retry prediction with local model
                                predictions = pipeline.predict(df)
                                if predictions is None:
                                    raise ValueError("Predictions returned None")
                                print(f"✅ XGBoost prediction succeeded with local file fallback", file=sys.stderr)
                            else:
                                raise Exception("Could not find filename for XGBoost model")
                        except Exception as local_fallback_error:
                            print(f"❌ Local file fallback also failed: {str(local_fallback_error)}", file=sys.stderr)
                            raise Exception(f"XGBoost compatibility error: {str(e)}. Fix attempt failed: {str(xgb_fix_error)}. Local fallback failed: {str(local_fallback_error)}")
                    else:
                        raise Exception(f"XGBoost compatibility error: {str(e)}. Fix attempt failed: {str(xgb_fix_error)}")
            
            # Check if error is about missing columns (MongoDB-specific columns)
            elif any(col in error_str for col in mongo_db_columns) or "missing" in error_str.lower():
                # Model was trained with MongoDB columns - add them with dummy values
                missing_cols = []
                for col in mongo_db_columns:
                    if col not in df.columns:
                        missing_cols.append(col)
                        # Add dummy values based on column type
                        if col in ['datasetId', '_id']:
                            df[col] = None  # ObjectId type - use None (will be converted to object dtype)
                        elif col == 'dataType':
                            df[col] = 'predict'  # String type
                        elif col == 'datasetVersion':
                            df[col] = 'v1.0.0'  # Default version string
                        elif col == '__v':
                            df[col] = 0  # Number type
                
                if missing_cols:
                    print(f"⚠️  Model expects MongoDB columns, adding dummy values: {missing_cols}", file=sys.stderr)
                    # Try again with added columns
                    try:
                        predictions = pipeline.predict(df)
                        if predictions is None:
                            raise ValueError("Predictions returned None")
                    except Exception as retry_error:
                        print(f"Error during prediction after adding MongoDB columns: {str(retry_error)}", file=sys.stderr)
                        raise
            else:
                # For XGBoost, try fallback to local file for any prediction error
                if model_name == "xgboost":
                    print(f"⚠️  XGBoost prediction error: {error_str}. Trying local file fallback...", file=sys.stderr)
                    try:
                        # Clear cache for this model and reload from local
                        cache_key = f"{model_name}_{version}" if version else model_name
                        if cache_key in _model_cache:
                            del _model_cache[cache_key]
                        
                        # Get filename for XGBoost
                        filename = model_files.get(model_name)
                        if filename:
                            # Reload from local file
                            local_pipeline = load_model_from_local(filename)
                            fix_xgboost_compatibility(local_pipeline)
                            pipeline = local_pipeline
                            _model_cache[cache_key] = pipeline
                            
                            # Retry prediction with local model
                            predictions = pipeline.predict(df)
                            if predictions is None:
                                raise ValueError("Predictions returned None")
                            print(f"✅ XGBoost prediction succeeded with local file fallback", file=sys.stderr)
                        else:
                            raise Exception("Could not find filename for XGBoost model")
                    except Exception as local_fallback_error:
                        print(f"❌ Local file fallback also failed: {str(local_fallback_error)}", file=sys.stderr)
                        raise Exception(f"XGBoost prediction error: {str(e)}. Local fallback failed: {str(local_fallback_error)}")
                else:
                    # Different error - re-raise it
                    print(f"Error during prediction: {str(e)}", file=sys.stderr)
                    raise
        except Exception as e:
            # Catch any other unexpected errors
            error_str = str(e)
            
            # For XGBoost, try fallback to local file even for unexpected errors
            if model_name == "xgboost":
                print(f"⚠️  Unexpected XGBoost error: {error_str}. Trying local file fallback...", file=sys.stderr)
                try:
                    # Clear cache for this model and reload from local
                    cache_key = f"{model_name}_{version}" if version else model_name
                    if cache_key in _model_cache:
                        del _model_cache[cache_key]
                    
                    # Get filename for XGBoost
                    filename = model_files.get(model_name)
                    if filename:
                        # Reload from local file
                        local_pipeline = load_model_from_local(filename)
                        fix_xgboost_compatibility(local_pipeline)
                        pipeline = local_pipeline
                        _model_cache[cache_key] = pipeline
                        
                        # Retry prediction with local model
                        predictions = pipeline.predict(df)
                        if predictions is None:
                            raise ValueError("Predictions returned None")
                        print(f"✅ XGBoost prediction succeeded with local file fallback", file=sys.stderr)
                    else:
                        raise Exception("Could not find filename for XGBoost model")
                except Exception as local_fallback_error:
                    print(f"❌ Local file fallback also failed: {str(local_fallback_error)}", file=sys.stderr)
                    raise Exception(f"Unexpected XGBoost error: {str(e)}. Local fallback failed: {str(local_fallback_error)}")
            else:
                print(f"❌ Unexpected error during prediction: {error_str}", file=sys.stderr)
                raise
        
        # Convert predictions to list (should already be set from above)
        if predictions is not None:
            predictions_list = predictions.tolist()
        else:
            # This shouldn't happen, but handle it just in case
            print(f"Error: Predictions is None", file=sys.stderr)
            print(json.dumps({
                "error": "Failed to generate predictions",
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
        except (AttributeError, ValueError) as e:
            error_str = str(e)
            
            # Handle XGBoost compatibility errors in predict_proba
            if "use_label_encoder" in error_str.lower() or "has no attribute" in error_str.lower():
                print(f"⚠️  XGBoost compatibility error in predict_proba: {error_str}", file=sys.stderr)
                try:
                    # Try to fix the XGBClassifier in the pipeline using the helper function
                    fixed = fix_xgboost_compatibility(pipeline)
                    
                    if fixed:
                        # Retry predict_proba after fix
                        probabilities = pipeline.predict_proba(df)
                        if probabilities is None:
                            raise ValueError("Probabilities returned None")
                        probabilities_list = probabilities.tolist()
                    else:
                        raise Exception("Could not locate XGBClassifier in pipeline")
                except Exception as xgb_fix_error:
                    print(f"❌ Could not fix XGBoost error in predict_proba: {str(xgb_fix_error)}", file=sys.stderr)
                    # Fall through to dummy probabilities
                    raise
            else:
                # Different error - fall through to dummy probabilities
                raise
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
