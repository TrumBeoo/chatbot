from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime
from bson import ObjectId
from auth import token_required
from db import chat_collection, users_collection

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/conversations', methods=['GET'])
@cross_origin()
@token_required
def get_conversations(current_user_id):
    """Get all conversations for the current user"""
    try:
        # Get conversations for the user, sorted by last updated
        conversations = list(chat_collection.find(
            {'user_id': ObjectId(current_user_id)},
            {'_id': 1, 'title': 1, 'created_at': 1, 'updated_at': 1, 'message_count': 1}
        ).sort('updated_at', -1))
        
        # Convert ObjectId to string and format data
        for conv in conversations:
            conv['_id'] = str(conv['_id'])
            conv['message_count'] = len(conv.get('messages', []))
        
        return jsonify({
            'conversations': conversations
        }), 200
        
    except Exception as e:
        print(f"Get conversations error: {str(e)}")
        return jsonify({'error': 'Failed to get conversations'}), 500

@chat_bp.route('/conversations', methods=['POST'])
@cross_origin()
@token_required
def create_conversation(current_user_id):
    """Create a new conversation"""
    try:
        data = request.get_json()
        title = data.get('title', 'New Conversation') if data else 'New Conversation'
        
        conversation_data = {
            'user_id': ObjectId(current_user_id),
            'title': title,
            'messages': [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = chat_collection.insert_one(conversation_data)
        conversation_id = result.inserted_id
        
        return jsonify({
            'message': 'Conversation created successfully',
            'conversation_id': str(conversation_id),
            'conversation': {
                '_id': str(conversation_id),
                'title': title,
                'created_at': conversation_data['created_at'],
                'updated_at': conversation_data['updated_at'],
                'message_count': 0
            }
        }), 201
        
    except Exception as e:
        print(f"Create conversation error: {str(e)}")
        return jsonify({'error': 'Failed to create conversation'}), 500

@chat_bp.route('/conversations/<conversation_id>', methods=['GET'])
@cross_origin()
@token_required
def get_conversation(current_user_id, conversation_id):
    """Get a specific conversation with all messages"""
    try:
        # Validate conversation_id format
        if not ObjectId.is_valid(conversation_id):
            return jsonify({'error': 'Invalid conversation ID'}), 400
        
        conversation = chat_collection.find_one({
            '_id': ObjectId(conversation_id),
            'user_id': ObjectId(current_user_id)
        })
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Format conversation data
        conversation['_id'] = str(conversation['_id'])
        conversation['user_id'] = str(conversation['user_id'])
        
        # Format messages
        messages = conversation.get('messages', [])
        for message in messages:
            if '_id' in message:
                message['_id'] = str(message['_id'])
        
        return jsonify({
            'conversation': conversation
        }), 200
        
    except Exception as e:
        print(f"Get conversation error: {str(e)}")
        return jsonify({'error': 'Failed to get conversation'}), 500

@chat_bp.route('/conversations/<conversation_id>/messages', methods=['POST'])
@cross_origin()
@token_required
def add_message(current_user_id, conversation_id):
    """Add a message to a conversation"""
    try:
        # Validate conversation_id format
        if not ObjectId.is_valid(conversation_id):
            return jsonify({'error': 'Invalid conversation ID'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user_message = data.get('user_message', '').strip()
        bot_response = data.get('bot_response', '').strip()
        language = data.get('language', 'vi')
        
        if not user_message:
            return jsonify({'error': 'User message is required'}), 400
        
        # Check if conversation exists and belongs to user
        conversation = chat_collection.find_one({
            '_id': ObjectId(conversation_id),
            'user_id': ObjectId(current_user_id)
        })
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Create message objects
        timestamp = datetime.utcnow()
        
        user_msg = {
            '_id': ObjectId(),
            'text': user_message,
            'sender': 'user',
            'timestamp': timestamp,
            'language': language
        }
        
        messages_to_add = [user_msg]
        
        if bot_response:
            bot_msg = {
                '_id': ObjectId(),
                'text': bot_response,
                'sender': 'bot',
                'timestamp': timestamp,
                'language': language
            }
            messages_to_add.append(bot_msg)
        
        # Update conversation with new messages
        result = chat_collection.update_one(
            {'_id': ObjectId(conversation_id)},
            {
                '$push': {'messages': {'$each': messages_to_add}},
                '$set': {'updated_at': timestamp}
            }
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Failed to add message'}), 500
        
        # Format messages for response
        formatted_messages = []
        for msg in messages_to_add:
            formatted_msg = {
                '_id': str(msg['_id']),
                'text': msg['text'],
                'sender': msg['sender'],
                'timestamp': msg['timestamp'],
                'language': msg['language']
            }
            formatted_messages.append(formatted_msg)
        
        return jsonify({
            'message': 'Messages added successfully',
            'messages': formatted_messages
        }), 201
        
    except Exception as e:
        print(f"Add message error: {str(e)}")
        return jsonify({'error': 'Failed to add message'}), 500

@chat_bp.route('/conversations/<conversation_id>', methods=['PUT'])
@cross_origin()
@token_required
def update_conversation(current_user_id, conversation_id):
    """Update conversation (e.g., change title)"""
    try:
        # Validate conversation_id format
        if not ObjectId.is_valid(conversation_id):
            return jsonify({'error': 'Invalid conversation ID'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        update_data = {}
        
        if 'title' in data:
            title = data['title'].strip()
            if title:
                update_data['title'] = title
        
        if not update_data:
            return jsonify({'error': 'No valid data to update'}), 400
        
        update_data['updated_at'] = datetime.utcnow()
        
        # Update conversation
        result = chat_collection.update_one(
            {
                '_id': ObjectId(conversation_id),
                'user_id': ObjectId(current_user_id)
            },
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Conversation not found'}), 404
        
        return jsonify({
            'message': 'Conversation updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Update conversation error: {str(e)}")
        return jsonify({'error': 'Failed to update conversation'}), 500

@chat_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@cross_origin()
@token_required
def delete_conversation(current_user_id, conversation_id):
    """Delete a conversation"""
    try:
        # Validate conversation_id format
        if not ObjectId.is_valid(conversation_id):
            return jsonify({'error': 'Invalid conversation ID'}), 400
        
        # Delete conversation
        result = chat_collection.delete_one({
            '_id': ObjectId(conversation_id),
            'user_id': ObjectId(current_user_id)
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Conversation not found'}), 404
        
        return jsonify({
            'message': 'Conversation deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Delete conversation error: {str(e)}")
        return jsonify({'error': 'Failed to delete conversation'}), 500

@chat_bp.route('/conversations/<conversation_id>/messages/<message_id>', methods=['DELETE'])
@cross_origin()
@token_required
def delete_message(current_user_id, conversation_id, message_id):
    """Delete a specific message from a conversation"""
    try:
        # Validate IDs format
        if not ObjectId.is_valid(conversation_id) or not ObjectId.is_valid(message_id):
            return jsonify({'error': 'Invalid ID format'}), 400
        
        # Remove message from conversation
        result = chat_collection.update_one(
            {
                '_id': ObjectId(conversation_id),
                'user_id': ObjectId(current_user_id)
            },
            {
                '$pull': {'messages': {'_id': ObjectId(message_id)}},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Conversation not found'}), 404
        
        if result.modified_count == 0:
            return jsonify({'error': 'Message not found'}), 404
        
        return jsonify({
            'message': 'Message deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Delete message error: {str(e)}")
        return jsonify({'error': 'Failed to delete message'}), 500

@chat_bp.route('/search', methods=['GET'])
@cross_origin()
@token_required
def search_conversations(current_user_id):
    """Search conversations and messages"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        # Search in conversation titles and message content
        search_results = list(chat_collection.find({
            'user_id': ObjectId(current_user_id),
            '$or': [
                {'title': {'$regex': query, '$options': 'i'}},
                {'messages.text': {'$regex': query, '$options': 'i'}}
            ]
        }).sort('updated_at', -1))
        
        # Format results
        for result in search_results:
            result['_id'] = str(result['_id'])
            result['user_id'] = str(result['user_id'])
            
            # Filter messages that match the search query
            matching_messages = []
            for message in result.get('messages', []):
                if query.lower() in message.get('text', '').lower():
                    message['_id'] = str(message['_id'])
                    matching_messages.append(message)
            
            result['matching_messages'] = matching_messages
            result['message_count'] = len(result.get('messages', []))
        
        return jsonify({
            'results': search_results,
            'query': query
        }), 200
        
    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({'error': 'Search failed'}), 500

@chat_bp.route('/export', methods=['GET'])
@cross_origin()
@token_required
def export_conversations(current_user_id):
    """Export all conversations for a user"""
    try:
        conversations = list(chat_collection.find({
            'user_id': ObjectId(current_user_id)
        }).sort('created_at', 1))
        
        # Format for export
        export_data = {
            'user_id': current_user_id,
            'export_date': datetime.utcnow().isoformat(),
            'conversations': []
        }
        
        for conv in conversations:
            conv_data = {
                'id': str(conv['_id']),
                'title': conv['title'],
                'created_at': conv['created_at'].isoformat(),
                'updated_at': conv['updated_at'].isoformat(),
                'messages': []
            }
            
            for message in conv.get('messages', []):
                msg_data = {
                    'id': str(message['_id']),
                    'text': message['text'],
                    'sender': message['sender'],
                    'timestamp': message['timestamp'].isoformat(),
                    'language': message.get('language', 'vi')
                }
                conv_data['messages'].append(msg_data)
            
            export_data['conversations'].append(conv_data)
        
        return jsonify(export_data), 200
        
    except Exception as e:
        print(f"Export error: {str(e)}")
        return jsonify({'error': 'Export failed'}), 500