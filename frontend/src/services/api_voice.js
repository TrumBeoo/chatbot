const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class VoiceApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 30000;
  }

  _getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  _isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  _validateText(text) {
    if (!text?.trim()) throw new Error('Text is required');
    if (text.length > 5000) throw new Error('Text too long (max 5000 chars)');
  }

  async voiceChat(text, language = null, conversationId = null) {
    try {
      this._validateText(text);
      
      const isAuth = this._isAuthenticated();
      const endpoint = isAuth ? '/voice-chat-authenticated' : '/voice-chat';
      
      const body = { text: text.trim() };
      if (language) body.language = language;
      if (conversationId && isAuth) body.conversation_id = conversationId;

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this._getHeaders(isAuth),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Please login again');
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Voice chat failed');
      }

      return {
        success: true,
        response: data.response,
        language: data.language,
        audioBase64: data.audio,
        conversationId: data.conversation_id || conversationId
      };

    } catch (error) {
      console.error('Voice chat error:', error.message);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  createAudioElement(audioBase64) {
    if (!audioBase64) return null;
    try {
      return new Audio(`data:audio/mp3;base64,${audioBase64}`);
    } catch (error) {
      console.error('Audio creation failed:', error);
      return null;
    }
  }
}

export const voiceApi = new VoiceApiService();
export default voiceApi;