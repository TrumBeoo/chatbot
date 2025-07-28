from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")


client = MongoClient("MONGO_URI")
mongo_db = client["chatbot_AI"]

# Expose collections
users_collection = mongo_db["users"]
chat_collection = mongo_db["chat_history"]
