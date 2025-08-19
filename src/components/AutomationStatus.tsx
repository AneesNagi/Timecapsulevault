import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  Collapse,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
} from '@chakra-ui/react';
import { 
  FaRobot, 
  FaLink, 
  FaShieldAlt, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaInfoCircle
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface AutomationStatusProps {
  isConnected: boolean;
  selectedNetwork: any;
}

export const AutomationStatus: React.FC<AutomationStatusProps> = ({ 
  isConnected, 
  selectedNetwork 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [monitoredVaults, setMonitoredVaults] = useState(0);

  // Mock automation status check (replace with actual contract calls)
  useEffect(() => {
    if (isConnected) {
      // Simulate checking automation status
      const checkAutomationStatus = async () => {
        try {
          // This would be replaced with actual contract calls to VaultAutomation
          setAutomationStatus('active');
          setLastCheck(new Date());
          setMonitoredVaults(3); // Mock number
        } catch (error) {
          setAutomationStatus('inactive');
          console.error('Error checking automation status:', error);
        }
      };

      checkAutomationStatus();
      const interval = setInterval(checkAutomationStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const getStatusColor = () => {
    switch (automationStatus) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      default: return 'yellow';
    }
  };

  const getStatusIcon = () => {
    switch (automationStatus) {
      case 'active': return FaCheckCircle;
      case 'inactive': return FaExclamationTriangle;
      default: return FaClock;
    }
  };

  const getStatusText = () => {
    switch (automationStatus) {
      case 'active': return 'ON-CHAIN AUTOMATION ACTIVE';
      case 'inactive': return 'AUTOMATION INACTIVE';
      default: return 'CHECKING STATUS...';
    }
  };

  const openChainlinkAutomation = () => {
    window.open('https://automation.chain.link/', '_blank');
  };

  const openBSCScan = () => {
    // Network-specific automation addresses
    const automationAddresses: Record<number, string> = {
      421614: '0x0000000000000000000000000000000000000000', // TODO: Update with actual Arbitrum Sepolia automation address
    };
    
    const chainId = selectedNetwork?.chainId as number;
    const automationAddress = automationAddresses[chainId] || automationAddresses[421614];
    const baseUrl = 'https://sepolia.arbiscan.io';
    const url = `${baseUrl}/address/${automationAddress}`;
    window.open(url, '_blank');
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      bg="var(--bg-secondary)"
      border="1px solid"
      borderColor="var(--border-color)"
      borderRadius="xl"
      p={4}
      mb={6}
    >
      <VStack align="stretch" spacing={4}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaRobot} color="var(--accent-color)" boxSize={5} />
            <Text fontSize="lg" fontWeight="bold" color="var(--text-primary)">
              On-Chain Automation Status
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Badge 
              colorScheme={getStatusColor()} 
              variant="solid" 
              borderRadius="full" 
              px={3} 
              py={1}
            >
              <HStack spacing={2}>
                <Icon as={getStatusIcon()} boxSize={3} />
                <Text fontSize="xs" fontWeight="bold">{getStatusText()}</Text>
              </HStack>
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              color="var(--text-muted)"
              _hover={{ color: 'var(--text-primary)' }}
            >
              {isExpanded ? 'Hide' : 'Details'}
            </Button>
          </HStack>
        </HStack>

        {/* Status Summary */}
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" color="var(--text-muted)">
            {automationStatus === 'active' 
              ? 'Vaults will automatically unlock even when dApp is offline'
              : 'Manual intervention may be required for vault withdrawals'
            }
          </Text>
          {lastCheck && (
            <Text fontSize="xs" color="var(--text-muted)">
              Last check: {lastCheck.toLocaleTimeString()}
            </Text>
          )}
        </HStack>

        {/* Expanded Details */}
        <Collapse in={isExpanded}>
          <VStack align="stretch" spacing={4} pt={4}>
            {/* Automation Stats */}
            <StatGroup>
              <Stat>
                <StatLabel color="var(--text-muted)">Network</StatLabel>
                <StatNumber fontSize="md" color="var(--text-primary)">
                  {selectedNetwork?.name || 'Unknown'}
                </StatNumber>
                <StatHelpText color="var(--text-muted)">
                  Chain ID: {selectedNetwork?.chainId || 'N/A'}
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color="var(--text-muted)">Monitored Vaults</StatLabel>
                <StatNumber fontSize="md" color="var(--text-primary)">
                  {monitoredVaults}
                </StatNumber>
                <StatHelpText color="var(--text-muted)">
                  Automatically tracked
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel color="var(--text-muted)">Check Interval</StatLabel>
                <StatNumber fontSize="md" color="var(--text-primary)">
                  5 min
                </StatNumber>
                <StatHelpText color="var(--text-muted)">
                  Chainlink Automation
                </StatHelpText>
              </Stat>
            </StatGroup>

            {/* Automation Benefits */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="var(--text-primary)" mb={3}>
                🚀 Automation Benefits
              </Text>
              <VStack align="stretch" spacing={2}>
                <HStack spacing={3}>
                  <Icon as={FaShieldAlt} color="green.400" boxSize={4} />
                  <Text fontSize="sm" color="var(--text-muted)">
                    True autonomy - vaults unlock automatically
                  </Text>
                </HStack>
                <HStack spacing={3}>
                  <Icon as={FaLink} color="blue.400" boxSize={4} />
                  <Text fontSize="sm" color="var(--text-muted)">
                    Decentralized - no single point of failure
                  </Text>
                </HStack>
                <HStack spacing={3}>
                  <Icon as={FaClock} color="purple.400" boxSize={4} />
                  <Text fontSize="sm" color="var(--text-muted)">
                    Offline-proof - works even when dApp is down
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Action Buttons */}
            <HStack spacing={3} pt={2}>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                leftIcon={<FaExternalLinkAlt />}
                onClick={openChainlinkAutomation}
              >
                Chainlink Automation
              </Button>
              <Button
                size="sm"
                colorScheme="purple"
                variant="outline"
                leftIcon={<FaExternalLinkAlt />}
                onClick={openBSCScan}
              >
                View Contract
              </Button>
              <Tooltip label="On-chain automation ensures vaults automatically unlock when conditions are met, even if the dApp is offline. This is powered by Chainlink Automation network.">
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FaInfoCircle />}
                >
                  Learn More
                </Button>
              </Tooltip>
            </HStack>

            {/* Technical Details */}
            <Box 
              bg="var(--bg-primary)" 
              p={3} 
              borderRadius="md" 
              border="1px solid" 
              borderColor="var(--border-color)"
            >
              <Text fontSize="xs" color="var(--text-muted)" mb={2}>
                Technical Details:
              </Text>
              <VStack align="stretch" spacing={1}>
                <Text fontSize="xs" color="var(--text-muted)">
                  • Contract: {(() => {
                    const automationAddresses: Record<number, string> = {
                      421614: '0x0000000000000000000000000000000000000000', // TODO: Update with actual Arbitrum Sepolia automation address
                    };
                    const chainId = selectedNetwork?.chainId as number;
                    return automationAddresses[chainId] || automationAddresses[421614];
                  })()}
                </Text>
                <Text fontSize="xs" color="var(--text-muted)">
                  • Max vaults per upkeep: 20
                </Text>
                <Text fontSize="xs" color="var(--text-muted)">
                  • Gas limit per withdrawal: 100,000
                </Text>
                <Text fontSize="xs" color="var(--text-muted)">
                  • Functions: checkUpkeep() → performUpkeep()
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Collapse>
      </VStack>
    </MotionBox>
  );
}; 