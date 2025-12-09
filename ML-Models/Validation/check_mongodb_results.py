#!/usr/bin/env python3
"""
Check MongoDB for ML Model Results
Searches all collections for model evaluation results
"""

import pymongo
from dotenv import load_dotenv
import os
import json

# Load environment variables
backend_env_path = os.path.join('..', 'backend', '.env')
load_dotenv(backend_env_path)

print("="*70)
print("SEARCHING MONGODB FOR ML MODEL RESULTS")
print("="*70)

mongo_url = os.getenv('MONGO_URI')
if not mongo_url:
    print("❌ Error: MONGO_URI not found")
    exit(1)

try:
    client = pymongo.MongoClient(mongo_url)
    
    # Check all databases
    for db_name in client.list_database_names():
        if db_name in ['admin', 'local', 'config', 'sample_mflix']:
            continue
        
        print(f"\n📁 Database: {db_name}")
        db = client[db_name]
        
        for coll_name in db.list_collection_names():
            # Skip GridFS chunks
            if '.chunks' in coll_name:
                continue
            
            collection = db[coll_name]
            
            # Check if collection might contain results
            if any(keyword in coll_name.lower() for keyword in ['result', 'model', 'training', 'evaluation', 'metric', 'performance']):
                print(f"\n  📊 Collection: {coll_name}")
                count = collection.count_documents({})
                print(f"     Documents: {count}")
                
                if count > 0:
                    # Show sample document
                    sample = collection.find_one()
                    print(f"     Sample keys: {list(sample.keys())[:10]}")
                    
                    # Check for specific result fields
                    if any(key in sample for key in ['roc_auc', 'accuracy', 'precision', 'recall', 'f1_score', 'metrics', 'results']):
                        print(f"\n     ✅ FOUND RESULTS!")
                        print(f"     Full document:")
                        print(json.dumps(sample, indent=2, default=str))
    
    # Specifically check for common result collection names
    print("\n" + "="*70)
    print("CHECKING SPECIFIC COLLECTIONS")
    print("="*70)
    
    db = client['mccs']  # Your main database
    
    potential_collections = [
        'mlmodels',
        'trainingdatas',
        'trainingdatasets',
        'results',
        'evaluations',
        'metrics',
        'model_results',
        'training_results'
    ]
    
    for coll_name in potential_collections:
        if coll_name in db.list_collection_names():
            collection = db[coll_name]
            count = collection.count_documents({})
            print(f"\n📊 {coll_name}: {count} documents")
            
            if count > 0:
                # Show all documents
                docs = list(collection.find().limit(5))
                for i, doc in enumerate(docs, 1):
                    print(f"\n  Document {i}:")
                    print(json.dumps(doc, indent=4, default=str))
    
    print("\n" + "="*70)
    print("SEARCH COMPLETE")
    print("="*70)

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    if 'client' in locals():
        client.close()
