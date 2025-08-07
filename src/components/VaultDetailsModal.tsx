import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalCloseButton, 
  VStack, 
  Text, 
  Badge, 
  Button, 
  useToast, 
  Box, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  useColorModeValue,
  HStack,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Tooltip,
  Input,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress
} from '@chakra-ui/react';
import { formatEther } from 'viem';
import { useVault } from '../hooks/useVault';
import { PriceChart, CountdownTimer, VaultPerformanceTracker } from './visualization';
import { useState, useContext } from 'react';
import { 
  FaLock, 
  FaClock, 
  FaChartLine, 
  FaBullseye, 
  FaCoins, 
  FaCopy,
  FaExternalLinkAlt,
  FaUnlock
} from 'react-icons/fa';
import { NetworkContext } from './DAppLayout';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

interface VaultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: string;
  vaultIndex: number | null;
  balance: bigint;
  isTimeLocked: boolean;
  isPriceLocked: boolean;
  isGoalLocked?: boolean;
  unlockTime: bigint;
  targetPrice: bigint;
  currentPrice: bigint;
  isLocked: boolean;
  unlockReason: string;
}

export const VaultDetailsModal = ({
  isOpen,
  onClose,
  vault,
  vaultIndex,
  balance,
  isTimeLocked,
  isPriceLocked,
  isGoalLocked,
  unlockTime,
  targetPrice,
  currentPrice,
  isLocked,
}: VaultDetailsModalProps) => {
  const toast = useToast();
  const { deposit } = useVault();
  const { network: selectedNetwork } = useContext(NetworkContext);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Theme colors
  const bgColor = useColorModeValue('var(--bg-primary)', 'var(--bg-primary)');
  const cardBg = useColorModeValue('var(--bg-secondary)', 'var(--bg-secondary)');
  const textColor = useColorModeValue('var(--text-primary)', 'var(--text-primary)');
  const mutedTextColor = useColorModeValue('var(--text-secondary)', 'var(--text-secondary)');
  const borderColor = useColorModeValue('var(--border-color)', 'var(--border-color)');

  // Helper function for dynamic currency display
  const getAssetName = () => {
    switch (selectedNetwork.id) {
      case 'sepolia':
        return 'ETH';
      case 'bsc-testnet':
        return 'BNB';
      default:
        return 'ETH';
    }
  };

  const getLockTypeIcon = () => {
    if (isTimeLocked) return FaClock;
    if (isPriceLocked) return FaChartLine;
    if (isGoalLocked) return FaBullseye;
    return FaLock;
  };

  const getLockTypeColor = () => {
    if (isTimeLocked) return 'blue';
    if (isPriceLocked) return 'green';
    if (isGoalLocked) return 'purple';
    return 'gray';
  };

  const getLockTypeText = () => {
    if (isTimeLocked) return 'TIME LOCK';
    if (isPriceLocked) return 'PRICE LOCK';
    if (isGoalLocked) return 'GOAL LOCK';
    return 'LOCKED';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied!`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const openExplorer = () => {
    const explorerUrl = selectedNetwork.explorer + '/address/' + vault;
    window.open(explorerUrl, '_blank');
  };

  if (!vault || vaultIndex === null) {
    return null;
  }

  const formattedBalance = formatEther(balance);
  const formattedTargetPrice = Number(targetPrice) / 1e8;
  const unlockDate = new Date(Number(unlockTime) * 1000).toLocaleString();

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent
        bg={cardBg}
        borderRadius="2xl"
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        maxW="900px"
        mx={4}
      >
        <ModalHeader 
          fontSize="2xl" 
          fontWeight="extrabold" 
          color={textColor} 
          textAlign="center"
          borderBottom="1px solid"
          borderColor={borderColor}
          pb={4}
        >
          <HStack justify="center" spacing={3}>
            <Icon as={FaLock} color="var(--accent-color)" boxSize={6} />
            <Text>Vault Details</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton 
          color={mutedTextColor}
          _hover={{ color: textColor }}
          size="lg"
        />
        <ModalBody p={6}>
          {!isLocked && balance > 0n ? (
            <VStack width="full" py={12} spacing={6} align="center" justify="center">
              <Box textAlign="center">
                <Icon as={FaUnlock} color="green.400" boxSize={12} mb={4} />
                <Text fontSize="xl" color={textColor} fontWeight="bold" mb={2}>
                  🎉 Vault Unlocked!
                </Text>
                <Text fontSize="lg" color={mutedTextColor} mb={4}>
                  Your vault has been automatically unlocked and funds are being withdrawn to your wallet.
                </Text>
                <Text fontSize="md" color="green.400" fontWeight="semibold">
                  {formattedBalance} {getAssetName()} will be sent to your wallet automatically.
                </Text>
              </Box>
            </VStack>
          ) : (
            <Tabs variant="soft-rounded" colorScheme="purple" isFitted>
              <TabList mb={6} bg={bgColor} borderRadius="lg" p={1}>
                <Tab fontWeight="medium" color={mutedTextColor} _selected={{ color: textColor, bg: cardBg }}>Overview</Tab>
                <Tab fontWeight="medium" color={mutedTextColor} _selected={{ color: textColor, bg: cardBg }}>Analytics</Tab>
              </TabList>
              <TabPanels>
                {/* Overview Tab */}
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={6}>
                    {/* Vault Address Section */}
                    <MotionCard
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardBody p={4}>
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between" align="center">
                            <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Vault Address</Text>
                            <HStack spacing={2}>
                              <Tooltip label="Copy address" hasArrow>
                                <IconButton
                                  aria-label="Copy address"
                                  icon={<FaCopy />}
                                  size="sm"
                                  variant="ghost"
                                  color={mutedTextColor}
                                  _hover={{ color: textColor }}
                                  onClick={() => copyToClipboard(vault, 'Address')}
                                />
                              </Tooltip>
                              <Tooltip label="View on explorer" hasArrow>
                                <IconButton
                                  aria-label="View on explorer"
                                  icon={<FaExternalLinkAlt />}
                                  size="sm"
                                  variant="ghost"
                                  color={mutedTextColor}
                                  _hover={{ color: textColor }}
                                  onClick={openExplorer}
                                />
                              </Tooltip>
                            </HStack>
                          </HStack>
                          <Text fontSize="md" fontWeight="mono" color={textColor} noOfLines={1}>
                            {vault}
                          </Text>
                        </VStack>
                      </CardBody>
                    </MotionCard>

                    {/* Balance Section */}
                    <MotionCard
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <CardBody p={4}>
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between" align="center">
                            <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Current Balance</Text>
                            <Icon as={FaCoins} color="var(--accent-color)" boxSize={4} />
                          </HStack>
                          <Text fontSize="4xl" fontWeight="extrabold" color={textColor}>
                            {formattedBalance} {getAssetName()}
                          </Text>
                        </VStack>
                      </CardBody>
                    </MotionCard>

                    {/* Lock Details Section */}
                    <MotionCard
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <CardBody p={4}>
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between" align="center">
                            <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Lock Type</Text>
                            <Badge colorScheme={getLockTypeColor()} variant="solid" borderRadius="full" px={3} py={1}>
                              <HStack spacing={2}>
                                <Icon as={getLockTypeIcon()} boxSize={3} />
                                <Text fontSize="xs" fontWeight="bold">{getLockTypeText()}</Text>
                              </HStack>
                            </Badge>
                          </HStack>
                          
                          {/* Show different information based on lock type */}
                          {isTimeLocked && (
                            <Text fontSize="md" color={textColor}>
                              Unlocks on {unlockDate}
                            </Text>
                          )}
                          
                          {isPriceLocked && (
                            <VStack align="stretch" spacing={2}>
                              <Text fontSize="md" color={textColor}>
                                Target Price: ${(Number(targetPrice) / 1e8).toFixed(2)}
                              </Text>
                              <Text fontSize="md" color={textColor}>
                                Current Price: ${(Number(currentPrice) / 1e8).toFixed(2)}
                              </Text>
                              <Text fontSize="sm" color={mutedTextColor}>
                                Vault unlocks when {getAssetName()} reaches ${(Number(targetPrice) / 1e8).toFixed(2)}
                              </Text>
                            </VStack>
                          )}
                          
                          {isGoalLocked && (
                            <VStack align="stretch" spacing={2}>
                              <Text fontSize="md" color={textColor}>
                                Goal Amount: {formattedBalance} {getAssetName()}
                              </Text>
                              <Text fontSize="sm" color={mutedTextColor}>
                                Vault unlocks when goal amount is reached
                              </Text>
                            </VStack>
                          )}
                        </VStack>
                      </CardBody>
                    </MotionCard>

                    {/* Countdown Timer - Only for Time Locked Vaults */}
                    {isTimeLocked && (
                      <MotionCard
                        bg={bgColor}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <CardBody p={4}>
                          <CountdownTimer unlockTime={Number(unlockTime)} isTimeLocked={isTimeLocked} />
                        </CardBody>
                      </MotionCard>
                    )}

                    {/* Price Progress - Only for Price Locked Vaults */}
                    {isPriceLocked && (
                      <MotionCard
                        bg={bgColor}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <CardBody p={4}>
                          <VStack align="stretch" spacing={4}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor}>
                              Price Progress
                            </Text>
                            <Box>
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" color={mutedTextColor}>Current Price</Text>
                                <Text fontSize="sm" color={textColor}>${(Number(currentPrice) / 1e8).toFixed(2)}</Text>
                              </HStack>
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" color={mutedTextColor}>Target Price</Text>
                                <Text fontSize="sm" color={textColor}>${(Number(targetPrice) / 1e8).toFixed(2)}</Text>
                              </HStack>
                              <Progress 
                                value={Math.min((Number(currentPrice) / Number(targetPrice)) * 100, 100)} 
                                colorScheme={Number(currentPrice) >= Number(targetPrice) ? "green" : "blue"}
                                borderRadius="full"
                                height="8px"
                              />
                              <Text fontSize="xs" color={mutedTextColor} mt={2}>
                                {Number(currentPrice) >= Number(targetPrice) 
                                  ? "Target price reached! Vault can be unlocked." 
                                  : `${getAssetName()} needs to increase by $${((Number(targetPrice) - Number(currentPrice)) / 1e8).toFixed(2)} to unlock this vault.`}
                              </Text>
                            </Box>
                          </VStack>
                        </CardBody>
                      </MotionCard>
                    )}

                    {/* Goal Progress - Only for Goal Locked Vaults */}
                    {isGoalLocked && (
                      <MotionCard
                        bg={bgColor}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <CardBody p={4}>
                          <VStack align="stretch" spacing={4}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor}>
                              Goal Progress
                            </Text>
                            <Box>
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" color={mutedTextColor}>Current Amount</Text>
                                <Text fontSize="sm" color={textColor}>{formattedBalance} {getAssetName()}</Text>
                              </HStack>
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" color={mutedTextColor}>Target Amount</Text>
                                <Text fontSize="sm" color={textColor}>{formattedBalance} {getAssetName()}</Text>
                              </HStack>
                              <Progress 
                                value={100} 
                                colorScheme="green"
                                borderRadius="full"
                                height="8px"
                              />
                              <Text fontSize="xs" color={mutedTextColor} mt={2}>
                                Goal amount reached! Vault can be unlocked.
                              </Text>
                            </Box>
                          </VStack>
                        </CardBody>
                      </MotionCard>
                    )}

                    {/* Deposit Section */}
                    {isLocked && (
                      <MotionCard
                        bg={bgColor}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                      >
                        <CardBody p={4}>
                          <VStack align="stretch" spacing={4}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor}>
                              Deposit More {getAssetName()}
                            </Text>
                            
                            {/* Quick Deposit Buttons */}
                            <SimpleGrid columns={3} spacing={3}>
                              {[0.01, 0.1, 0.5].map((amount) => (
                                <Button
                                  key={amount}
                                  size="sm"
                                  variant="outline"
                                  colorScheme="purple"
                                  onClick={() => setDepositAmount(amount.toString())}
                                  _hover={{ bg: 'var(--accent-color)', color: 'white' }}
                                >
                                  +{amount} {getAssetName()}
                                </Button>
                              ))}
                            </SimpleGrid>

                            {/* Custom Amount Input */}
                            <HStack spacing={3}>
                              <Input
                                placeholder={`Amount in ${getAssetName()}`}
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                bg={cardBg}
                                borderColor={borderColor}
                                color={textColor}
                                _placeholder={{ color: mutedTextColor }}
                                _focus={{ borderColor: 'var(--accent-color)' }}
                              />
                              <Button
                                colorScheme="purple"
                                onClick={async () => {
                                  if (!depositAmount || parseFloat(depositAmount) <= 0) {
                                    toast({
                                      title: 'Invalid amount',
                                      description: 'Please enter a valid amount',
                                      status: 'error',
                                      duration: 3000,
                                    });
                                    return;
                                  }
                                  setIsDepositing(true);
                                  try {
                                    const success = await deposit(depositAmount, vault);
                                    if (success) {
                                      toast({
                                        title: 'Deposit successful!',
                                        description: `${depositAmount} ${getAssetName()} deposited to vault`,
                                        status: 'success',
                                        duration: 5000,
                                      });
                                      setDepositAmount('');
                                    } else {
                                      throw new Error('Deposit failed');
                                    }
                                  } catch (error) {
                                    toast({
                                      title: 'Deposit failed',
                                      description: error instanceof Error ? error.message : 'Failed to deposit funds',
                                      status: 'error',
                                      duration: 5000,
                                    });
                                  } finally {
                                    setIsDepositing(false);
                                  }
                                }}
                                isLoading={isDepositing}
                                loadingText="Depositing..."
                                minW="120px"
                              >
                                Deposit
                              </Button>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </MotionCard>
                    )}

                    {/* Automatic Withdrawal Info */}
                    <Alert status="info" borderRadius="lg" bg="blue.500" color="white">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>🤖 Fully Automated System</AlertTitle>
                        <AlertDescription>
                          This vault operates with zero human interaction. Once unlock conditions are met, funds will be automatically withdrawn to your wallet.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  </VStack>
                </TabPanel>

                {/* Analytics Tab */}
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={6}>
                    <VaultPerformanceTracker
                      vaultAddress={vault}
                      currentBalance={balance}
                      targetPrice={formattedTargetPrice}
                      isPriceLocked={isPriceLocked}
                      isTimeLocked={isTimeLocked}
                    />
                    <PriceChart 
                      targetPrice={Number(targetPrice)} 
                      currentPrice={Number(currentPrice)} 
                      isPriceLocked={isPriceLocked} 
                    />
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 