class VoiceChatManager {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.initSpeechRecognition();
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
        } else {
            console.error('Speech recognition not supported');
            return;
        }

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'vi-VN';

        this.recognition.onstart = () => {
            this.isListening = true;
            document.getElementById('voiceBtn').textContent = '🎤 Đang nghe...';
            document.getElementById('voiceBtn').style.background = '#dc3545';
        };

        this.recognition.onend = () => {
            this.isListening = false;
            document.getElementById('voiceBtn').textContent = '🎤 Nói';
            document.getElementById('voiceBtn').style.background = '#28a745';
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('messageInput').value = transcript;
            this.sendMessage(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            document.getElementById('voiceBtn').textContent = '🎤 Nói';
            document.getElementById('voiceBtn').style.background = '#28a745';
        };
    }

    toggleListening() {
        if (!this.recognition) {
            alert('Trình duyệt không hỗ trợ nhận diện giọng nói!');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            // Detect language and set recognition language
            const lastMessage = document.querySelector('.bot-message:last-of-type')?.textContent || '';
            const isVietnamese = this.detectVietnamese(lastMessage);
            this.recognition.lang = isVietnamese ? 'vi-VN' : 'en-US';
            
            this.recognition.start();
        }
    }

    detectVietnamese(text) {
        const vietnameseChars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
        return vietnameseChars.split('').some(char => text.toLowerCase().includes(char));
    }

    speak(text, lang = 'vi') {
        // Stop any current speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice based on language
        const voices = this.synthesis.getVoices();
        if (lang === 'vi') {
            const vietnameseVoice = voices.find(voice => 
                voice.lang.includes('vi') || voice.name.includes('Vietnamese')
            );
            if (vietnameseVoice) utterance.voice = vietnameseVoice;
            utterance.lang = 'vi-VN';
        } else {
            const englishVoice = voices.find(voice => 
                voice.lang.includes('en-US')
            );
            if (englishVoice) utterance.voice = englishVoice;
            utterance.lang = 'en-US';
        }

        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        this.synthesis.speak(utterance);
    }

    async sendMessage(message) {
        if (!message.trim()) return;

        // Add user message to chat
        addMessage(message, true);
        
        // Show loading
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading';
        loadingDiv.textContent = 'Đang suy nghĩ...';
        document.getElementById('chatBox').appendChild(loadingDiv);
        document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            document.getElementById('chatBox').removeChild(loadingDiv);

            if (data.status === 'success') {
                addMessage(data.response);
                
                // Auto-speak the response if voice mode is enabled
                if (document.getElementById('autoSpeakToggle').checked) {
                    this.speak(data.response, data.detected_language);
                }
            } else {
                addMessage('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!');
            }
        } catch (error) {
            document.getElementById('chatBox').removeChild(loadingDiv);
            addMessage('Không thể kết nối đến server!');
        }
    }
}

// Initialize voice chat manager
const voiceChatManager = new VoiceChatManager();