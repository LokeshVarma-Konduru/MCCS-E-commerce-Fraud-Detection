#!/usr/bin/env python3
"""
Retrieve MCCS Model Files from MongoDB
Downloads transformer.pkl and xgb_model.json from MongoDB modelfiles collection
"""

import pymongo
from dotenv import load_dotenv
import os
import sys

# Load environment variables from backend/.env
backend_env_path = os.path.join('..', 'backend', '.env')
load_dotenv(backend_env_path)

print("="*70)
print("RETRIEVING MCCS MODELS FROM MONGODB")
print("="*70)

# Get MongoDB connection details
mongo_url = os.getenv('MONGO_URI') or os.getenv('MONGODB_URL')
if not mongo_url:
    print("❌ Error: MONGO_URI not found in .env file")
    print("   Please check backend/.env file")
    sys.exit(1)

print(f"✅ Found MongoDB URL")

try:
    # Connect to MongoDB
    print("\n[1/4] Connecting to MongoDB...")
    client = pymongo.MongoClient(mongo_url)
    
    # Search for model-related collections across all databases
    print("   Searching all databases for model collections...")
    
    found_db = None
    found_collection_name = None
    
    for db_name in client.list_database_names():
        if db_name in ['admin', 'local', 'config', 'sample_mflix']:  # Skip system/sample databases
            continue
        db = client[db_name]
        collections = db.list_collection_names()
        print(f"   Database '{db_name}': {collections}")
        
        # Look for collections with 'model' in the name
        for coll_name in collections:
            if 'model' in coll_name.lower():
                found_db = db_name
                found_collection_name = coll_name
                break
        if found_db:
            break
    
    if not found_collection_name:
        print(f"❌ Error: No model-related collection found")
        print(f"   Please specify the correct collection name")
        sys.exit(1)
    
    db = client[found_db]
    
    modelfiles = db[found_collection_name]
    print(f"✅ Connected to database: {found_db}")
    print(f"✅ Found collection: {found_collection_name}")
    
    # List all files in collection
    print("\n[2/4] Scanning modelfiles collection...")
    all_files = list(modelfiles.find({}, {'filename': 1, 'upload_date': 1, 'length': 1}))
    
    if not all_files:
        print("❌ No files found in modelfiles collection")
        sys.exit(1)
    
    print(f"✅ Found {len(all_files)} file(s):")
    for file_doc in all_files:
        filename = file_doc.get('filename', 'unknown')
        size = file_doc.get('length', 0)
        date = file_doc.get('upload_date', 'unknown')
        print(f"   - {filename} ({size:,} bytes, uploaded: {date})")
    
    # Retrieve xgboost_pipeline.pkl (contains both transformer and model)
    print("\n[3/4] Retrieving xgboost_pipeline.pkl...")
    
    # Get the latest xgboost_pipeline (there are 2, get the larger one)
    pipeline_docs = list(modelfiles.find({'filename': 'xgboost_pipeline.pkl'}).sort('length', -1))
    
    if not pipeline_docs:
        print("❌ xgboost_pipeline.pkl not found")
        sys.exit(1)
    
    # Use GridFS to retrieve the file
    from gridfs import GridFS
    fs = GridFS(db, collection='modelFiles')
    
    pipeline_doc = pipeline_docs[0]  # Get the larger one
    file_id = pipeline_doc['_id']
    
    print(f"   Found: {pipeline_doc['filename']} ({pipeline_doc['length']:,} bytes)")
    
    # Download the file
    grid_file = fs.get(file_id)
    pipeline_data = grid_file.read()
    
    # Save the complete pipeline
    print("\n[4/4] Saving complete pipeline...")
    with open('ML_Server/xgboost_pipeline.pkl', 'wb') as f:
        f.write(pipeline_data)
    print(f"✅ Saved ML_Server/xgboost_pipeline.pkl ({len(pipeline_data):,} bytes)")
    
    print("\n⚠️  Note: Due to scikit-learn version mismatch, saved as complete pipeline")
    print("   You'll need to update predict_service.py to load the pipeline directly")
    
    print("\n" + "="*70)
    print("RETRIEVAL COMPLETE")
    print("="*70)
    
    # Verify files exist
    if os.path.exists('ML_Server/xgboost_pipeline.pkl'):
        print("✅ ML_Server/xgboost_pipeline.pkl is ready")
    else:
        print("❌ ML_Server/xgboost_pipeline.pkl not found")
    
    print("\n📝 Next step: Update predict_service.py to use the pipeline")
    print("="*70)
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    if 'client' in locals():
        client.close()
