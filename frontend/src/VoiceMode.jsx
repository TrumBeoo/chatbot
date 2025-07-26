import { VStack, Text, Button, Spinner } from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useState } from 'react';

export default function VoiceMode({ onExit }) {
  const [isListening, setIsListening] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState('');

  const handleStart = async () => {
    setIsListening(true);
    setError('');
    setResponseText('');

    try {
      const res = await fetch('http://localhost:5001/api/live-speech');
      const data = await res.json();

      if (data.response) {
        setResponseText(data.response);
      } else {
        setError('Không có phản hồi.');
      }
    } catch (err) {
      setError('Lỗi khi gọi API.');
    }

    setIsListening(false);
  };

  return (
    <VStack spacing={4} mt={10}>
      <Button
        leftIcon={<FaArrowLeft />}
        colorScheme="gray"
        variant="outline"
        onClick={onExit}
      >
        Quay lại chat
      </Button>

      <Text fontSize="xl" fontWeight="bold">🎙 Chế độ thoại trực tiếp</Text>

      <Button
        colorScheme="teal"
        onClick={handleStart}
        isLoading={isListening}
        loadingText="Đang lắng nghe..."
      >
        Bắt đầu nói
      </Button>

      {responseText && <Text fontSize="md">🤖 Phản hồi: {responseText}</Text>}
      {error && <Text color="red.500">{error}</Text>}
    </VStack>
  );
}
