from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
mongo_db = client["chatbot_AI"]

# Expose collections
users_collection = mongo_db["users"]
chat_collection = mongo_db["chat_history"]
