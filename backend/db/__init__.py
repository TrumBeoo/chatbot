from pymongo import MongoClient

client = MongoClient("mongodb+srv://TrumBeoo:1xr1R8BRdLafRzTg@trumbeoo.c0hnfng.mongodb.net/?retryWrites=true&w=majority&appName=TrumBeoo")
mongo_db = client["chatbot_AI"]

# Expose collections
users_collection = mongo_db["users"]
chat_collection = mongo_db["chat_history"]
