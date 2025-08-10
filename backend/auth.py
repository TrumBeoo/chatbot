from flask import Blueprint, request, jsonify, session
from flask_cors import cross_origin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
import requests
from functools import wraps
from db import users_collection, chat_collection
from bson import ObjectId
import re

auth_bp = Blueprint('auth', __name__)

# JWT Secret Key
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-this')
JWT_EXPIRATION_HOURS = 24

def token_required(f):
    """Decorator to require JWT token for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user_id = data['user_id']
            
            # Get user from database
            user = users_collection.find_one({'_id': ObjectId(current_user_id)})
            if not user:
                return jsonify({'error': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'error': 'Token validation failed'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

def generate_jwt_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, "Password is valid"

@auth_bp.route('/register', methods=['POST'])
@cross_origin()
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        
        # Validation
        if not email or not password or not name:
            return jsonify({'error': 'Email, password, and name are required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if user already exists
        existing_user = users_collection.find_one({'email': email})
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Create new user
        hashed_password = generate_password_hash(password)
        user_data = {
            'email': email,
            'password': hashed_password,
            'name': name,
            'provider': 'email',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'is_active': True,
            'profile_picture': None
        }
        
        result = users_collection.insert_one(user_data)
        user_id = result.inserted_id
        
        # Generate JWT token
        token = generate_jwt_token(user_id)
        
        # Return user data (without password)
        user_data['_id'] = str(user_id)
        del user_data['password']
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user_data,
            'token': token
        }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check password
        if not check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )
        
        # Generate JWT token
        token = generate_jwt_token(user['_id'])
        
        # Return user data (without password)
        user_data = {
            '_id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'provider': user.get('provider', 'email'),
            'profile_picture': user.get('profile_picture'),
            'created_at': user['created_at'],
            'last_login': datetime.utcnow()
        }
        
        return jsonify({
            'message': 'Login successful',
            'user': user_data,
            'token': token
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/google-login', methods=['POST'])
@cross_origin()
def google_login():
    """Google OAuth login"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        google_token = data.get('token')
        if not google_token:
            return jsonify({'error': 'Google token is required'}), 400
        
        # Verify Google token
        google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        if not google_client_id:
            return jsonify({'error': 'Google authentication not configured'}), 500
        
        # Verify token with Google
        response = requests.get(
            f'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={google_token}'
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Invalid Google token'}), 401
        
        google_data = response.json()
        
        # Get user info from Google
        user_info_response = requests.get(
            f'https://www.googleapis.com/oauth2/v1/userinfo?access_token={google_token}'
        )
        
        if user_info_response.status_code != 200:
            return jsonify({'error': 'Failed to get user info from Google'}), 401
        
        user_info = user_info_response.json()
        
        email = user_info.get('email', '').lower()
        name = user_info.get('name', '')
        google_id = user_info.get('id')
        profile_picture = user_info.get('picture')
        
        if not email or not google_id:
            return jsonify({'error': 'Invalid Google user data'}), 400
        
        # Check if user exists
        user = users_collection.find_one({'email': email})
        
        if user:
            # Update existing user
            users_collection.update_one(
                {'_id': user['_id']},
                {
                    '$set': {
                        'last_login': datetime.utcnow(),
                        'google_id': google_id,
                        'profile_picture': profile_picture,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            user_id = user['_id']
        else:
            # Create new user
            user_data = {
                'email': email,
                'name': name,
                'google_id': google_id,
                'provider': 'google',
                'profile_picture': profile_picture,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'last_login': datetime.utcnow(),
                'is_active': True
            }
            
            result = users_collection.insert_one(user_data)
            user_id = result.inserted_id
        
        # Generate JWT token
        token = generate_jwt_token(user_id)
        
        # Get updated user data
        user = users_collection.find_one({'_id': user_id})
        user_data = {
            '_id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'provider': user.get('provider', 'google'),
            'profile_picture': user.get('profile_picture'),
            'created_at': user['created_at'],
            'last_login': user.get('last_login')
        }
        
        return jsonify({
            'message': 'Google login successful',
            'user': user_data,
            'token': token
        }), 200
        
    except Exception as e:
        print(f"Google login error: {str(e)}")
        return jsonify({'error': 'Google login failed'}), 500

@auth_bp.route('/facebook-login', methods=['POST'])
@cross_origin()
def facebook_login():
    """Facebook OAuth login"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        facebook_token = data.get('token')
        if not facebook_token:
            return jsonify({'error': 'Facebook token is required'}), 400
        
        # Verify Facebook token
        facebook_app_id = os.getenv('FACEBOOK_APP_ID')
        facebook_app_secret = os.getenv('FACEBOOK_APP_SECRET')
        
        if not facebook_app_id or not facebook_app_secret:
            return jsonify({'error': 'Facebook authentication not configured'}), 500
        
        # Verify token with Facebook
        verify_url = f'https://graph.facebook.com/debug_token?input_token={facebook_token}&access_token={facebook_app_id}|{facebook_app_secret}'
        response = requests.get(verify_url)
        
        if response.status_code != 200:
            return jsonify({'error': 'Invalid Facebook token'}), 401
        
        token_data = response.json()
        if not token_data.get('data', {}).get('is_valid'):
            return jsonify({'error': 'Invalid Facebook token'}), 401
        
        # Get user info from Facebook
        user_info_response = requests.get(
            f'https://graph.facebook.com/me?fields=id,name,email,picture&access_token={facebook_token}'
        )
        
        if user_info_response.status_code != 200:
            return jsonify({'error': 'Failed to get user info from Facebook'}), 401
        
        user_info = user_info_response.json()
        
        email = user_info.get('email', '').lower()
        name = user_info.get('name', '')
        facebook_id = user_info.get('id')
        profile_picture = user_info.get('picture', {}).get('data', {}).get('url')
        
        if not email or not facebook_id:
            return jsonify({'error': 'Invalid Facebook user data'}), 400
        
        # Check if user exists
        user = users_collection.find_one({'email': email})
        
        if user:
            # Update existing user
            users_collection.update_one(
                {'_id': user['_id']},
                {
                    '$set': {
                        'last_login': datetime.utcnow(),
                        'facebook_id': facebook_id,
                        'profile_picture': profile_picture,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            user_id = user['_id']
        else:
            # Create new user
            user_data = {
                'email': email,
                'name': name,
                'facebook_id': facebook_id,
                'provider': 'facebook',
                'profile_picture': profile_picture,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'last_login': datetime.utcnow(),
                'is_active': True
            }
            
            result = users_collection.insert_one(user_data)
            user_id = result.inserted_id
        
        # Generate JWT token
        token = generate_jwt_token(user_id)
        
        # Get updated user data
        user = users_collection.find_one({'_id': user_id})
        user_data = {
            '_id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'provider': user.get('provider', 'facebook'),
            'profile_picture': user.get('profile_picture'),
            'created_at': user['created_at'],
            'last_login': user.get('last_login')
        }
        
        return jsonify({
            'message': 'Facebook login successful',
            'user': user_data,
            'token': token
        }), 200
        
    except Exception as e:
        print(f"Facebook login error: {str(e)}")
        return jsonify({'error': 'Facebook login failed'}), 500

@auth_bp.route('/verify-token', methods=['POST'])
@cross_origin()
def verify_token():
    """Verify JWT token and return user data"""
    try:
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = data['user_id']
        
        # Get user from database
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Return user data (without password)
        user_data = {
            '_id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'provider': user.get('provider', 'email'),
            'profile_picture': user.get('profile_picture'),
            'created_at': user['created_at'],
            'last_login': user.get('last_login')
        }
        
        return jsonify({
            'valid': True,
            'user': user_data
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token is invalid'}), 401
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return jsonify({'error': 'Token verification failed'}), 401

@auth_bp.route('/logout', methods=['POST'])
@cross_origin()
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/profile', methods=['GET'])
@cross_origin()
@token_required
def get_profile(current_user_id):
    """Get user profile"""
    try:
        user = users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = {
            '_id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'provider': user.get('provider', 'email'),
            'profile_picture': user.get('profile_picture'),
            'created_at': user['created_at'],
            'last_login': user.get('last_login')
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        print(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@cross_origin()
@token_required
def update_profile(current_user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        update_data = {}
        
        # Update name if provided
        if 'name' in data:
            name = data['name'].strip()
            if name:
                update_data['name'] = name
        
        # Update profile picture if provided
        if 'profile_picture' in data:
            update_data['profile_picture'] = data['profile_picture']
        
        if not update_data:
            return jsonify({'error': 'No valid data to update'}), 400
        
        update_data['updated_at'] = datetime.utcnow()
        
        # Update user
        result = users_collection.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        # Get updated user data
        user = users_collection.find_one({'_id': ObjectId(current_user_id)})
        user_data = {
            '_id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'provider': user.get('provider', 'email'),
            'profile_picture': user.get('profile_picture'),
            'created_at': user['created_at'],
            'updated_at': user.get('updated_at')
        }
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user_data
        }), 200
        
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500