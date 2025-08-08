import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  Flex,
  Text,
  IconButton,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaMicrophone, FaStop, FaTimes, FaPause, FaPlay } from 'react-icons/fa';
import Lottie from 'lottie-react';
import voiceAssistantAnimation from '../../animations/VoiceAssistant.json';
import { voiceWave } from '../../styles/animations';

const VoiceInterface = ({ 
  isOpen, 
  onClose, 
  onVoiceResult, 
  language = 'vi' 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const animationRef = useRef(null);
  const lottieRef = useRef(null);

  // Colors
  const bgColor = useColorModeValue('gray.300', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const accentColor = useColorModeValue('#10a37f', '#10a37f');
  const overlayBg = useColorModeValue('blackAlpha.300', 'blackAlpha.600');

  // Translations
  const translations = {
    vi: {
     
      paused: 'Đã tạm dừng',
      tapToSpeak: 'Nhấn để nói',
      recording: 'Đang ghi âm',
      stop: 'Dừng',
      pause: 'Tạm dừng',
      resume: 'Tiếp tục',
      close: 'Đóng'
    },
    en: {
     
      paused: 'Paused',
      tapToSpeak: 'Tap to speak',
      recording: 'Recording',
      stop: 'Stop',
      pause: 'Pause',
      resume: 'Resume',
      close: 'Close'
    }
  };

  const t = translations[language] || translations.vi;

  // Control Lottie animation based on recording state
  useEffect(() => {
    if (lottieRef.current) {
      if (isRecording && !isPaused) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
  }, [isRecording, isPaused]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isOpen) return;

    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        if (isRecording && !isPaused) {
          recognition.start(); // Restart if still recording
        }
      };

      if (isRecording && !isPaused) {
        recognition.start();
      }

      return () => {
        recognition.stop();
      };
    }
  }, [isRecording, isPaused, language, isOpen]);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  // Audio level animation
  useEffect(() => {
    if (isRecording && !isPaused) {
      const animate = () => {
        setAudioLevel(Math.random() * 100);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      cancelAnimationFrame(animationRef.current);
      setAudioLevel(0);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isRecording, isPaused]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setTranscript('');
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // Handle stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);

    // Send transcript to parent
    if (transcript.trim()) {
      onVoiceResult(transcript.trim());
    }
    
    onClose();
  };

  // Handle pause/resume
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Handle close
  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    } else {
      onClose();
    }
  };

  // Voice waves component
  const VoiceWaves = () => (
    <HStack spacing={1} justify="center">
      {[...Array(5)].map((_, i) => (
        <Box
          key={i}
          w="4px"
          bg={accentColor}
          borderRadius="full"
          animation={isRecording && !isPaused ? `${voiceWave} 1s ease-in-out infinite` : 'none'}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isRecording && !isPaused ? `${20 + (audioLevel / 10)}px` : '20px',
            opacity: isRecording && !isPaused ? 0.8 : 0.3,
          }}
        />
      ))}
    </HStack>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      isCentered
      closeOnOverlayClick={false}
      size="md"
    >
      <ModalOverlay bg={overlayBg} backdropFilter="blur(4px)" />
      <ModalContent 
        bg={bgColor} 
        borderRadius="2xl" 
        boxShadow="2xl"
        mx={4}
        overflow="hidden"
      >
        <ModalBody p={0}>
          <VStack spacing={6} p={8} align="center">
            {/* Close button */}
           

            {/* Main voice interface */}
            <VStack spacing={4} align="center">
              {/* Voice Assistant Lottie Animation */}
              <Box 
                position="relative"
                //cursor="pointer"
                onClick={isRecording ? togglePause : startRecording}
                transition="all 0.3s ease"
                _hover={{
                  transform: 'scale(1.05)',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
              >
                <Lottie
                  lottieRef={lottieRef}
                  animationData={voiceAssistantAnimation}
                  loop={true}
                  autoplay={false}
                  style={{
                    width: '300px',
                    height: '300px',
                  }}
                />
                
                {/* Overlay icon for better UX */}
                <Box
                 
                >
                  
                </Box>
              </Box>

              {/* Status text */}
              <VStack spacing={2} align="center">
                <Text 
                  fontSize="lg" 
                  fontWeight="semibold" 
                  color={textColor}
                >
                  {isRecording 
                    ? (isPaused ? t.paused : t.listening)
                    : t.tapToSpeak
                  }
                </Text>
                
                {isRecording && (
                  <Text fontSize="sm" color="gray.500">
                    {formatTime(recordingTime)}
                  </Text>
                )}
              </VStack>

             

              {/* Transcript */}
              {transcript && (
                <Box
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  p={4}
                  borderRadius="lg"
                  w="full"
                  maxH="100px"
                  overflowY="auto"
                >
                  <Text fontSize="sm" color={textColor}>
                    {transcript}
                  </Text>
                </Box>
              )}

              {/* Control buttons */}
              {isRecording && (
                <HStack spacing={4}>
                  <IconButton
                    icon={isPaused ? <FaPlay /> : <FaPause />}
                    onClick={togglePause}
                    colorScheme="blue"
                
                    variant="outline"
                    size="lg"
                    aria-label={isPaused ? t.resume : t.pause}
                    mr="250px"
                  />
                  <IconButton
                    icon={<FaTimes />}
                    onClick={stopRecording}
                    border="1px solid"
                    borderColor="blue.600"
                    color="black"
                    size="lg"
                    aria-label={t.stop}
                  />
                </HStack>
              )}
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default VoiceInterface;