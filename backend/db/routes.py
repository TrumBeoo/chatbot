from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import bcrypt
import datetime
from functools import wraps

api_bp = Blueprint('api', __name__)

class AuthError(Exception):
    """Custom exception for authentication errors"""
    pass

def validate_required_fields(data, required_fields):
    """Validate required fields in request data"""
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def handle_db_errors(func):
    """Decorator to handle database errors"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except AuthError as e:
            return jsonify({"error": str(e)}), 401
        except Exception as e:
            return jsonify({"error": f"Database error: {str(e)}"}), 500
    return wrapper

@api_bp.route('/register', methods=['POST'])
@handle_db_errors
def register():
    """User registration endpoint"""
    db = current_app.mongo_db
    data = request.get_json() or {}
    
    # Validate required fields
    validate_required_fields(data, ['email', 'password', 'name'])
    
    email = data['email'].lower().strip()
    password = data['password']
    name = data['name'].strip()
    
    # Check if user already exists
    if db.users.find_one({"email": email}):
        raise AuthError("Email đã tồn tại")
    
    # Create user document
    user = {
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    
    result = db.users.insert_one(user)
    
    return jsonify({
        "message": "Đăng ký thành công",
        "user_id": str(result.inserted_id)
    }), 201

@api_bp.route('/login', methods=['POST'])
@handle_db_errors
def login():
    """User login endpoint"""
    db = current_app.mongo_db
    data = request.get_json() or {}
    
    # Validate required fields
    validate_required_fields(data, ['email', 'password'])
    
    email = data['email'].lower().strip()
    password = data['password']
    
    # Find user
    user = db.users.find_one({"email": email})
    if not user or not verify_password(password, user['password_hash']):
        raise AuthError("Sai email hoặc mật khẩu")
    
    # Update last login
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.datetime.utcnow()}}
    )
    
    return jsonify({
        "message": "Đăng nhập thành công",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        }
    }), 200

@api_bp.route('/chat', methods=['POST'])
@handle_db_errors
def save_chat():
    """Save chat history endpoint"""
    db = current_app.mongo_db
    data = request.get_json() or {}
    
    # Validate required fields
    validate_required_fields(data, ['user_id', 'messages'])
    
    user_id = data["user_id"]
    messages = data["messages"]
    
    # Validate ObjectId
    try:
        user_object_id = ObjectId(user_id)
    except:
        raise ValueError("Invalid user_id format")
    
    # Verify user exists
    if not db.users.find_one({"_id": user_object_id}):
        raise ValueError("User not found")
    
    chat_entry = {
        "user_id": user_object_id,
        "messages": messages,
        "timestamp": datetime.datetime.utcnow()
    }
    
    db.chat_history.insert_one(chat_entry)
    return jsonify({"message": "Lưu chat thành công"}), 201

@api_bp.route('/chat/<user_id>', methods=['GET'])
@handle_db_errors
def get_chat(user_id):
    """Get chat history endpoint"""
    db = current_app.mongo_db
    
    # Validate ObjectId
    try:
        user_object_id = ObjectId(user_id)
    except:
        raise ValueError("Invalid user_id format")
    
    # Get chat history with pagination
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    skip = (page - 1) * limit
    
    chats = db.chat_history.find(
        {"user_id": user_object_id}
    ).sort("timestamp", -1).skip(skip).limit(limit)
    
    result = []
    for chat in chats:
        result.append({
            "id": str(chat["_id"]),
            "messages": chat["messages"],
            "timestamp": chat["timestamp"].isoformat()
        })
    
    return jsonify({
        "chats": result,
        "page": page,
        "limit": limit
    }), 200
    
