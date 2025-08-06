import { keyframes } from '@emotion/react';

export const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
`;

export const wave = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  75% { transform: rotate(-10deg); }
`;

export const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

export const slideUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

export const VoiceAssistant = keyframes`
  0% { 
    transform: scale(1); 
    opacity: 0.7; 
  }
  25% { 
    transform: scale(1.1); 
    opacity: 0.9; 
  }
  50% { 
    transform: scale(1.2); 
    opacity: 1; 
  }
  75% { 
    transform: scale(1.1); 
    opacity: 0.9; 
  }
  100% { 
    transform: scale(1); 
    opacity: 0.7; 
  }
`;

export const voiceWave = keyframes`
  0%, 100% { 
    height: 20px; 
    opacity: 0.4; 
  }
  50% { 
    height: 40px; 
    opacity: 1; 
  }
`;

export const voiceRipple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
`;

  