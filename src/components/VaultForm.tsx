import { useState, ChangeEvent, useEffect, useContext } from 'react'
import { useVault } from '../hooks/useVault'
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { LoadingSpinner } from './LoadingSpinner';
import { NetworkContext } from './DAppLayout'
import { ethers } from 'ethers'
import { createProvider } from '../utils/provider'
import {
  useToast,
  HStack,
  Box,
  Text,
  Button as ChakraButton,
  VStack,
  FormControl,
  FormLabel,
  Input as ChakraInput,
  FormErrorMessage,
  Heading,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stepper, Step, StepIndicator, StepTitle, StepDescription, StepSeparator, Button,
  InputGroup, InputRightElement, Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { add } from 'date-fns'
import { InfoOutlineIcon, CheckCircleIcon, LockIcon, TimeIcon, StarIcon } from '@chakra-ui/icons';
import { Tooltip } from '@chakra-ui/react';
import DepositPromptModal from './DepositPromptModal';
import { TokenSelector } from './TokenSelector';
import { NetworkSelector } from './NetworkSelector';

const MotionButton = motion.create(ChakraButton)
const MotionBox = motion.create(Box, {
  forwardMotionProps: true
})

const steps = [
  { title: 'Wallet', description: 'Select your wallet' },
  { title: 'Token', description: 'Select token type' },
  { title: 'Lock Type', description: 'Choose lock type' },
  { title: 'Details', description: 'Enter vault details' },
  { title: 'Review', description: 'Review & Confirm' },
];

const stepIcons = [
  <TimeIcon boxSize={5} color="purple.500" />, // Wallet
  <StarIcon boxSize={5} color="purple.500" />, // Token
  <LockIcon boxSize={5} color="purple.500" />, // Lock Type
  <InfoOutlineIcon boxSize={5} color="purple.500" />, // Details
  <CheckCircleIcon boxSize={5} color="green.500" />, // Review
];

export const VaultForm = () => {
  const mobileOpt = useMobileOptimization();
  const location = useLocation();
  const navigate = useNavigate();
  const { network: selectedNetwork, setNetwork } = useContext(NetworkContext);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  
  // Check if this is the first vault from wallet creation
  const isFirstVault = location.state?.isFirstVault;
  
  const { createNewVault, createERC20Vault, deposit, depositERC20, currentEthPrice, marketEthPrice } = useVault()
  const [amount, setAmount] = useState<string>('')
  const [unlockYears, setUnlockYears] = useState('')
  const [unlockMonths, setUnlockMonths] = useState('')
  const [unlockDays, setUnlockDays] = useState('')
  const [targetPrice, setTargetPrice] = useState<string>('')
  const [isPriceLock, setIsPriceLock] = useState(false)
  const [isGoalLock, setIsGoalLock] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usdGoal, setUsdGoal] = useState('')
  const toast = useToast()
  const [step, setStep] = useState(0);

  // Token selection state
  const [selectedToken, setSelectedToken] = useState<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    balance?: string;
    isValid: boolean;
  } | null>(null);

  // Price lock validation state
  const [isPriceInvalid, setIsPriceInvalid] = useState(false);
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { isOpen: isDepositOpen, onOpen: onDepositOpen, onClose: onDepositClose } = useDisclosure();
  const [isSuccess, setIsSuccess] = useState(false);
  const [newVaultAddress, setNewVaultAddress] = useState<string | null>(null);
  const [vaultCreationData, setVaultCreationData] = useState<{
    vaultType: 'time' | 'price' | 'goal';
    goalAmount?: string;
    unlockTime?: string;
    targetPrice?: string;
    initialDepositAmount?: string;
  } | null>(null);

  const formatDuration = (years: string, months: string, days: string) => {
    const parts = []
    if (years && parseInt(years) > 0) parts.push(`${years} year${parseInt(years) !== 1 ? 's' : ''}`)
    if (months && parseInt(months) > 0) parts.push(`${months} month${parseInt(months) !== 1 ? 's' : ''}`)
    if (days && parseInt(days) > 0) parts.push(`${days} day${parseInt(days) !== 1 ? 's' : ''}`)
    return parts.length > 0 ? parts.join(', ') : 'No duration set'
  }

  const getCurrencyName = () => {
    return selectedNetwork.currency;
  };

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

  const getTokenPrice = () => {
    // For USDT, return approximately $1.00 (USDT is pegged to USD)
    if (selectedToken && selectedToken.symbol === 'USDT') {
      return 1.00; // USDT is pegged to USD
    }
    // Prefer market price for display if available; fallback to Chainlink
    if (marketEthPrice && Number.isFinite(marketEthPrice)) return marketEthPrice;
    if (currentEthPrice && Number(currentEthPrice) > 0) return Number(currentEthPrice) / 1e8;
    return 0;
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Load saved wallets from localStorage and refresh balances
  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const parsedWallets = JSON.parse(savedWallets);
      
      // Refresh balances for the current network
      const refreshBalances = async () => {
        if (!selectedNetwork) return;
        
        console.log('=== VAULTFORM BALANCE REFRESH DEBUG ===');
        console.log('Selected network:', selectedNetwork);
        console.log('Parsed wallets from localStorage:', parsedWallets);
        
        // Check if WalletManager has already updated the balance
        const currentWallets = localStorage.getItem('wallets');
        if (currentWallets) {
          const currentParsedWallets = JSON.parse(currentWallets);
          console.log('Current wallets in localStorage:', currentParsedWallets);
        }
        
        try {
          // Use the current wallets from localStorage (which WalletManager has already updated)
          const currentWallets = localStorage.getItem('wallets');
          if (currentWallets) {
            const currentParsedWallets = JSON.parse(currentWallets);
            console.log('Using updated wallets from localStorage:', currentParsedWallets);
            setWallets(currentParsedWallets);
            
            // If a wallet address was passed in the location state, select it
            if (location.state && location.state.walletAddress) {
              setSelectedWallet(location.state.walletAddress);
            } else if (currentParsedWallets.length > 0) {
              // Otherwise select the first wallet
              setSelectedWallet(currentParsedWallets[0].address);
            }
            return; // Skip the balance refresh since WalletManager already did it
          }
          
          // Fallback: refresh balances manually if localStorage is empty
          const provider = createProvider(selectedNetwork);
          console.log('Provider created with RPC:', selectedNetwork.rpc[0]);
          
          const updatedWallets = await Promise.all(
            parsedWallets.map(async (wallet: any) => {
              try {
                console.log(`Fetching balance for ${wallet.address} on ${selectedNetwork.name}...`);
                const balance = await provider.getBalance(wallet.address);
                const formattedBalance = ethers.formatEther(balance);
                console.log(`Balance for ${wallet.address}: ${formattedBalance} ${selectedNetwork.currency}`);
                
                return {
                  ...wallet,
                  balance: formattedBalance
                };
              } catch (error) {
                console.error(`Error fetching balance for ${wallet.address}:`, error);
                return wallet;
              }
            })
          );
          
          console.log('Updated wallets:', updatedWallets);
          setWallets(updatedWallets);
          
          // If a wallet address was passed in the location state, select it
          if (location.state && location.state.walletAddress) {
            setSelectedWallet(location.state.walletAddress);
          } else if (updatedWallets.length > 0) {
            // Otherwise select the first wallet
            setSelectedWallet(updatedWallets[0].address);
          }
        } catch (error) {
          console.error('Error refreshing wallet balances:', error);
          setWallets(parsedWallets);
        }
      };
      
      refreshBalances();
    }
  }, [location, selectedNetwork]);

  // Listen for localStorage changes (when WalletManager updates wallets)
  useEffect(() => {
    const handleStorageChange = () => {
      const currentWallets = localStorage.getItem('wallets');
      if (currentWallets) {
        const currentParsedWallets = JSON.parse(currentWallets);
        console.log('VaultForm: localStorage changed, updating wallets:', currentParsedWallets);
        setWallets(currentParsedWallets);
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also check localStorage periodically (since storage event doesn't fire for same-origin changes)
    const interval = setInterval(() => {
      const currentWallets = localStorage.getItem('wallets');
      if (currentWallets) {
        const currentParsedWallets = JSON.parse(currentWallets);
        const currentWalletsString = JSON.stringify(currentParsedWallets);
        const existingWalletsString = JSON.stringify(wallets);
        
        if (currentWalletsString !== existingWalletsString) {
          console.log('VaultForm: wallets changed in localStorage, updating...');
          setWallets(currentParsedWallets);
        }
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [wallets]);

  // Validate price lock target price
  useEffect(() => {
    if (isPriceLock && targetPrice && currentEthPrice) {
      const target = parseFloat(targetPrice);
      const current = Number(currentEthPrice) / 1e8;
      setIsPriceInvalid(target <= current);
    } else {
      setIsPriceInvalid(false);
    }
  }, [isPriceLock, targetPrice, currentEthPrice]);

  const handleCreateVault = async () => {
    if (!selectedWallet) {
      setError('Please select a wallet first')
      toast({
        title: 'Error',
        description: 'Please select a wallet first',
        status: 'error',
        duration: 5000,
      })
      return
    }

    if (!selectedToken) {
      setError('Please select a token first')
      return
    }

    if (!amount) {
      setError('Please enter an amount')
      return
    }

    const years = parseInt(unlockYears || '0')
    const months = parseInt(unlockMonths || '0')
    const days = parseInt(unlockDays || '0')

    if (!isPriceLock && !isGoalLock && years === 0 && months === 0 && days === 0) {
      setError('Please enter an unlock duration (years, months, days).')
      return
    }

    if (isPriceLock && !targetPrice) {
      setError('Please enter target price')
      return
    }

    if (isGoalLock && !usdGoal) {
      setError('Please enter a USD goal')
      return
    }

    // Price lock validation: target price must be greater than current price
    if (isPriceLock) {
      const targetPriceWei = parseFloat(targetPrice) * 1e8 // Assuming 8 decimals for price feed
      const currentPriceWei = Number(currentEthPrice) // currentEthPrice is bigint, convert to number
      if (targetPriceWei <= currentPriceWei) {
        setError(`Target price must be greater than current ${getAssetName()} price.`)
        return
      }
    }

    // Goal lock validation: USD goal must be greater than 0
    if (isGoalLock) {
      if (parseFloat(usdGoal) <= 0) {
        setError('USD goal must be greater than 0.')
        return
      }
    }

    try {
      setIsLoading(true)
      setError(null)

      let unlockTimestamp: number
      let targetPriceParam = 0
      let targetAmountParam = 0
      if (isGoalLock) {
        // For goal lock, set unlockTime to 5 years from now (well within the 10-year max)
        unlockTimestamp = Math.floor(Date.now() / 1000) + (5 * 365 * 24 * 60 * 60)
        // Calculate targetAmount in wei from USD goal and current asset price
        // Asset price is in 1e8, USD goal is in dollars
        const assetPrice = Number(currentEthPrice) / 1e8
        const assetAmount = parseFloat(usdGoal) / assetPrice
        targetAmountParam = Math.floor(assetAmount * 1e18)
        
        console.log('Goal lock calculation:', {
          usdGoal,
          currentEthPrice: currentEthPrice.toString(),
          assetPrice,
          assetAmount,
          targetAmountParam
        });
      } else if (isPriceLock) {
        // For price lock, set unlockTime to 5 years from now (well within the 10-year max)
        unlockTimestamp = Math.floor(Date.now() / 1000) + (5 * 365 * 24 * 60 * 60)
        targetPriceParam = Math.floor(parseFloat(targetPrice) * 1e8)
      } else {
        const now = new Date()
        const futureDate = add(now, {
          years: parseInt(unlockYears || '0'),
          months: parseInt(unlockMonths || '0'),
          days: parseInt(unlockDays || '0'),
        })
        unlockTimestamp = Math.floor(futureDate.getTime() / 1000)
      }

      console.log('Creating vault with params:', {
        unlockTimestamp,
        targetPrice: targetPriceParam,
        targetAmount: targetAmountParam,
        isPriceLock,
        isGoalLock,
      })

      // Create the vault based on token type
      let vaultAddress: string | undefined;
      
      if (selectedToken.address === '0x0000000000000000000000000000000000000000') {
        // Native token vault
        vaultAddress = await createNewVault(
          unlockTimestamp,
          targetPriceParam,
          targetAmountParam
        );
      } else {
        // ERC-20 token vault
        vaultAddress = await createERC20Vault(
          unlockTimestamp,
          targetPriceParam,
          targetAmountParam,
          selectedToken.address
        );
      }

      if (!vaultAddress) {
        throw new Error('Failed to create vault')
      }

      console.log('Vault created successfully, proceeding with automatic deposit...')

      // Automatically deposit the initial amount
      if (amount && parseFloat(amount) > 0) {
        try {
          console.log(`Depositing ${amount} ${getAssetName()} to vault ${vaultAddress}...`);
          
          // Use the appropriate deposit function based on token type
          if (selectedToken && selectedToken.address !== '0x0000000000000000000000000000000000000000') {
            // ERC-20 token deposit
            await depositERC20(amount, vaultAddress as `0x${string}`, selectedToken.address);
          } else {
            // Native token deposit
            await deposit(amount, vaultAddress as `0x${string}`);
          }
          
          toast({
            title: 'Vault Created & Funded Successfully! 🎉',
            description: `${amount} ${selectedToken ? selectedToken.symbol : getAssetName()} has been deposited to your new vault`,
            status: 'success',
            duration: 5000,
          });
          
          // Show success state
          onConfirmClose();
          setIsSuccess(true);
        } catch (depositError) {
          console.error('Automatic deposit failed:', depositError);
          
          // If automatic deposit fails, show the deposit prompt as fallback
          onConfirmClose();
          setNewVaultAddress(vaultAddress);
          
          const vaultType = isPriceLock ? 'price' : isGoalLock ? 'goal' : 'time';
          const unlockDate = years > 0 || months > 0 || days > 0
            ? add(new Date(), { 
                years, 
                months, 
                days,
              }).toLocaleDateString()
            : undefined;
          
          setVaultCreationData({
            vaultType,
            goalAmount: isGoalLock ? usdGoal : undefined,
            unlockTime: unlockDate,
            targetPrice: isPriceLock ? targetPrice : undefined,
            initialDepositAmount: amount,
          });
          
          onDepositOpen();
          
          toast({
            title: 'Vault Created Successfully',
            description: 'Vault created but automatic deposit failed. You can deposit manually.',
            status: 'warning',
            duration: 5000,
          });
        }
      } else {
        // No initial deposit specified, show success state
        onConfirmClose();
        setIsSuccess(true);
        
        toast({
          title: 'Vault Created Successfully! 🎉',
          description: 'Your vault has been created. You can add funds anytime from the vault details.',
          status: 'success',
          duration: 5000,
        });
      }
      
    } catch (err) {
      onConfirmClose();
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        toast({
          title: 'Transaction cancelled',
          description: 'You cancelled the wallet transaction.',
          status: 'info',
          duration: 4000,
        });
      } else {
        console.error('Error in handleCreateVault:', err)
        setError(err instanceof Error ? err.message : 'Failed to create vault')
        setIsLoading(false)

        // Show error toast
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to create vault',
          status: 'error',
          duration: 5000,
        })
      }
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    setter(e.target.value)
  }



  // Step navigation
  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // Step validation
  const isWalletStepValid = !!selectedWallet;
  const isTokenStepValid = !!selectedToken;
  const isLockTypeStepValid = isPriceLock || isGoalLock || (!isPriceLock && !isGoalLock);
  const isDetailsStepValid = (
    (isPriceLock && targetPrice) ||
    (isGoalLock && usdGoal) ||
    (!isPriceLock && !isGoalLock && (parseInt(unlockYears || '0') > 0 || parseInt(unlockMonths || '0') > 0 || parseInt(unlockDays || '0') > 0))
  ) && amount;

  const handleDepositComplete = () => {
    setIsSuccess(true);
    onDepositClose();
    // Optional: Navigate to my-vaults or show success state
  };

  if (isSuccess) {
    return (
      <Box
        p={8}
        bg="rgba(35, 37, 38, 0.95)"
        borderRadius="xl"
        shadow="2xl"
        maxW="xl"
        mx="auto"
        my={10}
        textAlign="center"
        border="1px solid"
        borderColor="#4a5568"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <VStack spacing={6}>
            <CheckCircleIcon boxSize={16} color="green.500" />
            <Heading as="h2" size="xl" color="#ffffff">
              Vault Created!
            </Heading>
            <Text color="#ffffff">Your new vault has been successfully created and funded.</Text>
            <Text fontSize="sm" color="#a0a0a0">
              Address: {newVaultAddress}
            </Text>
            <Button
              colorScheme="purple"
              size="lg"
              onClick={() => navigate('/my-vaults')}
            >
              View My Vaults
            </Button>
          </VStack>
        </motion.div>
      </Box>
    )
  }

  return (
    <Box
      p={8}
      bg="rgba(35, 37, 38, 0.95)"
      borderRadius="xl"
      shadow="2xl"
      maxW="5xl"
      mx="auto"
      my={10}
      border="1px solid"
      borderColor="#4a5568"
      position="relative"
      zIndex={1}
      sx={{
        background: 'linear-gradient(145deg, rgba(35, 37, 38, 0.95), rgba(45, 55, 72, 0.95))',
        boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.05)',
      }}
    >
      {isLoading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <VStack spacing={mobileOpt.spacing}>
            <LoadingSpinner 
              size="xl" 
              variant="pulse" 
              color="purple.500" 
              text="Creating your vault..."
            />
            <Text color="gray.300" fontSize={mobileOpt.fontSize}>
              This may take a few moments
            </Text>
          </VStack>
        </Box>
      )}
      <Stack direction={{ base: 'column', md: 'row' }} spacing={8} align="flex-start" position="relative" zIndex={1}>
        {/* Main Form Area */}
        <Box flex="2" minW={0} position="relative" zIndex={2}>
          <VStack spacing={6} align="stretch" minH={{ base: 'auto', md: '550px' }}>
            {/* Network Selector */}
            <Box alignSelf="flex-start" mb={2}>
              <Text fontSize="sm" color="gray.500" mb={2} fontWeight="medium">
                Network
              </Text>
              <NetworkSelector
                selectedNetwork={selectedNetwork}
                onNetworkChange={setNetwork}
                size="sm"
                variant="compact"
              />
            </Box>
            
            <VStack spacing={4} textAlign="center" mb={6}>
              <Heading as="h2" size="xl" color="#ffffff">
                {isFirstVault ? '🎉 Create Your First Vault!' : 'Create New Vault'}
              </Heading>
              {isFirstVault && (
                <Alert status="success" bg="rgba(56, 161, 105, 0.1)" borderColor="green.400" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Welcome to Secure Savings! 🚀</AlertTitle>
                    <AlertDescription>
                      Great job creating your wallet! Now let's set up your first crypto vault to start saving with purpose. 
                      Choose your savings goal and watch your funds grow securely!
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
            <Stepper index={Number(step)} colorScheme="purple" size="md" mb={6}>
              {steps.map((s, i) => (
                <Step key={i}>
                  <StepIndicator bg={Number(step) === i ? 'purple.500' : '#4a5568'} borderColor={Number(step) === i ? 'purple.500' : '#4a5568'}>
                    {stepIcons[i]}
                  </StepIndicator>
                  <Box flexShrink={0}>
                    <StepTitle color={Number(step) === i ? '#ffffff' : '#a0a0a0'}>{s.title}</StepTitle>
                    <StepDescription color={Number(step) === i ? '#ffffff' : '#a0a0a0'} fontWeight={Number(step) === i ? 'semibold' : 'normal'}>{s.description}</StepDescription>
                  </Box>
                  <StepSeparator />
                </Step>
              ))}
            </Stepper>

            {/* Step Content Area with animation */}
            <Box flexGrow={1} minH="280px" position="relative" zIndex={1}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Select Wallet */}
                {Number(step) === 0 && (
                  <FormControl id="wallet" isInvalid={!!error && error.includes('wallet')}> 
                    <FormLabel fontSize="md" fontWeight="bold" color="#e6e6e6">
                      Select Wallet
                      <Tooltip label="Choose the wallet to use for this vault." hasArrow><InfoOutlineIcon ml={2} color="#a0a0a0" /></Tooltip>
                    </FormLabel>
                    <Select
                      value={selectedWallet || ''}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                      size="lg"
                      borderColor="#4a5568"
                      _hover={{ borderColor: "#7f5af0" }}
                      _focus={{ borderColor: "#7f5af0", boxShadow: "0 0 0 1px #7f5af0" }}
                      placeholder="Select a wallet"
                      _placeholder={{ color: '#cccccc' }}
                      color="#ffffff"
                      bg="#2d3748"
                      sx={{
                        '& option': {
                          color: '#ffffff',
                          backgroundColor: '#2d3748'
                        }
                      }}
                    >
                      <option value="">Select a wallet</option>
                      {wallets.map((wallet) => {
                        console.log('Rendering wallet option:', wallet);
                        return (
                          <option key={wallet.address} value={wallet.address} style={{ color: '#ffffff', backgroundColor: '#2d3748' }}>
                            {wallet.address} ({selectedNetwork.id}) - Balance: {wallet.balance} {getCurrencyName()}
                          </option>
                        );
                      })}
                    </Select>
                    {(!wallets.length) && (
                      <Text color="red.400" mt={2} fontSize="sm" fontWeight="medium">
                        No wallets found. Please create a wallet first.
                      </Text>
                    )}
                  </FormControl>
                )}

                {/* Step 2: Token Selection */}
                {Number(step) === 1 && (
                  <TokenSelector
                    selectedToken={selectedToken}
                    onTokenSelect={setSelectedToken}
                    userAddress={selectedWallet || undefined}
                  />
                )}

                {/* Step 3: Lock Type */}
                {Number(step) === 2 && (
                  <FormControl id="lock-type">
                    <FormLabel fontSize="md" fontWeight="bold" color="#e6e6e6">
                      Lock Type
                      <Tooltip label="Choose how your vault will unlock." hasArrow><InfoOutlineIcon ml={2} color="#a0a0a0" /></Tooltip>
                    </FormLabel>
                    <HStack spacing={4}>
                      <MotionButton
                        onClick={() => { setIsPriceLock(false); setIsGoalLock(false); }}
                        variant={!isPriceLock && !isGoalLock ? 'solid' : 'outline'}
                        colorScheme="purple"
                        size="lg"
                        flex="1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Time Lock
                      </MotionButton>
                      <MotionButton
                        onClick={() => { setIsPriceLock(true); setIsGoalLock(false); }}
                        variant={isPriceLock ? 'solid' : 'outline'}
                        colorScheme="purple"
                        size="lg"
                        flex="1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Price Lock
                      </MotionButton>
                      <MotionButton
                        onClick={() => { setIsGoalLock(true); setIsPriceLock(false); }}
                        variant={isGoalLock ? 'solid' : 'outline'}
                        colorScheme="purple"
                        size="lg"
                        flex="1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Goal Lock (USD)
                      </MotionButton>
                    </HStack>
                  </FormControl>
                )}

                {/* Step 4: Details */}
                {Number(step) === 3 && (
                  <>
                    <FormControl id="amount" isInvalid={!!error && error.includes('amount')}>
                      <FormLabel fontSize="md" fontWeight="bold" color="gray.800">
                        Initial Deposit ({selectedToken ? selectedToken.symbol : getAssetName()})
                        <Tooltip label={`How much ${selectedToken ? selectedToken.symbol : getAssetName()} to deposit initially.`} hasArrow><InfoOutlineIcon ml={2} color="gray.600" /></Tooltip>
                      </FormLabel>
                      <InputGroup>
                        <ChakraInput
                          type="number"
                          value={amount}
                          onChange={(e) => handleInputChange(e, setAmount)}
                          placeholder={isGoalLock ? `Enter initial deposit in ${selectedToken ? selectedToken.symbol : getAssetName()} (e.g., 0.02)` : `Enter amount in ${selectedToken ? selectedToken.symbol : getAssetName()}`}
                          _placeholder={{ color: 'gray.600' }}
                          color="gray.800"
                          min="0"
                          step="0.001"
                          size="lg"
                          borderColor="gray.300"
                          _hover={{ borderColor: "blue.300" }}
                          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #63B3ED" }}
                        />
                        <InputRightElement width="4.5rem" h="100%">
                          <Text color="gray.600" fontWeight="bold">{selectedToken ? selectedToken.symbol : getAssetName()}</Text>
                        </InputRightElement>
                      </InputGroup>
                      {isGoalLock && usdGoal && getTokenPrice() > 0 && !isNaN(parseFloat(usdGoal)) ? (
                                                  <Text mt={2} fontSize="sm" color="blue.600">
                            💡 For ${usdGoal} goal: deposit ~{(() => {
                              const assetPrice = getTokenPrice();
                              const usd = parseFloat(usdGoal);
                              if (!assetPrice || isNaN(assetPrice) || !usd || isNaN(usd)) return '';
                              const assetAmount = usd / assetPrice;
                              return isNaN(assetAmount) ? '' : assetAmount.toFixed(4);
                            })()} {selectedToken ? selectedToken.symbol : getAssetName()}
                          </Text>
                      ) : null}
                      {error && error.includes('amount') && (
                        <FormErrorMessage>{error}</FormErrorMessage>
                      )}
                    </FormControl>
                    {isGoalLock ? (
                      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <FormControl id="usd-goal" isInvalid={!!error && error.includes('USD goal')}>
                          <FormLabel fontSize="md" fontWeight="bold" color="#e6e6e6">
                            Goal Amount (USD)
                            <Tooltip label="The USD value you want to reach before unlocking." hasArrow><InfoOutlineIcon ml={2} color="#a0a0a0" /></Tooltip>
                          </FormLabel>
                          <InputGroup>
                            <ChakraInput
                              type="number"
                              value={usdGoal}
                              onChange={(e) => handleInputChange(e, setUsdGoal)}
                              placeholder="Enter goal in USD"
                          _placeholder={{ color: '#cccccc' }}
                              color="#ffffff"
                              min="0"
                              step="1"
                              size="lg"
                              borderColor="#4a5568"
                              _hover={{ borderColor: "#7f5af0" }}
                              _focus={{ borderColor: "#7f5af0", boxShadow: "0 0 0 1px #7f5af0" }}
                            />
                            <InputRightElement width="3.5rem" h="100%">
                              <Text color="#a0a0a0" fontWeight="bold">USD</Text>
                            </InputRightElement>
                          </InputGroup>
                          <Text mt={2} fontSize="sm" color="#a0a0a0">
                            Current {selectedToken ? selectedToken.symbol : getAssetName()} price: {getTokenPrice() > 0 ? `$${getTokenPrice().toFixed(2)}` : 'Loading...'}
                          </Text>
                          {error && error.includes('USD goal') && (
                            <FormErrorMessage>{error}</FormErrorMessage>
                          )}
                        </FormControl>
                      </MotionBox>
                    ) : isPriceLock ? (
                      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <FormControl id="target-price" isInvalid={isPriceInvalid}>
                          <FormLabel fontSize="md" fontWeight="bold" color="#e6e6e6">
                            Target Price (USD)
                            <Tooltip label={`The ${selectedToken ? selectedToken.symbol : getAssetName()} price that will unlock your vault.`} hasArrow><InfoOutlineIcon ml={2} color="#a0a0a0" /></Tooltip>
                          </FormLabel>
                          <InputGroup>
                            <ChakraInput
                              type="number"
                              value={targetPrice}
                              onChange={(e) => handleInputChange(e, setTargetPrice)}
                              placeholder="Enter target price in USD"
                          _placeholder={{ color: '#cccccc' }}
                              color="#ffffff"
                              min="0"
                              step="1"
                              size="lg"
                              borderColor="#4a5568"
                              _hover={{ borderColor: "#7f5af0" }}
                              _focus={{ borderColor: "#7f5af0", boxShadow: "0 0 0 1px #7f5af0" }}
                            />
                            <InputRightElement width="3.5rem" h="100%">
                              <Text color="#a0a0a0" fontWeight="bold">USD</Text>
                            </InputRightElement>
                          </InputGroup>
                          <Text mt={2} fontSize="sm" color="#a0a0a0">
                            Current {getAssetName()} price: {(() => {
                              const p = getTokenPrice();
                              return p > 0 ? `$${p.toFixed(2)}` : 'Loading...';
                            })()}
                          </Text>
                          {isPriceInvalid && (
                            <FormErrorMessage>
                              Target price must be greater than the current {getAssetName()} price.
                            </FormErrorMessage>
                          )}
                        </FormControl>
                      </MotionBox>
                    ) : (
                      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <FormControl id="unlock-time" isInvalid={!!error && error.includes('duration')}>
                          <FormLabel fontSize="md" fontWeight="bold" color="#e6e6e6">
                            Unlock Time Duration
                            <Tooltip label="How long to lock your vault for." hasArrow><InfoOutlineIcon ml={2} color="#a0a0a0" /></Tooltip>
                          </FormLabel>
                          <HStack spacing={4} align="flex-end">
                            <FormControl id="unlock-years">
                              <FormLabel fontSize="sm" color="#a0a0a0">Years</FormLabel>
                                                              <NumberInput
                                  value={unlockYears}
                                  onChange={(valueString) => setUnlockYears(valueString)}
                                  min={0}
                                  size="lg"
                                  borderColor="#4a5568"
                                  _hover={{ borderColor: "#7f5af0" }}
                                  _focus={{ borderColor: "#7f5af0", boxShadow: "0 0 0 1px #7f5af0" }}
                                >
                                  <NumberInputField placeholder="0" color="#ffffff" _placeholder={{ color: '#cccccc' }} />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                            <FormControl id="unlock-months">
                              <FormLabel fontSize="sm" color="#a0a0a0">Months</FormLabel>
                              <NumberInput
                                value={unlockMonths}
                                onChange={(valueString) => setUnlockMonths(valueString)}
                                min={0}
                                max={11}
                                size="lg"
                                borderColor="#4a5568"
                                _hover={{ borderColor: "#7f5af0" }}
                                _focus={{ borderColor: "#7f5af0", boxShadow: "0 0 0 1px #7f5af0" }}
                              >
                                <NumberInputField placeholder="0" color="#ffffff" _placeholder={{ color: '#cccccc' }} />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                            <FormControl id="unlock-days">
                              <FormLabel fontSize="sm" color="#a0a0a0">Days</FormLabel>
                              <NumberInput
                                value={unlockDays}
                                onChange={(valueString) => setUnlockDays(valueString)}
                                min={0}
                                max={30}
                                size="lg"
                                borderColor="#4a5568"
                                _hover={{ borderColor: "#7f5af0" }}
                                _focus={{ borderColor: "#7f5af0", boxShadow: "0 0 0 1px #7f5af0" }}
                              >
                                <NumberInputField placeholder="0" color="#ffffff" _placeholder={{ color: '#cccccc' }} />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                          </HStack>
                          
                          {error && error.includes('duration') && (
                            <FormErrorMessage>{error}</FormErrorMessage>
                          )}
                        </FormControl>
                      </MotionBox>
                    )}
                  </>
                )}

                {/* Step 5: Review & Confirm */}
                {Number(step) === 4 && (
                  <Box p={4} bg="rgba(35, 37, 38, 0.9)" borderRadius="md" border="1px solid" borderColor="#4a5568">
                    <Heading as="h3" size="md" mb={4} color="#ffffff">Review Vault Details</Heading>
                    <VStack align="start" spacing={3}>
                      <Text color="#ffffff"><b>Wallet:</b> {truncateAddress(selectedWallet || '')}</Text>
                      <Text color="#ffffff"><b>Token:</b> {selectedToken ? `${selectedToken.symbol} (${selectedToken.name})` : 'Not selected'}</Text>
                      <Text color="#ffffff"><b>Lock Type:</b> {isPriceLock ? 'Price Lock' : isGoalLock ? 'Goal Lock (USD)' : 'Time Lock'}</Text>
                      <Text color="#ffffff"><b>Initial Deposit:</b> {amount} {selectedToken ? selectedToken.symbol : getAssetName()}</Text>
                                              {isPriceLock && <Text color="#ffffff"><b>Target Price:</b> ${targetPrice}</Text>}
                        {isGoalLock && <Text color="#ffffff"><b>Goal Amount:</b> ${usdGoal}</Text>}
                        {!isPriceLock && !isGoalLock && (
                          <Text color="#ffffff"><b>Unlock Duration:</b> {formatDuration(unlockYears, unlockMonths, unlockDays)}</Text>
                        )}
                    </VStack>
                  </Box>
                )}
              </motion.div>
            </Box>

            {/* Navigation Buttons */}
            <HStack justify="space-between" mt={8}>
              <Button onClick={prevStep} isDisabled={Number(step) === 0} color="#ffffff" _hover={{ color: "#e6e6e6" }}>Back</Button>
              {Number(step) < steps.length - 1 ? (
                <Button
                  colorScheme="purple"
                  onClick={nextStep}
                  isDisabled={
                    (Number(step) === 0 && !isWalletStepValid) ||
                    (Number(step) === 1 && !isTokenStepValid) ||
                    (Number(step) === 2 && !isLockTypeStepValid) ||
                    (Number(step) === 3 && (!isDetailsStepValid || isPriceInvalid))
                  }
                >
                  Next
                </Button>
              ) : (
                <MotionButton
                  mt={6}
                  colorScheme="purple"
                  size="lg"
                  onClick={onConfirmOpen}
                  isLoading={isLoading}
                  loadingText="Creating..."
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  shadow="md"
                  _hover={{ shadow: 'lg' }}
                  isDisabled={!selectedWallet || !amount || (!isPriceLock && !isGoalLock && !(parseInt(unlockYears || '0') > 0 || parseInt(unlockMonths || '0') > 0 || parseInt(unlockDays || '0') > 0)) || (isPriceLock && !targetPrice) || (isGoalLock && !usdGoal)}
                >
                  Create Vault
                </MotionButton>
              )}
            </HStack>
          </VStack>
        </Box>

        {/* Live Preview Card */}
        <Box flex="1" minW={{ base: '100%', md: '320px' }} mt={{ base: 8, md: 0 }} position="relative" zIndex={1}>
                            <Box p={6} bg="rgba(35, 37, 38, 0.9)" borderRadius="xl" boxShadow="md" border="1px solid" borderColor="#4a5568" position="relative">
                          <Heading as="h4" size="md" mb={4} color="#ffffff">Live Vault Preview</Heading>
            <VStack align="start" spacing={3}>
                              <Text color="#ffffff"><b>Wallet:</b> {selectedWallet ? truncateAddress(selectedWallet) : <span style={{ color: '#a0a0a0' }}>Not selected</span>}</Text>
                <Text color="#ffffff"><b>Token:</b> {selectedToken ? `${selectedToken.symbol} (${selectedToken.name})` : <span style={{ color: '#a0a0a0' }}>Not selected</span>}</Text>
                <Text color="#ffffff"><b>Lock Type:</b> {isPriceLock ? 'Price Lock' : isGoalLock ? 'Goal Lock (USD)' : 'Time Lock'}</Text>
                <Text color="#ffffff"><b>Initial Deposit:</b> {amount ? `${amount} ${selectedToken ? selectedToken.symbol : getAssetName()}` : <span style={{ color: '#a0a0a0' }}>Not set</span>}</Text>
                {isPriceLock && <Text color="#ffffff"><b>Target Price:</b> {targetPrice ? `$${targetPrice}` : <span style={{ color: '#a0a0a0' }}>Not set</span>}</Text>}
                {isGoalLock && <Text color="#ffffff"><b>Goal Amount:</b> {usdGoal ? `$${usdGoal}` : <span style={{ color: '#a0a0a0' }}>Not set</span>}</Text>}
                {!isPriceLock && !isGoalLock && (
                  <Text color="#ffffff"><b>Unlock Duration:</b> {formatDuration(unlockYears, unlockMonths, unlockDays)}</Text>
                )}
            </VStack>
          </Box>
        </Box>
      </Stack>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="2xl" fontWeight="bold" color="purple.700">Confirm Vault Creation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
                            <Text mb={4} color="#ffffff">Please review the details of your vault before creation.</Text>
                          <VStack spacing={4} p={4} bg="rgba(35, 37, 38, 0.9)" borderRadius="md" align="stretch">
              <HStack justify="space-between">
                                  <Text fontWeight="bold" color="#ffffff">Wallet:</Text>
                  <Text isTruncated maxW="250px" color="#ffffff">{truncateAddress(selectedWallet || '')}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                                  <Text fontWeight="bold" color="#ffffff">Token:</Text>
                  <Text color="#ffffff">{selectedToken ? `${selectedToken.symbol} (${selectedToken.name})` : getAssetName()}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                                  <Text fontWeight="bold" color="#ffffff">Lock Type:</Text>
                  <Text color="#ffffff">{isPriceLock ? 'Price Lock' : isGoalLock ? 'Goal Lock (USD)' : 'Time Lock'}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                                  <Text fontWeight="bold" color="#ffffff">Initial Deposit:</Text>
                  <Text color="#ffffff">{amount} {selectedToken ? selectedToken.symbol : getAssetName()}</Text>
              </HStack>
              {isPriceLock && (
                <>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color="#ffffff">Target Price:</Text>
                    <Text color="#ffffff">${targetPrice}</Text>
                  </HStack>
                </>
              )}
              {isGoalLock && (
                <>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color="#ffffff">Goal Amount:</Text>
                    <Text color="#ffffff">${usdGoal}</Text>
                  </HStack>
                </>
              )}
              {!isPriceLock && !isGoalLock && (
                <>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color="#ffffff">Unlock Duration:</Text>
                    <Text color="#ffffff">{formatDuration(unlockYears, unlockMonths, unlockDays)}</Text>
                  </HStack>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfirmClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCreateVault}
              isLoading={isLoading}
              loadingText={amount && parseFloat(amount) > 0 ? "Creating & Depositing..." : "Creating..."}
            >
              Confirm & Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Deposit Prompt Modal */}
      {newVaultAddress && vaultCreationData && (
        <DepositPromptModal
          isOpen={isDepositOpen}
          onClose={onDepositClose}
          vaultAddress={newVaultAddress}
          vaultType={vaultCreationData.vaultType}
          goalAmount={vaultCreationData.goalAmount}
          unlockTime={vaultCreationData.unlockTime}
          targetPrice={vaultCreationData.targetPrice}
          initialDepositAmount={vaultCreationData.initialDepositAmount}
          onDepositComplete={handleDepositComplete}
        />
      )}
    </Box>
  )
} 