import {
  Box,
  Button,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Flex,
  useColorModeValue,
  Image,

} from '@chakra-ui/react';
import { FaLanguage, FaMapMarkerAlt } from 'react-icons/fa';
import { translations } from '../../constants';


const ChatbotHeader = ({ language, onLanguageChange, config }) => {
  const bgGradient = useColorModeValue(
    config.customStyles.headerBg,
    'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)'
  );

  return (
    <Box
      bgGradient={bgGradient}
      color="white"
      p={{ base: 3, md: 5 }}
      borderRadius="xl"
      mb={1}
      boxShadow="xl"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        bgImage=""
        bgSize="20px 20px"
      />
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        position="relative"
        zIndex={1}
        gap={{ base: 3, md: 5 }}
      >
        <Flex align="center" gap={{ base: 3, md: 20 }}> {/*vị trí text*/}
          {config.features.showLogo && (
            <Box
              fontSize={config.customStyles.logoSize}
              className={config.features.animated ? 'bounce-animation' : ''}
            >
              {typeof config.logo === 'string' && config.logo.startsWith('http') ? (
                <Image
                  src={config.logo}
                  alt="Chatbot Logo"
                  boxSize={config.customStyles.logoSize}
                  borderRadius="full"
                />
              ) : (
                <Text fontSize={config.customStyles.logoSize}>{config.logo}</Text>
              )}
            </Box>
          )}
          {/*status */}
          <VStack align="flex-start" spacing={1}>
            <HStack align="center" spacing={{ base: 2, md: 5 }}>
              <Heading
                color="white"
                as="h1"
                size={{ base: 'lg', md: 'xl' }}
                fontWeight="bold"
                letterSpacing="wide"
              >
                {config.name}
              </Heading>
              {config.features.showStatus && (
                <Badge
                  colorScheme="green"
                  variant="solid"
                  fontSize={{ base: '2xs', md: 'xs' }}
                  px={{ base: 1.5, md: 2 }}
                  py={1}
                  borderRadius="full"
                  animation={config.features.animated ? 'pulse 2s infinite' : 'none'}
                >
                  <HStack spacing={1} align="center">
                    <Box w={2} h={2} bg="green.200" borderRadius="full" />
                    <Text>{translations[language].status}</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>
            {config.features.showSubtitle && (
              <Text
                color="white"
                fontSize={{ base: 'xs', md: 'sm' }}
                opacity={0.9}
                fontWeight="medium"
              >
                {translations[language].subtitle}
              </Text>
            )}
            {config.features.showLocation && (
              <HStack spacing={1} fontSize={{ base: '2xs', md: 'xs' }}>
                <FaMapMarkerAlt />
                <Text>{translations[language].location}</Text>
              </HStack>
            )}
          </VStack>
        </Flex>
        <VStack spacing={2} align={{ base: 'flex-start', md: 'flex-end' }}>
          <Button
            leftIcon={<FaLanguage />}
            onClick={onLanguageChange}
            colorScheme={config.theme.secondary}
            variant="outline"
            size={{ base: 'xs', md: 'sm' }}
            color="white"
            borderColor="whiteAlpha.400"
            _hover={{
              borderColor: 'whiteAlpha.600',
              bg: 'whiteAlpha.200',
            }}
          >
            {translations[language].languageSwitch}
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
};




export default ChatbotHeader;