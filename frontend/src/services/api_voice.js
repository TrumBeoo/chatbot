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
   if (text.trim().length < 2) throw new Error('Text too short');
 }

 // Enhanced language detection on frontend
 _detectLanguageHint(text) {
   const vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
   const vietnamese_words = ['tôi', 'bạn', 'chúng', 'của', 'trong', 'một', 'có', 'được', 'này', 'đó', 'là', 'và', 'với', 'cho'];
   const english_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'this', 'that', 'is', 'are'];
   
   const textLower = text.toLowerCase();
   
   // Check Vietnamese characters
   if (vietnamese_chars.split('').some(char => textLower.includes(char))) {
     return 'vi';
   }
   
   // Check Vietnamese words
   const vietnameseWordCount = vietnamese_words.filter(word => textLower.includes(word)).length;
   const englishWordCount = english_words.filter(word => textLower.includes(word)).length;
   
   if (vietnameseWordCount > englishWordCount) {
     return 'vi';
   } else if (englishWordCount > vietnameseWordCount) {
     return 'en';
   }
   
   // Default fallback
   return null; // Let backend decide
 }

 async voiceChat(text, languageHint = null, conversationId = null) {
   try {
     this._validateText(text);
     
     const isAuth = this._isAuthenticated();
     const endpoint = isAuth ? '/voice-chat-authenticated' : '/voice-chat';
     
     // Detect language hint if not provided
     const detectedHint = languageHint || this._detectLanguageHint(text);
     
     const body = { 
       text: text.trim()
     };
     
     // Only include language hint if we have one (let backend do primary detection)
     if (detectedHint) {
       body.language_hint = detectedHint;
     }
     
     if (conversationId && isAuth) {
       body.conversation_id = conversationId;
     }

     console.log('Voice API Request:', { 
       text: text.substring(0, 50) + '...', 
       hint: detectedHint,
       endpoint 
     });

     const response = await fetch(`${this.baseURL}${endpoint}`, {
       method: 'POST',
       headers: this._getHeaders(isAuth),
       body: JSON.stringify(body),
       signal: AbortSignal.timeout(this.timeout)
     });

     if (!response.ok) {
       if (response.status === 401) {
         localStorage.removeItem('token');
         throw new Error('Authentication required - please login again');
       }
       if (response.status === 429) {
         throw new Error('Too many requests - please wait a moment');
       }
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.message || `Request failed with status ${response.status}`);
     }

     const data = await response.json();
     
     if (data.status !== 'success') {
       throw new Error(data.message || 'Voice chat processing failed');
     }

     console.log('Voice API Response:', { 
       detectedLang: data.language,
       hasAudio: !!data.audio,
       responseLength: data.response?.length 
     });

     return {
       success: true,
       response: data.response,
       language: data.language, // This is the detected language from backend
       audioBase64: data.audio,
       conversationId: data.conversation_id || conversationId
     };

   } catch (error) {
     console.error('Voice chat error:', error);
     
     if (error.name === 'AbortError' || error.name === 'TimeoutError') {
       return {
         success: false,
         error: 'Request timeout - please try again'
       };
     }
     
     if (error.message.includes('fetch')) {
       return {
         success: false,
         error: 'Network error - please check your connection'
       };
     }
     
     return {
       success: false,
       error: error.message || 'Unknown error occurred'
     };
   }
 }

 async healthCheck() {
   try {
     const response = await fetch(`${this.baseURL}/health`, {
       method: 'GET',
       signal: AbortSignal.timeout(5000)
     });
     
     if (response.ok) {
       const data = await response.json();
       return data.status === 'healthy';
     }
     return false;
   } catch (error) {
     console.warn('Health check failed:', error);
     return false;
   }
 }

 createAudioElement(audioBase64) {
   if (!audioBase64) {
     console.warn('No audio data provided');
     return null;
   }
   
   try {
     const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
     
     // Set audio properties for better playback
     audio.preload = 'auto';
     audio.volume = 0.8;
     
     // Add error handling
     audio.onerror = (e) => {
       console.error('Audio element error:', e);
     };
     
     return audio;
   } catch (error) {
     console.error('Failed to create audio element:', error);
     return null;
   }
 }

 // Utility method to test language detection
 testLanguageDetection(text) {
   return this._detectLanguageHint(text);
 }
}

export const voiceApi = new VoiceApiService();
export default voiceApi;