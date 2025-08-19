import React from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Icon,
  useDisclosure,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { 
  FaNetworkWired, 
  FaChevronDown, 
  FaCheck,
  FaGlobe,
  FaServer,
  FaShieldAlt
} from 'react-icons/fa';
import { SUPPORTED_NETWORKS } from '../constants/networks.js';

interface NetworkSelectorProps {
  selectedNetwork: any;
  onNetworkChange: (network: any) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'mobile';
}

const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const getNetworkIcon = (networkId: string) => {
  switch (networkId) {
    case 'arbitrum-sepolia':
      return FaNetworkWired; // Use proper icon component
    default:
      return FaNetworkWired;
  }
};

const getNetworkColor = (networkId: string) => {
  switch (networkId) {
    case 'arbitrum-sepolia':
      return '#28A0F0'; // Arbitrum blue
    default:
      return '#7f5af0';
  }
};

const getNetworkStatus = (networkId: string) => {
  switch (networkId) {
    case 'arbitrum-sepolia':
      return { status: 'active', label: 'Testnet', color: 'green' };
    default:
      return { status: 'active', label: 'Active', color: 'green' };
  }
};

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkChange,
  size = 'md',
  variant = 'default'
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('rgba(35, 37, 38, 0.9)', 'rgba(35, 37, 38, 0.9)');
  const borderColor = useColorModeValue('#4a5568', '#4a5568');
  const hoverBg = useColorModeValue('rgba(127, 90, 240, 0.1)', 'rgba(127, 90, 240, 0.1)');

  const handleNetworkSelect = (network: any) => {
    onNetworkChange(network);
    onClose();
  };

  const NetworkIcon = getNetworkIcon(selectedNetwork.id);
  const networkColor = getNetworkColor(selectedNetwork.id);
  const networkStatus = getNetworkStatus(selectedNetwork.id);

  if (variant === 'compact') {
    return (
      <Popover isOpen={isOpen} onClose={onClose} placement="bottom-start">
        <PopoverTrigger>
          <Button
            size={size}
            variant="ghost"
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            px={3}
            py={2}
            _hover={{ bg: hoverBg, borderColor: networkColor }}
            _active={{ bg: hoverBg }}
            onClick={onOpen}
            minW="auto"
          >
            <HStack spacing={2}>
              <Icon as={NetworkIcon} color={networkColor} boxSize={4} />
              <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                {selectedNetwork.name}
              </Text>
              <Icon as={FaChevronDown} color="#a0a0a0" boxSize={3} />
            </HStack>
          </Button>
        </PopoverTrigger>
        
        <Portal>
          <PopoverContent
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            boxShadow="xl"
            maxW="280px"
            _focus={{ outline: 'none' }}
          >
            <PopoverBody p={0}>
              <VStack spacing={0} align="stretch">
                {SUPPORTED_NETWORKS.map((network, index) => {
                  const NetworkOptionIcon = getNetworkIcon(network.id);
                  const optionColor = getNetworkColor(network.id);
                  const isSelected = network.id === selectedNetwork.id;
                  
                  return (
                    <Box key={network.id}>
                      <Button
                        variant="ghost"
                        w="full"
                        h="auto"
                        p={4}
                        borderRadius={0}
                        bg={isSelected ? 'rgba(127, 90, 240, 0.2)' : 'transparent'}
                        _hover={{ bg: hoverBg }}
                        onClick={() => handleNetworkSelect(network)}
                        justifyContent="flex-start"
                      >
                        <HStack spacing={3} w="full">
                          <Box
                            p={2}
                            borderRadius="lg"
                            bg={isSelected ? optionColor : 'rgba(74, 85, 104, 0.3)'}
                            color="white"
                          >
                            <Icon as={NetworkOptionIcon} boxSize={4} />
                          </Box>
                          
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack spacing={2}>
                              <Text fontSize="sm" fontWeight="semibold" color="#ffffff">
                                {network.name}
                              </Text>
                              <Badge
                                size="sm"
                                colorScheme={networkStatus.color}
                                variant="subtle"
                                borderRadius="full"
                                px={2}
                              >
                                {networkStatus.label}
                              </Badge>
                            </HStack>
                            <Text fontSize="xs" color="#a0a0a0">
                              {network.rpc[0].includes('arbitrum') ? 'Arbitrum Testnet' : 'Unknown Network'}
                            </Text>
                          </VStack>
                          
                          {isSelected && (
                            <Icon as={FaCheck} color="green.400" boxSize={4} />
                          )}
                        </HStack>
                      </Button>
                      {index < SUPPORTED_NETWORKS.length - 1 && (
                        <Divider borderColor={borderColor} />
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    );
  }

  if (variant === 'mobile') {
    return (
      <Box>
        <Text fontSize="sm" mb={3} color="gray.500" fontWeight="medium">
          Select Network
        </Text>
        <VStack spacing={2} align="stretch">
          {SUPPORTED_NETWORKS.map((network) => {
            const NetworkOptionIcon = getNetworkIcon(network.id);
            const optionColor = getNetworkColor(network.id);
            const isSelected = network.id === selectedNetwork.id;
            
            return (
              <Button
                key={network.id}
                variant="ghost"
                w="full"
                h="auto"
                p={4}
                borderRadius="lg"
                bg={isSelected ? 'rgba(127, 90, 240, 0.2)' : bgColor}
                border="1px solid"
                borderColor={isSelected ? optionColor : borderColor}
                _hover={{ bg: hoverBg }}
                onClick={() => handleNetworkSelect(network)}
                justifyContent="flex-start"
              >
                <HStack spacing={3} w="full">
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg={isSelected ? optionColor : 'rgba(74, 85, 104, 0.3)'}
                    color="white"
                  >
                    <Icon as={NetworkOptionIcon} boxSize={4} />
                  </Box>
                  
                  <VStack align="start" spacing={1} flex={1}>
                    <HStack spacing={2}>
                      <Text fontSize="sm" fontWeight="semibold" color="#ffffff">
                        {network.name}
                      </Text>
                      <Badge
                        size="sm"
                        colorScheme={networkStatus.color}
                        variant="subtle"
                        borderRadius="full"
                        px={2}
                      >
                        {networkStatus.label}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="#a0a0a0">
                      {network.rpc[0].includes('arbitrum') ? 'Arbitrum Testnet' : 'Unknown Network'}
                    </Text>
                  </VStack>
                  
                  {isSelected && (
                    <Icon as={FaCheck} color="green.400" boxSize={4} />
                  )}
                </HStack>
              </Button>
            );
          })}
        </VStack>
      </Box>
    );
  }

  // Default variant
  return (
    <Popover isOpen={isOpen} onClose={onClose} placement="bottom-start">
      <PopoverTrigger>
        <Button
          size={size}
          variant="ghost"
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
          px={4}
          py={3}
          _hover={{ bg: hoverBg, borderColor: networkColor, transform: 'translateY(-1px)' }}
          _active={{ bg: hoverBg }}
          onClick={onOpen}
          transition="all 0.2s"
          boxShadow="sm"
          minW="200px"
        >
          <HStack spacing={3} w="full" justify="space-between">
            <HStack spacing={3}>
              <Box
                p={2}
                borderRadius="lg"
                bg={networkColor}
                color="white"
                animation={isOpen ? `${pulseAnimation} 2s infinite` : 'none'}
              >
                <Icon as={NetworkIcon} boxSize={4} />
              </Box>
              
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="semibold" color="#ffffff">
                  {selectedNetwork.name}
                </Text>
                <HStack spacing={2}>
                  <Badge
                    size="sm"
                    colorScheme={networkStatus.color}
                    variant="subtle"
                    borderRadius="full"
                    px={2}
                  >
                    {networkStatus.label}
                  </Badge>
                  <Icon as={FaServer} color="#a0a0a0" boxSize={3} />
                </HStack>
              </VStack>
            </HStack>
            
            <Icon 
              as={FaChevronDown} 
              color="#a0a0a0" 
              boxSize={3} 
              transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
              transition="transform 0.2s"
            />
          </HStack>
        </Button>
      </PopoverTrigger>
      
      <Portal>
        <PopoverContent
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
          boxShadow="xl"
          maxW="320px"
          _focus={{ outline: 'none' }}
        >
          <PopoverBody p={0}>
            <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
              <HStack spacing={3}>
                <Icon as={FaGlobe} color="#7f5af0" boxSize={4} />
                <Text fontSize="sm" fontWeight="semibold" color="#ffffff">
                  Available Networks
                </Text>
              </HStack>
            </Box>
            
            <VStack spacing={0} align="stretch">
              {SUPPORTED_NETWORKS.map((network, index) => {
                const NetworkOptionIcon = getNetworkIcon(network.id);
                const optionColor = getNetworkColor(network.id);
                const isSelected = network.id === selectedNetwork.id;
                
                return (
                  <Box key={network.id}>
                    <Button
                      variant="ghost"
                      w="full"
                      h="auto"
                      p={4}
                      borderRadius={0}
                      bg={isSelected ? 'rgba(127, 90, 240, 0.2)' : 'transparent'}
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleNetworkSelect(network)}
                      justifyContent="flex-start"
                      position="relative"
                    >
                      {isSelected && (
                        <Box
                          position="absolute"
                          left={0}
                          top={0}
                          bottom={0}
                          w="3px"
                          bg={optionColor}
                          borderRadius="0 2px 2px 0"
                        />
                      )}
                      
                      <HStack spacing={3} w="full">
                        <Box
                          p={2}
                          borderRadius="lg"
                          bg={isSelected ? optionColor : 'rgba(74, 85, 104, 0.3)'}
                          color="white"
                          transition="all 0.2s"
                        >
                          <Icon as={NetworkOptionIcon} boxSize={4} />
                        </Box>
                        
                        <VStack align="start" spacing={1} flex={1}>
                          <HStack spacing={2}>
                            <Text fontSize="sm" fontWeight="semibold" color="#ffffff">
                              {network.name}
                            </Text>
                            <Badge
                              size="sm"
                              colorScheme={networkStatus.color}
                              variant="subtle"
                              borderRadius="full"
                              px={2}
                            >
                              {networkStatus.label}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="#a0a0a0">
                            {network.rpc[0].includes('arbitrum') ? 'Arbitrum Testnet' : 'Unknown Network'}
                          </Text>
                        </VStack>
                        
                        {isSelected && (
                          <Icon as={FaCheck} color="green.400" boxSize={4} />
                        )}
                      </HStack>
                    </Button>
                    {index < SUPPORTED_NETWORKS.length - 1 && (
                      <Divider borderColor={borderColor} />
                    )}
                  </Box>
                );
              })}
            </VStack>
            
            <Box p={3} bg="rgba(74, 85, 104, 0.1)" borderTop="1px solid" borderColor={borderColor}>
              <HStack spacing={2}>
                <Icon as={FaShieldAlt} color="#a0a0a0" boxSize={3} />
                <Text fontSize="xs" color="#a0a0a0">
                  All networks are testnets for development
                </Text>
              </HStack>
            </Box>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}; 