#!/usr/bin/env python3
"""
Extract MCCS Model Results from MongoDB
"""

import pymongo
from dotenv import load_dotenv
import os
import json

backend_env_path = os.path.join('..', 'backend', '.env')
load_dotenv(backend_env_path)

mongo_url = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_url)
db = client['mccs']

# Get the mlmodels collection
mlmodels = db['mlmodels']

# Find the latest MCCS model
mccs_model = mlmodels.find_one(sort=[('createdAt', -1)])

if mccs_model:
    print("="*70)
    print("MCCS MODEL RESULTS")
    print("="*70)
    
    print(f"\nModel Name: {mccs_model.get('modelName')}")
    print(f"Algorithm: {mccs_model.get('algorithm')}")
    print(f"Version: {mccs_model.get('version')}")
    print(f"Created: {mccs_model.get('createdAt')}")
    
    metrics = mccs_model.get('metrics', {})
    print("\n📊 Performance Metrics:")
    
    # Handle both dict and list formats
    if isinstance(metrics, list):
        print("\n  All Metrics:")
        for metric in metrics:
            print(f"    {metric}")
        # Extract key metrics if available
        metrics_dict = {}
        for m in metrics:
            if isinstance(m, dict):
                metrics_dict.update(m)
    else:
        metrics_dict = metrics
        print(f"  ROC-AUC:    {metrics_dict.get('roc_auc', 'N/A')}")
        print(f"  Accuracy:   {metrics_dict.get('accuracy', 'N/A')}")
        print(f"  Precision:  {metrics_dict.get('precision', 'N/A')}")
        print(f"  Recall:     {metrics_dict.get('recall', 'N/A')}")
        print(f"  F1-Score:   {metrics_dict.get('f1_score', 'N/A')}")
    
    # Save to JSON for comparison
    output = {
        "model_name": mccs_model.get('modelName'),
        "algorithm": mccs_model.get('algorithm'),
        "version": mccs_model.get('version'),
        "created_at": str(mccs_model.get('createdAt')),
        "metrics": metrics,
        "feature_importance": mccs_model.get('featureImportance', {}),
        "dataset_info": mccs_model.get('datasetInfo', {})
    }
    
    with open('ML_Server/mccs_model_results.json', 'w') as f:
        json.dump(output, indent=2, fp=f)
    
    print("\n✅ Saved to ML_Server/mccs_model_results.json")
    print("="*70)
else:
    print("❌ No MCCS model found in mlmodels collection")

client.close()
