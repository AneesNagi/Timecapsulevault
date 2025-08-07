import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  FaRobot,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSync,
  FaShieldAlt,
  FaLock,
  FaUnlock,
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

interface AutoWithdrawalStatusProps {
  totalVaults: number;
  lockedVaults: number;
  unlockedVaults: number;
  autoWithdrawnVaults: number;
  isSystemActive: boolean;
  lastCheckTime?: Date;
  nextCheckTime?: Date;
}

export const AutoWithdrawalStatus: React.FC<AutoWithdrawalStatusProps> = ({
  totalVaults,
  lockedVaults,
  unlockedVaults,
  autoWithdrawnVaults,
  isSystemActive,
  lastCheckTime,
  nextCheckTime,
}) => {
  const cardBg = useColorModeValue('var(--bg-secondary)', 'var(--bg-secondary)');
  const textColor = useColorModeValue('var(--text-primary)', 'var(--text-primary)');
  const mutedTextColor = useColorModeValue('var(--text-secondary)', 'var(--text-secondary)');
  const borderColor = useColorModeValue('var(--border-color)', 'var(--border-color)');

  const getSystemStatus = () => {
    if (!isSystemActive) return { status: 'inactive', color: 'red', icon: FaExclamationTriangle, text: 'System Inactive' };
    if (unlockedVaults > 0) return { status: 'processing', color: 'orange', icon: FaSync, text: 'Processing Withdrawals' };
    return { status: 'active', color: 'green', icon: FaCheckCircle, text: 'System Active' };
  };

  const systemStatus = getSystemStatus();

  const formatTime = (date?: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString();
  };

  const getProgressPercentage = () => {
    if (totalVaults === 0) return 0;
    return ((autoWithdrawnVaults + unlockedVaults) / totalVaults) * 100;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* System Status Header */}
      <MotionCard
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <CardBody p={6}>
          <VStack spacing={4}>
            <HStack spacing={3}>
              <Icon as={FaRobot} color="var(--accent-color)" boxSize={6} />
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                🤖 Automated Withdrawal System
              </Text>
            </HStack>
            
            <HStack spacing={4}>
              <Badge colorScheme={systemStatus.color} variant="solid" px={3} py={1} borderRadius="full">
                <HStack spacing={2}>
                  <Icon as={systemStatus.icon} boxSize={3} />
                  <Text fontSize="sm" fontWeight="bold">{systemStatus.text}</Text>
                </HStack>
              </Badge>
              
              <Badge colorScheme="blue" variant="outline" px={3} py={1} borderRadius="full">
                <Text fontSize="sm">Zero Human Interaction</Text>
              </Badge>
            </HStack>
          </VStack>
        </CardBody>
      </MotionCard>

      {/* System Statistics */}
      <MotionCard
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <CardBody p={6}>
          <VStack spacing={4}>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              System Overview
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} width="full">
              <Stat>
                <StatLabel color={mutedTextColor}>Total Vaults</StatLabel>
                <StatNumber color={textColor}>{totalVaults}</StatNumber>
                <StatHelpText color={mutedTextColor}>Active vaults</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color={mutedTextColor}>Locked</StatLabel>
                <StatNumber color="orange.400">{lockedVaults}</StatNumber>
                <StatHelpText color={mutedTextColor}>
                  <Icon as={FaLock} boxSize={3} mr={1} />
                  Waiting for conditions
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color={mutedTextColor}>Unlocked</StatLabel>
                <StatNumber color="blue.400">{unlockedVaults}</StatNumber>
                <StatHelpText color={mutedTextColor}>
                  <Icon as={FaUnlock} boxSize={3} mr={1} />
                  Ready for withdrawal
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color={mutedTextColor}>Auto-Withdrawn</StatLabel>
                <StatNumber color="green.400">{autoWithdrawnVaults}</StatNumber>
                <StatHelpText color={mutedTextColor}>
                  <Icon as={FaCheckCircle} boxSize={3} mr={1} />
                  Completed
                </StatHelpText>
              </Stat>
            </SimpleGrid>
            
            {/* Progress Bar */}
            <Box width="full">
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" color={mutedTextColor}>System Progress</Text>
                <Text fontSize="sm" color={mutedTextColor}>{getProgressPercentage().toFixed(1)}%</Text>
              </HStack>
              <Progress 
                value={getProgressPercentage()} 
                colorScheme="green" 
                borderRadius="full"
                height="8px"
              />
            </Box>
          </VStack>
        </CardBody>
      </MotionCard>

      {/* System Information */}
      <MotionCard
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <CardBody p={6}>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              System Information
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontSize="sm" color={mutedTextColor} mb={1}>Last Check</Text>
                <HStack>
                  <Icon as={FaClock} color="var(--accent-color)" boxSize={4} />
                  <Text color={textColor}>{formatTime(lastCheckTime)}</Text>
                </HStack>
              </Box>
              
              <Box>
                <Text fontSize="sm" color={mutedTextColor} mb={1}>Next Check</Text>
                <HStack>
                  <Icon as={FaSync} color="var(--accent-color)" boxSize={4} />
                  <Text color={textColor}>{formatTime(nextCheckTime)}</Text>
                </HStack>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </MotionCard>

      {/* System Features */}
      <MotionCard
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <CardBody p={6}>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              🤖 Automation Features
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <HStack spacing={3}>
                <Icon as={FaShieldAlt} color="green.400" boxSize={5} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor}>Smart Contract Integration</Text>
                  <Text fontSize="xs" color={mutedTextColor}>Uses built-in auto-withdrawal functions</Text>
                </VStack>
              </HStack>
              
              <HStack spacing={3}>
                <Icon as={FaSync} color="blue.400" boxSize={5} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor}>Real-time Monitoring</Text>
                  <Text fontSize="xs" color={mutedTextColor}>Checks every 30 seconds</Text>
                </VStack>
              </HStack>
              
              <HStack spacing={3}>
                <Icon as={FaCheckCircle} color="green.400" boxSize={5} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor}>Automatic Retry</Text>
                  <Text fontSize="xs" color={mutedTextColor}>Handles network issues gracefully</Text>
                </VStack>
              </HStack>
              
              <HStack spacing={3}>
                <Icon as={FaRobot} color="purple.400" boxSize={5} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor}>Zero Manual Action</Text>
                  <Text fontSize="xs" color={mutedTextColor}>Fully automated process</Text>
                </VStack>
              </HStack>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </MotionCard>

      {/* Important Notice */}
      <Alert status="info" borderRadius="lg" bg="blue.500" color="white">
        <AlertIcon />
        <Box>
          <AlertTitle>🚫 No Manual Withdrawal Needed</AlertTitle>
          <AlertDescription>
            This system is designed to be completely automated. Once your vault unlock conditions are met, 
            funds will be automatically withdrawn to your wallet. No manual intervention is required or possible.
          </AlertDescription>
        </Box>
      </Alert>
    </VStack>
  );
}; 