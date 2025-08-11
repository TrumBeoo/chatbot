import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody,
  Box, VStack, HStack, Text, IconButton,
  useColorModeValue, useToast, Badge
} from '@chakra-ui/react';
import { FaPause, FaPlay, FaTimes, FaLanguage, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
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
  const [responseLanguage, setResponseLanguage] = useState('vi');
  const [sessionActive, setSessionActive] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);
  const lottieRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const shouldContinueListeningRef = useRef(false);
  const restartTimeoutRef = useRef(null);

  const toast = useToast();
  const bgColor = useColorModeValue('gray.300', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const overlayBg = useColorModeValue('blackAlpha.300', 'blackAlpha.600');

  const getStatusText = () => {
    const lang = responseLanguage || detectedLanguage;
    if (isPlaying) return lang === 'en' ? 'Playing response...' : 'Đang phát phản hồi...';
    if (isProcessing) return lang === 'en' ? 'Processing your request...' : 'Đang xử lý yêu cầu...';
    if (isRecording) {
      if (isPaused) return lang === 'en' ? 'Recording paused' : 'Đã tạm dừng ghi âm';
      return lang === 'en' ? 'Listening... Speak now' : 'Đang lắng nghe... Hãy nói';
    }
    if (sessionActive) {
      return lang === 'en' ? 'Tap microphone to speak' : 'Nhấn micro để nói';
    }
    return lang === 'en' ? 'Tap the assistant to start' : 'Nhấn vào trợ lý để bắt đầu';
  };

  const getLanguageDisplayName = (langCode) => {
    return langCode === 'en' ? 'English' : 'Tiếng Việt';
  };

  // Animation control
  useEffect(() => {
    if (lottieRef.current) {
      if ((isRecording && !isPaused) || isProcessing || isPlaying) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
  }, [isRecording, isPaused, isPlaying, isProcessing]);

  // Timer control
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      endSession();
    }
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initMic = useCallback(async () => {
    if (mediaStreamRef.current) return;
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
    } catch (error) {
      throw new Error('Microphone access denied');
    }
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
      toast({ 
        title: 'Speech recognition not supported', 
        description: 'Please use a compatible browser like Chrome',
        status: 'error' 
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      recognitionActiveRef.current = true;
    };

    recognition.onresult = (event) => {
      let finalText = '', interimText = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += text + ' ';
        } else {
          interimText += text;
        }
      }
      
      const fullText = `${finalText}${interimText}`.trim();
      setTranscript(fullText);
      
      // Process final results
      if (finalText.trim()) {
        handleFinalUtterance(finalText.trim());
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      recognitionActiveRef.current = false;
      
      // Auto-restart if session is still active and should continue listening
      if (shouldContinueListeningRef.current && sessionActive && !isProcessing && !isPlaying) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldContinueListeningRef.current && sessionActive) {
            startListening();
          }
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      recognitionActiveRef.current = false;
      
      // Restart on recoverable errors
      if (event.error !== 'aborted' && event.error !== 'not-allowed') {
        if (shouldContinueListeningRef.current && sessionActive && !isProcessing && !isPlaying) {
          restartTimeoutRef.current = setTimeout(() => {
            if (shouldContinueListeningRef.current && sessionActive) {
              startListening();
            }
          }, 1000);
        }
      }
    };

    recognitionRef.current = recognition;
  }, [sessionActive, isProcessing, isPlaying, toast]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || recognitionActiveRef.current || !sessionActive) return;
    
    try {
      setTranscript('');
      setIsRecording(true);
      setRecordingTime(0);
      shouldContinueListeningRef.current = true;
      recognitionRef.current.start();
    } catch (error) {
      console.warn('Error starting recognition:', error);
      if (error.name === 'InvalidStateError') {
        // Already running, just update state
        setIsRecording(true);
        recognitionActiveRef.current = true;
      }
    }
  }, [sessionActive]);

  const stopListening = useCallback(() => {
    shouldContinueListeningRef.current = false;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current && recognitionActiveRef.current) {
      try { 
        recognitionRef.current.stop(); 
      } catch (error) {
        console.warn('Error stopping recognition:', error);
      }
    }
    
    setIsRecording(false);
    setTranscript('');
    recognitionActiveRef.current = false;
  }, []);

  const startSession = useCallback(async () => {
    try {
      await initMic();
      initRecognition();
      
      setSessionActive(true);
      setIsProcessing(false);
      setIsPlaying(false);
      setDetectedLanguage('vi');
      setResponseLanguage('vi');
      shouldContinueListeningRef.current = true;
      
      // Start listening immediately
      setTimeout(() => startListening(), 100);
      
    } catch (error) {
      toast({
        title: 'Microphone Error',
        description: error.message || 'Could not access microphone. Please check permissions.',
        status: 'error',
        duration: 5000
      });
    }
  }, [initMic, initRecognition, startListening, toast]);

  const endSession = useCallback(() => {
    console.log('Ending session');
    shouldContinueListeningRef.current = false;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    stopListening();
    cleanupMic();
    
    if (audioPlayerRef.current) {
      try { 
        audioPlayerRef.current.pause(); 
        audioPlayerRef.current = null;
      } catch (error) {
        console.warn('Error stopping audio:', error);
      }
    }
    
    clearInterval(timerRef.current);
    
    setSessionActive(false);
    setIsRecording(false);
    setIsProcessing(false);
    setIsPlaying(false);
    setTranscript('');
    setRecordingTime(0);
    setDetectedLanguage('vi');
    setResponseLanguage('vi');
    
    // Cleanup recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        console.warn('Error aborting recognition:', error);
      }
      recognitionRef.current = null;
    }
    recognitionActiveRef.current = false;
  }, [stopListening, cleanupMic]);

  const handleFinalUtterance = useCallback(async (finalText) => {
    if (!finalText || finalText.length < 2) return;
    
    console.log('Processing utterance:', finalText);
    
    // Stop current listening while processing
    stopListening();
    setIsProcessing(true);

    try {
      const result = await voiceApi.voiceChat(finalText, null, currentConversation?._id);
      
      if (!result.success) {
        throw new Error(result.error || 'Voice processing failed');
      }

      // Update detected language from backend response
      if (result.language) {
        setDetectedLanguage(result.language);
        setResponseLanguage(result.language);
      }

      // Pass result to parent component
      if (onVoiceResult) {
        onVoiceResult(finalText, result.response);
      }

      setIsProcessing(false);

      // Play audio response if available
      if (result.audioBase64) {
        setIsPlaying(true);
        const audio = voiceApi.createAudioElement(result.audioBase64);
        
        if (audio) {
          audioPlayerRef.current = audio;
          
          const onAudioEnd = () => {
            console.log('Audio playback ended');
            setIsPlaying(false);
            audioPlayerRef.current = null;
            
            // Resume listening after audio ends if session is still active
            if (sessionActive && shouldContinueListeningRef.current) {
              setTimeout(() => {
                startListening();
              }, 500);
            }
          };

          audio.onended = onAudioEnd;
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            onAudioEnd();
          };

          try {
            await audio.play();
          } catch (playError) {
            console.error('Audio play failed:', playError);
            onAudioEnd();
          }
        } else {
          // No audio to play, resume listening immediately
          if (sessionActive && shouldContinueListeningRef.current) {
            setTimeout(() => startListening(), 500);
          }
        }
      } else {
        // No audio response, resume listening immediately
        if (sessionActive && shouldContinueListeningRef.current) {
          setTimeout(() => startListening(), 500);
        }
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      setIsProcessing(false);
      
      toast({ 
        title: 'Processing Error', 
        description: error.message || 'Failed to process voice input',
        status: 'error',
        duration: 4000
      });
      
      // Resume listening after error if session is still active
      if (sessionActive && shouldContinueListeningRef.current) {
        setTimeout(() => startListening(), 1000);
      }
    }
  }, [sessionActive, currentConversation, onVoiceResult, stopListening, startListening, toast]);

  const togglePause = useCallback(() => {
    if (!sessionActive) return;
    
    if (isPaused) {
      // Resume
      setIsPaused(false);
      if (!isProcessing && !isPlaying) {
        startListening();
      }
    } else {
      // Pause
      setIsPaused(true);
      stopListening();
    }
  }, [sessionActive, isPaused, isProcessing, isPlaying, startListening, stopListening]);

  const handleClose = () => {
    endSession();
    onClose?.();
  };

  const handleLottieClick = () => {
    if (!sessionActive) {
      startSession();
    } else if (!isRecording && !isProcessing && !isPlaying) {
      startListening();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered closeOnOverlayClick={false} size="lg">
      <ModalOverlay bg={overlayBg} backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} borderRadius="2xl" boxShadow="2xl" mx={4} maxW="500px">
        <ModalBody p={8}>
          <VStack spacing={6} align="center">
            {/* Session Status */}
            {sessionActive && (
              <Badge 
                colorScheme={sessionActive ? 'green' : 'gray'} 
                variant="subtle"
                px={3} py={1}
                borderRadius="full"
                fontSize="sm"
              >
                <HStack spacing={1}>
                  <Box w={2} h={2} bg="green.500" borderRadius="full" />
                  <Text>Session Active</Text>
                </HStack>
              </Badge>
            )}

            {/* Language indicator */}
            <HStack spacing={2}>
              <Badge 
                colorScheme={detectedLanguage === 'en' ? 'blue' : 'green'} 
                variant="subtle"
                px={3} py={1}
                borderRadius="full"
                fontSize="sm"
              >
                <HStack spacing={1}>
                  <FaLanguage size={12} />
                  <Text>{getLanguageDisplayName(detectedLanguage)}</Text>
                </HStack>
              </Badge>
              {responseLanguage !== detectedLanguage && (
                <Badge 
                  colorScheme="purple" 
                  variant="outline"
                  px={2} py={1}
                  borderRadius="full"
                  fontSize="xs"
                >
                  Response: {getLanguageDisplayName(responseLanguage)}
                </Badge>
              )}
            </HStack>

            {/* Voice Assistant Animation */}
            <Box
              onClick={handleLottieClick}
              transition="all 0.3s ease"
              _hover={{ transform: 'scale(1.05)' }}
              _active={{ transform: 'scale(0.95)' }}
              cursor="pointer"
              borderRadius="full"
              border={sessionActive ? "3px solid" : "2px solid transparent"}
              borderColor={
                isRecording ? "green.400" : 
                isProcessing ? "yellow.400" : 
                isPlaying ? "blue.400" : 
                sessionActive ? "gray.400" : "transparent"
              }
              p={2}
              position="relative"
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={voiceAssistantAnimation}
                loop
                autoplay={false}
                style={{ width: '280px', height: '280px' }}
              />
              
              {/* Status indicator overlay */}
              {sessionActive && (
                <Box
                  position="absolute"
                  top={2}
                  right={2}
                  bg={
                    isRecording ? "green.500" :
                    isProcessing ? "yellow.500" :
                    isPlaying ? "blue.500" :
                    "gray.500"
                  }
                  color="white"
                  borderRadius="full"
                  p={2}
                  boxShadow="md"
                >
                  {isRecording ? <FaMicrophone size={16} /> : <FaMicrophoneSlash size={16} />}
                </Box>
              )}
            </Box>

            {/* Status and Timer */}
            <VStack spacing={2} align="center">
              <Text fontSize="lg" fontWeight="semibold" color={textColor} textAlign="center">
                {getStatusText()}
              </Text>
              {isRecording && (
                <HStack spacing={3}>
                  <Text fontSize="md" color="red.500" fontWeight="bold">
                    ⏺ {formatTime(recordingTime)}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    🎤 Recording
                  </Text>
                </HStack>
              )}
            </VStack>

            {/* Transcript Display */}
            {transcript && (
              <Box
                bg={useColorModeValue('gray.50', 'gray.700')}
                p={4}
                borderRadius="lg"
                w="full"
                maxH="120px"
                overflowY="auto"
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
              >
                <Text fontSize="sm" color={textColor} fontStyle={transcript.includes('...') ? 'italic' : 'normal'}>
                  {transcript || 'Waiting for speech...'}
                </Text>
              </Box>
            )}

            {/* Control Buttons */}
            <HStack spacing={4}>
              {sessionActive && (
                <IconButton
                  icon={isPaused ? <FaPlay /> : <FaPause />}
                  onClick={togglePause}
                  colorScheme={isPaused ? "green" : "yellow"}
                  variant="outline"
                  size="lg"
                  isRound
                  aria-label={isPaused ? "Resume" : "Pause"}
                  _hover={{ transform: 'scale(1.1)' }}
                  isDisabled={isProcessing || isPlaying}
                />
              )}
              
              <IconButton
                icon={<FaTimes />}
                onClick={handleClose}
                colorScheme="red"
                variant="outline"
                size="lg"
                isRound
                aria-label="Close Voice Interface"
                _hover={{ transform: 'scale(1.1)' }}
              />
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default VoiceInterface;