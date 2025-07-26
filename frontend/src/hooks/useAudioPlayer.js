import { useState, useRef } from 'react';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const audioRef = useRef(null);

  const playAudio = (audioUrl) => {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
    }

    const audio = new Audio(`http://localhost:5000${audioUrl}`);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => setIsPlaying(false);
    
    setCurrentAudio(audio);
    audio.play().catch(console.error);
  };

  const pauseAudio = () => {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
    }
  };

  const playWelcomeSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  };

  return {
    isPlaying,
    playAudio,
    pauseAudio,
    playWelcomeSound
  };
};