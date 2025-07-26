from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import bcrypt
import datetime


api_bp = Blueprint('api', __name__)
@api_bp.route('/register', methods=['POST'])
def register():
    db = current_app.mongo_db
    data = request.json or {}
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password or not name:
        return jsonify({"error": "Thiếu thông tin đăng ký"}), 400

    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email đã tồn tại"}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    user = {
        "name": name,
        "email": email,
        "password_hash": hashed_pw,
        "created_at": datetime.datetime.utcnow()
    }

    result = db.users.insert_one(user)
    return jsonify({"message": "Đăng ký thành công", "user_id": str(result.inserted_id)}), 201


@api_bp.route('/login', methods=['POST'])
def login():
    db = current_app.mongo_db
    data = request.json
    email = data['email']
    password = data['password']

    user = db.users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
        return jsonify({"error": "Sai email hoặc mật khẩu"}), 401

    return jsonify({
        "message": "Đăng nhập thành công",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        }
    }), 200


@api_bp.route('/chat', methods=['POST'])
def save_chat():
    db = current_app.mongo_db
    data = request.json
    user_id = data["user_id"]
    messages = data["messages"]

    chat_entry = {
        "user_id": ObjectId(user_id),
        "messages": messages,
        "timestamp": datetime.datetime.utcnow()
    }

    db.chat_history.insert_one(chat_entry)
    return jsonify({"message": "Lưu chat thành công"}), 201


@api_bp.route('/chat/<user_id>', methods=['GET'])
def get_chat(user_id):
    db = current_app.mongo_db
    chats = db.chat_history.find({"user_id": ObjectId(user_id)})
    result = []
    for chat in chats:
        result.append({
            "messages": chat["messages"],
            "timestamp": chat["timestamp"]
        })
    return jsonify(result), 200
