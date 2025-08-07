import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Progress,
  Badge,
  Icon,
  Button,
  useColorModeValue,
  SimpleGrid,
  Flex,
} from '@chakra-ui/react';
import {
  FaLock,
  FaUnlock,
  FaClock,
  FaCoins,
  FaChartLine,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

interface VaultTimelineProps {
  vaults: any[];
  onVaultClick?: (vault: any) => void;
}

interface TimelineEvent {
  id: string;
  type: 'created' | 'deposited' | 'unlocked' | 'withdrawn';
  timestamp: string;
  amount?: string;
  description: string;
  status: 'completed' | 'pending' | 'upcoming';
}

export const VaultTimeline: React.FC<VaultTimelineProps> = ({ vaults, onVaultClick }) => {
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const bgColor = useColorModeValue('var(--bg-primary)', 'var(--bg-primary)');
  const cardBg = useColorModeValue('var(--bg-secondary)', 'var(--bg-secondary)');
  const borderColor = useColorModeValue('var(--border-color)', 'var(--border-color)');
  const textColor = useColorModeValue('var(--text-primary)', 'var(--text-primary)');
  const mutedTextColor = useColorModeValue('var(--text-secondary)', 'var(--text-secondary)');

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created': return FaLock;
      case 'deposited': return FaCoins;
      case 'unlocked': return FaUnlock;
      case 'withdrawn': return FaChartLine;
      default: return FaClock;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created': return 'blue';
      case 'deposited': return 'green';
      case 'unlocked': return 'purple';
      case 'withdrawn': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'upcoming': return 'blue';
      default: return 'gray';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateProgress = (vault: any) => {
    const now = new Date().getTime();
    const created = new Date(vault.createdAt).getTime();
    const unlockDate = new Date(vault.unlockDate).getTime();
    
    if (now >= unlockDate) return 100;
    if (now <= created) return 0;
    
    return ((now - created) / (unlockDate - created)) * 100;
  };

  const generateTimelineEvents = (vault: any): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    // Vault creation
    events.push({
      id: `${vault.id}-created`,
      type: 'created',
      timestamp: vault.createdAt,
      description: 'Vault created',
      status: 'completed',
    });

    // Deposits
    if (vault.deposits && vault.deposits.length > 0) {
      vault.deposits.forEach((deposit: any, index: number) => {
        events.push({
          id: `${vault.id}-deposit-${index}`,
          type: 'deposited',
          timestamp: deposit.timestamp,
          amount: deposit.amount,
          description: `Deposited ${deposit.amount} ETH`,
          status: 'completed',
        });
      });
    }

    // Unlock date
    events.push({
      id: `${vault.id}-unlock`,
      type: 'unlocked',
      timestamp: vault.unlockDate,
      description: 'Vault unlocks',
      status: new Date() >= new Date(vault.unlockDate) ? 'completed' : 'upcoming',
    });

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getVaultStatus = (vault: any) => {
    const now = new Date();
    const unlockDate = new Date(vault.unlockDate);
    
    if (now >= unlockDate) {
      return { status: 'Unlocked', color: 'green' };
    } else {
      const daysLeft = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { status: `${daysLeft} days left`, color: 'yellow' };
    }
  };

  if (vaults.length === 0) {
    return (
      <Box p={8} textAlign="center">
        <VStack spacing={4}>
          <Icon as={FaLock} boxSize={12} color={mutedTextColor} />
          <Text color={textColor} fontSize="lg" fontWeight="bold">
            No Vaults Found
          </Text>
          <Text color={mutedTextColor}>
            Create your first vault to start your time-locked savings journey.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <VStack spacing={6} align="stretch">
        <Box px={6}>
          <Text fontSize="2xl" fontWeight="bold" color={textColor} mb={2}>
            Vault Timeline
          </Text>
          <Text color={mutedTextColor}>
            Track your vault journey from creation to unlock
          </Text>
        </Box>

        <VStack spacing={4} align="stretch">
          {vaults.map((vault, vaultIndex) => {
            const events = generateTimelineEvents(vault);
            const progress = calculateProgress(vault);
            const vaultStatus = getVaultStatus(vault);
            const showVaultDetails = showDetails[vault.id] || false;

            return (
              <MotionCard
                key={vault.id}
                bg={cardBg}
                borderColor={borderColor}
                borderRadius="xl"
                overflow="hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: vaultIndex * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    {/* Vault Header */}
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Box
                          p={2}
                          borderRadius="lg"
                          bg="purple.500"
                          color="white"
                        >
                          <Icon as={FaLock} boxSize={4} />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" color={textColor}>
                            Vault #{vault.id.slice(-6)}
                          </Text>
                          <Text fontSize="sm" color={mutedTextColor}>
                            Created {formatDate(vault.createdAt)}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <HStack spacing={3}>
                        <Badge colorScheme={vaultStatus.color} variant="solid" borderRadius="full">
                          {vaultStatus.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDetails({ ...showDetails, [vault.id]: !showVaultDetails })}
                          leftIcon={showVaultDetails ? <FaEyeSlash /> : <FaEye />}
                          color={mutedTextColor}
                        >
                          {showVaultDetails ? 'Hide' : 'Details'}
                        </Button>
                      </HStack>
                    </Flex>

                    {/* Progress Bar */}
                    <Box>
                      <Flex justify="space-between" mb={2}>
                        <Text fontSize="sm" color={mutedTextColor}>Progress</Text>
                        <Text fontSize="sm" color={textColor} fontWeight="bold">
                          {progress.toFixed(1)}%
                        </Text>
                      </Flex>
                      <Progress
                        value={progress}
                        colorScheme="purple"
                        borderRadius="full"
                        size="lg"
                        bg="rgba(0,0,0,0.1)"
                      />
                    </Box>

                    {/* Vault Stats */}
                    {showVaultDetails && (
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} p={4} bg="rgba(0,0,0,0.1)" borderRadius="md">
                        <Box textAlign="center">
                          <Text fontSize="sm" color={mutedTextColor}>Total Deposited</Text>
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            {vault.totalDeposited || '0'} ETH
                          </Text>
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="sm" color={mutedTextColor}>Unlock Date</Text>
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            {formatDate(vault.unlockDate)}
                          </Text>
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="sm" color={mutedTextColor}>Lock Duration</Text>
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            {Math.ceil((new Date(vault.unlockDate).getTime() - new Date(vault.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                          </Text>
                        </Box>
                      </SimpleGrid>
                    )}

                    {/* Timeline */}
                    <Box>
                      <Text fontSize="md" fontWeight="bold" color={textColor} mb={3}>
                        Timeline
                      </Text>
                      <VStack spacing={3} align="stretch">
                        {events.map((event, eventIndex) => (
                          <HStack key={event.id} spacing={3}>
                            {/* Timeline Line */}
                            <Box position="relative">
                              <Box
                                w={3}
                                h={3}
                                borderRadius="full"
                                bg={`${getEventColor(event.type)}.500`}
                                position="relative"
                                zIndex={2}
                              />
                              {eventIndex < events.length - 1 && (
                                <Box
                                  position="absolute"
                                  left="6px"
                                  top="12px"
                                  w="2px"
                                  h="40px"
                                  bg={borderColor}
                                  zIndex={1}
                                />
                              )}
                            </Box>

                            {/* Event Content */}
                            <VStack align="start" spacing={1} flex={1}>
                              <HStack spacing={2}>
                                <Icon
                                  as={getEventIcon(event.type)}
                                  color={`${getEventColor(event.type)}.500`}
                                  boxSize={4}
                                />
                                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                  {event.description}
                                </Text>
                                {event.amount && (
                                  <Badge colorScheme="green" size="sm">
                                    {event.amount} ETH
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontSize="xs" color={mutedTextColor}>
                                {formatDate(event.timestamp)}
                              </Text>
                            </VStack>

                            <Badge colorScheme={getStatusColor(event.status)} variant="solid" size="sm">
                              {event.status}
                            </Badge>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>

                    {/* Action Buttons */}
                    <HStack spacing={3} justify="center">
                      <Button
                        size="sm"
                        colorScheme="purple"
                        variant="outline"
                        onClick={() => onVaultClick?.(vault)}
                      >
                        View Details
                      </Button>
                      {new Date() >= new Date(vault.unlockDate) && (
                        <Button
                          size="sm"
                          colorScheme="green"
                          variant="solid"
                        >
                          Withdraw
                        </Button>
                      )}
                    </HStack>
                  </VStack>
                </CardBody>
              </MotionCard>
            );
          })}
        </VStack>
      </VStack>
    </Box>
  );
}; 