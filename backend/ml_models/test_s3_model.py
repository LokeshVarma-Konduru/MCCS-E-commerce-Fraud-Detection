import sys
import os
import logging
import argparse

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the current directory to the path so we can import the predict module
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Import the load_model function from predict.py
from predict import load_model

def test_model_loading(model_name):
    """
    Test loading a model from S3 or local file system
    
    Args:
        model_name (str): Name of the model to load
    """
    logger.info(f"Testing loading model: {model_name}")
    
    try:
        # Load the model
        model = load_model(model_name)
        logger.info(f"Successfully loaded model: {model_name}")
        logger.info(f"Model type: {type(model)}")
        return True
    except Exception as e:
        logger.error(f"Failed to load model {model_name}: {str(e)}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test loading ML models from S3 or local filesystem")
    parser.add_argument("--model", type=str, default="bernoulli-nb", 
                        help="Model name to test (default: bernoulli-nb)")
    
    args = parser.parse_args()
    
    # Test loading the specified model
    success = test_model_loading(args.model)
    
    if success:
        print(f"✅ Successfully loaded model: {args.model}")
        sys.exit(0)
    else:
        print(f"❌ Failed to load model: {args.model}")
        sys.exit(1)
