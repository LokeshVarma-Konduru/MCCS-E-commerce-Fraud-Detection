import os
import gridfs
from pymongo import MongoClient
from dotenv import load_dotenv

# 1️⃣ Load .env file (from parent folder)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# 2️⃣ Get Mongo URI from environment
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    raise ValueError("❌ MONGO_URI not found in .env file")

# 3️⃣ Connect to MongoDB
client = MongoClient(mongo_uri)
db = client["mccs"]
fs = gridfs.GridFS(db, collection="modelFiles")

# 4️⃣ Upload all .pkl files from current folder
folder = os.path.dirname(os.path.abspath(__file__))

for filename in os.listdir(folder):
    if filename.endswith(".pkl"):
        path = os.path.join(folder, filename)
        with open(path, "rb") as f:
            existing = db.modelFiles.files.find_one({"filename": filename})
            if existing:
                fs.delete(existing["_id"])
                print(f"🗑️  Deleted old version of {filename}")

            fs.put(f, filename=filename)
            print(f"✅ Uploaded: {filename}")

print("🎯 All model files uploaded successfully to 'mccs.modelFiles' bucket!")
client.close()
