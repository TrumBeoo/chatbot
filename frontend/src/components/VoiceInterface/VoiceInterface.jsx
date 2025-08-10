import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody,
  Box, VStack, HStack, Text, IconButton,
  useColorModeValue, useToast
} from '@chakra-ui/react';
import { FaPause, FaPlay, FaTimes } from 'react-icons/fa';
import Lottie from 'lottie-react';
import voiceAssistantAnimation from '../../animations/VoiceAssistant.json';
import { voiceApi } from '../../services/api_voice';

const VoiceInterface = ({ isOpen, onClose, onVoiceResult, language = 'vi', currentConversation = null }) => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('vi');

  // Refs
  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);
  const lottieRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const toast = useToast();
  const bgColor = useColorModeValue('gray.300', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const overlayBg = useColorModeValue('blackAlpha.300', 'blackAlpha.600');

  const getStatusText = () => {
    if (isPlaying) return detectedLanguage === 'en' ? 'Playing response' : 'Đang phát phản hồi';
    if (isProcessing) return detectedLanguage === 'en' ? 'Processing...' : 'Đang xử lý...';
    if (isRecording) {
      if (isPaused) return detectedLanguage === 'en' ? 'Paused' : 'Đã tạm dừng';
      return detectedLanguage === 'en' ? 'Listening' : 'Đang lắng nghe';
    }
    return detectedLanguage === 'en' ? 'Tap to speak' : 'Nhấn để nói';
  };

  // Effects
  useEffect(() => {
    if (lottieRef.current) {
      if (isRecording && !isPaused && !isPlaying && !isProcessing) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
  }, [isRecording, isPaused, isPlaying, isProcessing]);

  useEffect(() => {
    if (isRecording && !isPaused && !isPlaying) {
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused, isPlaying]);

  useEffect(() => {
    if (!isOpen) endSession();
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initMic = useCallback(async () => {
    if (mediaStreamRef.current) return;
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
  }, []);

  const cleanupMic = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const initRecognition = useCallback(() => {
    if (recognitionRef.current) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Speech recognition not supported', status: 'error' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';

    recognition.onresult = (event) => {
      let finalText = '', interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text;
        else interimText += text;
      }
      
      setTranscript(`${finalText}${interimText}`.trim());
      if (finalText.trim()) handleFinalUtterance(finalText.trim());
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      if (isRecording && !isPaused && !isProcessing && !isPlaying) {
        tryStartRecognition();
      }
    };

    recognition.onerror = () => {
      recognitionActiveRef.current = false;
      if (isRecording && !isPaused && !isProcessing && !isPlaying) {
        setTimeout(tryStartRecognition, 500);
      }
    };

    recognitionRef.current = recognition;
  }, [isRecording, isPaused, isProcessing, isPlaying, toast]);

  const tryStartRecognition = useCallback(() => {
    if (!recognitionRef.current || recognitionActiveRef.current) return;
    try {
      recognitionRef.current.start();
      recognitionActiveRef.current = true;
    } catch {
      recognitionActiveRef.current = true;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionActiveRef.current = false;
    }
  }, []);

  const startSession = useCallback(async () => {
    try {
      await initMic();
      initRecognition();
      setTranscript('');
      setIsRecording(true);
      setIsPaused(false);
      setIsProcessing(false);
      setIsPlaying(false);
      setRecordingTime(0);
      tryStartRecognition();
    } catch (error) {
      toast({
        title: 'Microphone access failed',
        description: 'Please check microphone permissions',
        status: 'error'
      });
    }
  }, [initMic, initRecognition, tryStartRecognition, toast]);

  const endSession = useCallback(() => {
    stopRecognition();
    cleanupMic();
    if (audioPlayerRef.current) {
      try { audioPlayerRef.current.pause(); } catch {}
      audioPlayerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setIsProcessing(false);
    setIsPlaying(false);
    setTranscript('');
    setRecordingTime(0);
    setDetectedLanguage('vi');
  }, [stopRecognition, cleanupMic]);

  const handleFinalUtterance = useCallback(async (finalText) => {
    if (!finalText) return;
    
    stopRecognition();
    setIsProcessing(true);

    try {
      const result = await voiceApi.voiceChat(finalText, language, currentConversation?._id);
      
      if (!result.success) throw new Error(result.error);

      if (result.language) setDetectedLanguage(result.language);
      if (onVoiceResult) onVoiceResult(finalText, result.response);

      if (result.audioBase64) {
        setIsPlaying(true);
        const audio = voiceApi.createAudioElement(result.audioBase64);
        if (audio) {
          audioPlayerRef.current = audio;
          audio.onended = audio.onerror = () => {
            setIsPlaying(false);
            setIsProcessing(false);
            if (isRecording && !isPaused) tryStartRecognition();
          };
          try {
            await audio.play();
          } catch {
            setIsPlaying(false);
            setIsProcessing(false);
            if (isRecording && !isPaused) tryStartRecognition();
          }
        }
      } else {
        setIsProcessing(false);
        if (isRecording && !isPaused) tryStartRecognition();
      }
    } catch (error) {
      setIsProcessing(false);
      toast({ title: 'Voice processing failed', description: error.message, status: 'error' });
      if (isRecording && !isPaused) tryStartRecognition();
    }
  }, [isRecording, isPaused, language, currentConversation, onVoiceResult, stopRecognition, tryStartRecognition, toast]);

  const togglePause = () => {
    if (!isRecording || isProcessing || isPlaying) return;
    
    if (isPaused) {
      setIsPaused(false);
      tryStartRecognition();
    } else {
      setIsPaused(true);
      stopRecognition();
    }
  };

  const handleClose = () => {
    endSession();
    onClose?.();
  };

  const handleLottieClick = () => {
    if (!isRecording) return startSession();
    if (!isProcessing && !isPlaying) togglePause();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered closeOnOverlayClick={false} size="md">
      <ModalOverlay bg={overlayBg} backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} borderRadius="2xl" boxShadow="2xl" mx={4}>
        <ModalBody p={8}>
          <VStack spacing={6} align="center">
            <Box
              onClick={handleLottieClick}
              transition="all 0.3s ease"
              _hover={{ transform: 'scale(1.05)' }}
              _active={{ transform: 'scale(0.95)' }}
              cursor="pointer"
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={voiceAssistantAnimation}
                loop
                autoplay={false}
                style={{ width: '300px', height: '300px' }}
              />
            </Box>

            <VStack spacing={2} align="center">
              <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                {getStatusText()}
              </Text>
              {detectedLanguage !== 'vi' && (
                <Text fontSize="xs" color="gray.500">
                  {detectedLanguage === 'en' ? 'English detected' : `Language: ${detectedLanguage}`}
                </Text>
              )}
              {isRecording && (
                <Text fontSize="sm" color="gray.500">
                  {formatTime(recordingTime)}
                </Text>
              )}
            </VStack>

            {transcript && (
              <Box
                bg={useColorModeValue('gray.50', 'gray.700')}
                p={4}
                borderRadius="lg"
                w="full"
                maxH="120px"
                overflowY="auto"
              >
                <Text fontSize="sm" color={textColor}>
                  {transcript}
                </Text>
              </Box>
            )}

            <HStack spacing={4}>
              {isRecording && (
                <IconButton
                  icon={isPaused ? <FaPlay /> : <FaPause />}
                  onClick={togglePause}
                  colorScheme="blue"
                  variant="outline"
                  size="lg"
                  aria-label={isPaused ? 'Resume' : 'Pause'}
                />
              )}
              <IconButton
                icon={<FaTimes />}
                onClick={handleClose}
                border="1px solid"
                borderColor="blue.600"
                color="black"
                size="lg"
                aria-label="Close"
              />
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default VoiceInterface;
