const API_BASE_URL = 'http://localhost:5000/api/chat';

class ChatHistoryService {
  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Get all conversations for the current user
  async getConversations() {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get conversations');
      }

      return {
        success: true,
        conversations: data.conversations
      };
    } catch (error) {
      console.error('Get conversations error:', error);
      throw new Error(error.message || 'Failed to get conversations');
    }
  }

  // Create a new conversation
  async createConversation(title = 'New Conversation') {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ title })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create conversation');
      }

      return {
        success: true,
        conversation: data.conversation,
        conversationId: data.conversation_id,
        message: data.message
      };
    } catch (error) {
      console.error('Create conversation error:', error);
      throw new Error(error.message || 'Failed to create conversation');
    }
  }

  // Get a specific conversation with all messages
  async getConversation(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get conversation');
      }

      return {
        success: true,
        conversation: data.conversation
      };
    } catch (error) {
      console.error('Get conversation error:', error);
      throw new Error(error.message || 'Failed to get conversation');
    }
  }

  // Add a message to a conversation
  async addMessage(conversationId, userMessage, botResponse = '', language = 'vi') {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          user_message: userMessage,
          bot_response: botResponse,
          language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add message');
      }

      return {
        success: true,
        messages: data.messages,
        message: data.message
      };
    } catch (error) {
      console.error('Add message error:', error);
      throw new Error(error.message || 'Failed to add message');
    }
  }

  // Update conversation (e.g., change title)
  async updateConversation(conversationId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update conversation');
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Update conversation error:', error);
      throw new Error(error.message || 'Failed to update conversation');
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete conversation');
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw new Error(error.message || 'Failed to delete conversation');
    }
  }

  // Delete a specific message from a conversation
  async deleteMessage(conversationId, messageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete message');
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Delete message error:', error);
      throw new Error(error.message || 'Failed to delete message');
    }
  }

  // Search conversations and messages
  async searchConversations(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      return {
        success: true,
        results: data.results,
        query: data.query
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error(error.message || 'Search failed');
    }
  }

  // Export all conversations
  async exportConversations() {
    try {
      const response = await fetch(`${API_BASE_URL}/export`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(error.message || 'Export failed');
    }
  }

  // Helper method to generate conversation title from first message
  generateConversationTitle(firstMessage, maxLength = 50) {
    if (!firstMessage) return 'New Conversation';
    
    const title = firstMessage.trim();
    if (title.length <= maxLength) return title;
    
    return title.substring(0, maxLength - 3) + '...';
  }

  // Helper method to format conversation for display
  formatConversationForDisplay(conversation) {
    return {
      id: conversation._id,
      title: conversation.title,
      messageCount: conversation.message_count || conversation.messages?.length || 0,
      lastMessage: conversation.messages?.length > 0 
        ? conversation.messages[conversation.messages.length - 1]
        : null,
      createdAt: new Date(conversation.created_at),
      updatedAt: new Date(conversation.updated_at)
    };
  }

  // Helper method to format message for display
  formatMessageForDisplay(message) {
    return {
      id: message._id,
      text: message.text,
      sender: message.sender,
      timestamp: new Date(message.timestamp),
      language: message.language || 'vi',
      isError: message.isError || false
    };
  }
}

// Create and export singleton instance
export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService;
