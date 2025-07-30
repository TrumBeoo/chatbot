from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import bcrypt
import datetime
import requests
import jwt
from functools import wraps
import os


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
    

def verify_google_token(credential):
    """Verify Google OAuth token and return user info"""
    try:
        # Google's tokeninfo endpoint to verify the JWT token
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            raise AuthError("Invalid Google token")
        
        user_info = response.json()
        
        # Basic validation
        if not user_info.get('email_verified'):
            raise AuthError("Google email not verified")
        
        return {
            'email': user_info.get('email'),
            'name': user_info.get('name'),
            'google_id': user_info.get('sub'),
            'picture': user_info.get('picture')
        }
        
    except requests.RequestException as e:
        raise AuthError(f"Failed to verify Google token: {str(e)}")
    except Exception as e:
        raise AuthError(f"Google authentication error: {str(e)}")

def verify_facebook_token(access_token):
    """Verify Facebook access token and return user info"""
    try:
        # Verify token with Facebook Graph API
        app_secret = current_app.config.get('FACEBOOK_APP_SECRET') or os.environ.get('FACEBOOK_APP_SECRET')
        
        # First, verify the token is valid for our app
        app_token_url = f"https://graph.facebook.com/oauth/access_token?client_id={current_app.config.get('FACEBOOK_APP_ID')}&client_secret={app_secret}&grant_type=client_credentials"
        
        app_token_response = requests.get(app_token_url, timeout=10)
        if app_token_response.status_code != 200:
            raise AuthError("Failed to get app access token")
        
        app_token = app_token_response.json().get('access_token')
        
        # Verify user token
        verify_url = f"https://graph.facebook.com/debug_token?input_token={access_token}&access_token={app_token}"
        verify_response = requests.get(verify_url, timeout=10)
        
        if verify_response.status_code != 200:
            raise AuthError("Invalid Facebook token")
        
        token_data = verify_response.json()
        if not token_data.get('data', {}).get('is_valid'):
            raise AuthError("Facebook token is not valid")
        
        # Get user info from Facebook Graph API
        fields = "id,name,email,picture.type(large)"
        user_url = f"https://graph.facebook.com/me?fields={fields}&access_token={access_token}"
        user_response = requests.get(user_url, timeout=10)
        
        if user_response.status_code != 200:
            raise AuthError("Failed to get user info from Facebook")
        
        user_info = user_response.json()
        
        if 'error' in user_info:
            raise AuthError(f"Facebook API error: {user_info['error']['message']}")
        
        return {
            'email': user_info.get('email'),
            'name': user_info.get('name'),
            'facebook_id': user_info.get('id'),
            'picture': user_info.get('picture', {}).get('data', {}).get('url') if user_info.get('picture') else None
        }
        
    except requests.RequestException as e:
        raise AuthError(f"Failed to verify Facebook token: {str(e)}")
    except Exception as e:
        raise AuthError(f"Facebook authentication error: {str(e)}")

def find_or_create_social_user(db, provider, user_info):
    """Find existing user or create new one for social login"""
    email = user_info.get('email')
    provider_id_field = f"{provider}_id"
    provider_id = user_info.get(provider_id_field)
    
    # First, try to find user by provider ID
    if provider_id:
        user = db.users.find_one({provider_id_field: provider_id})
        if user:
            # Update last login
            db.users.update_one(
                {"_id": user["_id"]}, 
                {"$set": {
                    "last_login": datetime.datetime.utcnow(),
                    "updated_at": datetime.datetime.utcnow()
                }}
            )
            return user
    
    # If no user found by provider ID, check by email
    if email:
        user = db.users.find_one({"email": email.lower()})
        if user:
            # Link this social account to existing user
            update_data = {
                "last_login": datetime.datetime.utcnow(),
                "updated_at": datetime.datetime.utcnow()
            }
            if provider_id:
                update_data[provider_id_field] = provider_id
            
            db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
            return user
    
    # Create new user
    new_user_data = {
        "name": user_info.get('name', f'{provider.title()} User'),
        "email": email.lower() if email else None,
        "auth_provider": provider,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow(),
        "last_login": datetime.datetime.utcnow()
    }
    
    # Add provider-specific ID if available
    if provider_id:
        new_user_data[provider_id_field] = provider_id
    
    # Add profile picture if available
    if user_info.get('picture'):
        new_user_data['profile_picture'] = user_info['picture']
    
    result = db.users.insert_one(new_user_data)
    new_user_data['_id'] = result.inserted_id
    return new_user_data

@api_bp.route('/auth/google', methods=['POST'])
@handle_db_errors
def google_auth():
    """Google OAuth authentication endpoint"""
    db = current_app.mongo_db
    data = request.get_json() or {}
    
    # Validate required fields
    if 'credential' not in data:
        raise ValueError("Google credential is required")
    
    try:
        # Verify Google token and get user info
        user_info = verify_google_token(data['credential'])
        
        # Find or create user
        user = find_or_create_social_user(db, 'google', user_info)
        
        return jsonify({
            "message": "Đăng nhập Google thành công",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user.get("email"),
                "profile_picture": user.get("profile_picture"),
                "auth_provider": user.get("auth_provider", "google")
            }
        }), 200
        
    except AuthError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": f"Google authentication failed: {str(e)}"}), 500

@api_bp.route('/auth/facebook', methods=['POST'])
@handle_db_errors
def facebook_auth():
    """Facebook OAuth authentication endpoint"""
    db = current_app.mongo_db
    data = request.get_json() or {}
    
    # Validate required fields
    if 'accessToken' not in data:
        raise ValueError("Facebook access token is required")
    
    try:
        # Verify Facebook token and get user info
        user_info = verify_facebook_token(data['accessToken'])
        
        # Ensure we have at least a name and facebook_id
        if not user_info.get('facebook_id'):
            raise AuthError("Unable to get Facebook user ID")
        
        if not user_info.get('name'):
            user_info['name'] = f"Facebook User {user_info['facebook_id'][:8]}"
        
        # Find or create user
        user = find_or_create_social_user(db, 'facebook', user_info)
        
        return jsonify({
            "message": "Đăng nhập Facebook thành công",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user.get("email"),
                "profile_picture": user.get("profile_picture"),
                "auth_provider": user.get("auth_provider", "facebook")
            }
        }), 200
        
    except AuthError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": f"Facebook authentication failed: {str(e)}"}), 500