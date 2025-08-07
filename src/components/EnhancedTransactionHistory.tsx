import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Center,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Tooltip,
  IconButton,
  Icon,
  useColorModeValue,
  useToast,
  Flex,
  Spacer,
  Heading,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import { 
  FaExchangeAlt, 
  FaSearch, 
  FaCopy, 
  FaExternalLinkAlt, 
  FaEyeSlash, 
  FaEye, 
  FaHistory,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown,
  FaExchangeAlt as FaSwap,
  FaLock,
  FaUnlock,
  FaNetworkWired,
  FaRedo as FaRefresh,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { EnhancedSkeletonCard } from './EnhancedSkeletonCard';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { SUPPORTED_NETWORKS } from '../constants/networks.js';

const MotionCard = motion.create(Card);

interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'contract' | 'unknown';
  amount: string;
  amountUsd?: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  from: string;
  to: string;
  gasUsed?: string;
  gasPrice?: string;
  gasCost?: string;
  blockNumber?: number;
  confirmations?: number;
  network: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  contractAddress?: string;
  methodName?: string;
  isInternal?: boolean;
  value?: string;
  nonce?: number;
  input?: string;
}

interface TransactionHistoryProps {
  walletAddress: string;
  network: string;
}

interface TransactionStats {
  total: number;
  confirmed: number;
  pending: number;
  failed: number;
  totalVolume: string;
  totalGasUsed: string;
  averageGasPrice: string;
  mostActiveDay: string;
  largestTransaction: Transaction | null;
}

export const EnhancedTransactionHistory = ({ walletAddress, network }: TransactionHistoryProps) => {
  const mobileOpt = useMobileOptimization();
  const toast = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    failed: 0,
    totalVolume: '0',
    totalGasUsed: '0',
    averageGasPrice: '0',
    mostActiveDay: '',
    largestTransaction: null,
  });

  const bgColor = useColorModeValue('#181a20', '#181a20');
  const cardBg = useColorModeValue('rgba(35, 37, 38, 0.9)', 'rgba(35, 37, 38, 0.9)');
  const borderColor = useColorModeValue('rgba(65, 67, 69, 0.5)', 'rgba(65, 67, 69, 0.5)');
  const textColor = useColorModeValue('#fff', '#fff');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.400');

  // Calculate transaction statistics
  const calculateStats = useCallback((txs: Transaction[]) => {
    const confirmed = txs.filter(tx => tx.status === 'confirmed').length;
    const pending = txs.filter(tx => tx.status === 'pending').length;
    const failed = txs.filter(tx => tx.status === 'failed').length;
    
    const totalVolume = txs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toFixed(4);
    const totalGasUsed = txs.reduce((sum, tx) => sum + (parseFloat(tx.gasUsed || '0')), 0).toString();
    const averageGasPrice = txs.length > 0 
      ? (txs.reduce((sum, tx) => sum + parseFloat(tx.gasPrice || '0'), 0) / txs.length).toFixed(2)
      : '0';

    // Find most active day
    const dayCounts: Record<string, number> = {};
    txs.forEach(tx => {
      const day = new Date(tx.timestamp).toDateString();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Find largest transaction
    const largestTransaction = txs.reduce((largest, tx) => 
      parseFloat(tx.amount) > parseFloat(largest.amount) ? tx : largest, txs[0] || null
    );

    setStats({
      total: txs.length,
      confirmed,
      pending,
      failed,
      totalVolume,
      totalGasUsed,
      averageGasPrice,
      mostActiveDay,
      largestTransaction,
    });
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Find the network configuration
      const networkConfig = SUPPORTED_NETWORKS.find((n: any) => n.id === network);
      if (!networkConfig) {
        throw new Error('Network not supported');
      }

      console.log(`Fetching transactions for ${walletAddress} on ${networkConfig.name}`);

      // Try to fetch from blockchain API first (more efficient)
      let transactions: Transaction[] = [];
      
      try {
        // Use Etherscan/BSCScan API for better performance
        const apiKey = network === 'sepolia' ? 'YourEtherscanApiKey' : 'YourBscScanApiKey';
        const baseUrl = network === 'sepolia' 
          ? 'https://api-sepolia.etherscan.io/api'
          : 'https://api-testnet.bscscan.com/api';
        
        const response = await fetch(
          `${baseUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === '1' && data.result) {
            transactions = data.result.map((tx: any) => ({
              hash: tx.hash,
              type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive',
              amount: ethers.formatEther(tx.value),
              amountUsd: (parseFloat(ethers.formatEther(tx.value)) * 1700).toFixed(2),
              timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
              status: tx.isError === '1' ? 'failed' : 'confirmed',
              from: tx.from,
              to: tx.to,
              gasUsed: tx.gasUsed,
              gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei'),
              gasCost: ethers.formatEther(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)),
              blockNumber: parseInt(tx.blockNumber),
              confirmations: parseInt(tx.confirmations),
              network,
              tokenSymbol: 'ETH',
              value: tx.value,
              nonce: parseInt(tx.nonce),
              input: tx.input,
              contractAddress: tx.to,
              methodName: tx.input !== '0x' ? 'Contract Interaction' : undefined,
            }));
          }
        }
      } catch (apiError) {
        console.warn('API fetch failed, falling back to RPC:', apiError);
      }

      // If API failed or no transactions found, try RPC method
      if (transactions.length === 0) {
        // Create provider
        const provider = new ethers.JsonRpcProvider(networkConfig.rpc[0]);
        
        // Get current block number
        const currentBlock = await provider.getBlockNumber();
        
        // Fetch transactions from last 100 blocks (reduced for performance)
        const fromBlock = Math.max(0, currentBlock - 100);
        const toBlock = currentBlock;

        console.log(`Fetching transactions from block ${fromBlock} to ${toBlock} via RPC`);

        // Get transaction history using ethers.js - use a different approach
        const history: any[] = [];
        
        // Fetch blocks and look for transactions involving the wallet
        for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
          try {
            const block = await provider.getBlock(blockNum, true);
            if (block && block.transactions) {
              const relevantTxs = block.transactions.filter((tx: any) => 
                tx.from === walletAddress || tx.to === walletAddress
              );
              history.push(...relevantTxs);
            }
          } catch (error) {
            console.warn(`Failed to fetch block ${blockNum}:`, error);
            continue;
          }
        }
        
        const processedTxs: Transaction[] = await Promise.all(
          history.map(async (tx: any) => {
            try {
              const receipt = await provider.getTransactionReceipt(tx.hash);
              const block = tx.blockNumber ? await provider.getBlock(tx.blockNumber) : null;
              
              // Determine transaction type
              let type: Transaction['type'] = 'unknown';
              if (tx.to === walletAddress) {
                type = 'receive';
              } else if (tx.from === walletAddress) {
                if (tx.to && tx.to !== ethers.ZeroAddress) {
                  type = 'send';
                } else {
                  type = 'contract';
                }
              }

              // Calculate gas cost
              const gasCost = receipt ? ethers.formatEther(receipt.gasUsed * tx.gasPrice!) : '0';

              // Get USD value (approximate)
              const ethAmount = ethers.formatEther(tx.value);
              const amountUsd = (parseFloat(ethAmount) * 1700).toFixed(2); // Approximate ETH price

              return {
                hash: tx.hash,
                type,
                amount: ethAmount,
                amountUsd,
                timestamp: block?.timestamp ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString(),
                status: receipt ? 'confirmed' : 'pending',
                from: tx.from,
                to: tx.to || '',
                gasUsed: receipt?.gasUsed.toString(),
                gasPrice: ethers.formatUnits(tx.gasPrice!, 'gwei'),
                gasCost,
                blockNumber: tx.blockNumber,
                confirmations: tx.blockNumber ? currentBlock - tx.blockNumber + 1 : 0,
                network,
                tokenSymbol: 'ETH',
                value: tx.value.toString(),
                nonce: tx.nonce,
                input: tx.data,
                contractAddress: tx.to,
                methodName: tx.data !== '0x' ? 'Contract Interaction' : undefined,
              };
            } catch (error) {
              console.error(`Error processing transaction ${tx.hash}:`, error);
              // Return a basic transaction object if processing fails
              return {
                hash: tx.hash,
                type: 'unknown',
                amount: ethers.formatEther(tx.value),
                timestamp: new Date().toISOString(),
                status: 'pending',
                from: tx.from,
                to: tx.to || '',
                network,
                tokenSymbol: 'ETH',
                value: tx.value.toString(),
                nonce: tx.nonce,
                input: tx.data,
              };
            }
          })
        );

        // Filter out failed transactions and sort by timestamp
        transactions = processedTxs
          .filter(tx => tx !== null)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }

      console.log(`Found ${transactions.length} transactions for ${walletAddress}`);

      // If no real transactions found, show a message but don't use mock data
      if (transactions.length === 0) {
        toast({
          title: 'No Transactions Found',
          description: 'This wallet has no recent transaction history.',
          status: 'info',
          duration: 5000,
        });
      }

      setTransactions(transactions);
      calculateStats(transactions);
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions from blockchain.',
        status: 'error',
        duration: 5000,
      });
      
      // Set empty transactions instead of mock data
      setTransactions([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, network, toast, calculateStats]);

  // Refresh transactions
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Transaction history has been updated.',
      status: 'success',
      duration: 3000,
    });
  }, [fetchTransactions, toast]);

  // Get filtered transactions
  const getFilteredTransactions = useCallback(() => {
    return transactions.filter(tx => {
      const matchesFilter = filter === 'all' || tx.type === filter;
      const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tx.amount.includes(searchTerm) ||
                           formatAddress(tx.from).toLowerCase().includes(searchTerm.toLowerCase()) ||
                           formatAddress(tx.to).toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (tx.methodName && tx.methodName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, searchTerm]);

  const filteredTransactions = getFilteredTransactions();

  // Load transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchTransactions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTransactions, loading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'send': return 'red';
      case 'receive': return 'green';
      case 'swap': return 'purple';
      case 'stake': return 'blue';
      case 'unstake': return 'orange';
      case 'contract': return 'cyan';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send': return FaArrowUp;
      case 'receive': return FaArrowDown;
      case 'swap': return FaSwap;
      case 'stake': return FaLock;
      case 'unstake': return FaUnlock;
      case 'contract': return FaNetworkWired;
      default: return FaExchangeAlt;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatGasCost = (gasCost: string) => {
    const cost = parseFloat(gasCost);
    if (cost < 0.001) {
      return `${(cost * 1000).toFixed(3)} mETH`;
    } else if (cost < 1) {
      return `${cost.toFixed(6)} ETH`;
    } else {
      return `${cost.toFixed(4)} ETH`;
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Center>
          <VStack spacing={mobileOpt.spacing} align="stretch">
            {[1, 2, 3, 4, 5].map((i) => (
              <EnhancedSkeletonCard 
                key={i} 
                variant="transaction" 
                index={i - 1} 
                height={mobileOpt.isMobile ? "80px" : "100px"}
              />
            ))}
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header with Actions */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }}>
          <Box>
            <Heading size="lg" color={textColor} mb={2}>Transaction History</Heading>
            <Text color={mutedTextColor}>
              {stats.total} transactions for {formatAddress(walletAddress)}
            </Text>
          </Box>
          
          <HStack spacing={3}>
            <Button
              leftIcon={<FaRefresh />}
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={refreshing}
              loadingText="Refreshing"
              borderColor={borderColor}
              color={textColor}
              _hover={{ bg: 'rgba(127, 90, 240, 0.1)' }}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Enhanced Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
            <CardBody p={4}>
              <Stat>
                <StatLabel color={mutedTextColor}>Total Transactions</StatLabel>
                <StatNumber color={textColor} fontSize="xl">{stats.total}</StatNumber>
                <StatHelpText color={mutedTextColor}>
                  <StatArrow type="increase" />
                  23.36%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
            <CardBody p={4}>
              <Stat>
                <StatLabel color={mutedTextColor}>Total Volume</StatLabel>
                <StatNumber color="green.400" fontSize="xl">{stats.totalVolume} ETH</StatNumber>
                <StatHelpText color={mutedTextColor}>
                  ≈ ${(parseFloat(stats.totalVolume) * 1700).toFixed(2)} USD
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
            <CardBody p={4}>
              <Stat>
                <StatLabel color={mutedTextColor}>Gas Used</StatLabel>
                <StatNumber color="blue.400" fontSize="xl">{parseInt(stats.totalGasUsed).toLocaleString()}</StatNumber>
                <StatHelpText color={mutedTextColor}>
                  Avg: {stats.averageGasPrice} Gwei
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
            <CardBody p={4}>
              <Stat>
                <StatLabel color={mutedTextColor}>Success Rate</StatLabel>
                <StatNumber color="green.400" fontSize="xl">
                  {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
                </StatNumber>
                <StatHelpText color={mutedTextColor}>
                  {stats.confirmed} confirmed
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
          <CardBody p={6}>
            <HStack spacing={4} mb={4} wrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <Icon as={FaSearch} color={mutedTextColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="rgba(0,0,0,0.2)"
                  borderColor={borderColor}
                  color={textColor}
                  _placeholder={{ color: mutedTextColor }}
                />
              </InputGroup>
              
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                maxW="200px"
                bg="rgba(0,0,0,0.2)"
                borderColor={borderColor}
                color={textColor}
              >
                <option value="all" style={{ background: '#181a20', color: '#fff' }}>All Types</option>
                <option value="send" style={{ background: '#181a20', color: '#fff' }}>Send</option>
                <option value="receive" style={{ background: '#181a20', color: '#fff' }}>Receive</option>
                <option value="swap" style={{ background: '#181a20', color: '#fff' }}>Swap</option>
                <option value="stake" style={{ background: '#181a20', color: '#fff' }}>Stake</option>
                <option value="unstake" style={{ background: '#181a20', color: '#fff' }}>Unstake</option>
                <option value="contract" style={{ background: '#181a20', color: '#fff' }}>Contract</option>
              </Select>

              <Spacer />
              
              <Text fontSize="sm" color={mutedTextColor}>
                {filteredTransactions.length} of {transactions.length} transactions
              </Text>
            </HStack>
          </CardBody>
        </Card>

        {/* Transactions */}
        <VStack spacing={4} align="stretch">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, index) => (
              <MotionCard
                key={tx.hash}
                bg={cardBg}
                borderColor={borderColor}
                borderRadius="xl"
                overflow="hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.01, boxShadow: 'xl' }}
              >
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    {/* Header */}
                    <HStack justify="space-between" align="start">
                      <HStack spacing={3}>
                        <Box
                          p={2}
                          borderRadius="lg"
                          bg={`${getTypeColor(tx.type)}.500`}
                          color="white"
                        >
                          <Icon as={getTypeIcon(tx.type)} boxSize={4} />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" color={textColor} textTransform="capitalize">
                            {tx.type}
                            {tx.methodName && ` - ${tx.methodName}`}
                          </Text>
                          <Text fontSize="sm" color={mutedTextColor}>
                            {formatDate(tx.timestamp)}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <VStack align="end" spacing={1}>
                        <Badge colorScheme={getStatusColor(tx.status)} variant="solid" borderRadius="full">
                          {tx.status === 'confirmed' && <Icon as={FaCheckCircle} mr={1} />}
                          {tx.status === 'pending' && <Icon as={FaClock} mr={1} />}
                          {tx.status === 'failed' && <Icon as={FaTimesCircle} mr={1} />}
                          {tx.status}
                        </Badge>
                        <HStack spacing={2}>
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            {tx.amount} {tx.tokenSymbol}
                          </Text>
                          {tx.amountUsd && (
                            <Text fontSize="sm" color={mutedTextColor}>
                              (${tx.amountUsd})
                            </Text>
                          )}
                        </HStack>
                        {tx.gasCost && (
                          <Text fontSize="xs" color={mutedTextColor}>
                            Gas: {formatGasCost(tx.gasCost)}
                          </Text>
                        )}
                      </VStack>
                    </HStack>

                    {/* Transaction Hash */}
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color={mutedTextColor}>Transaction Hash:</Text>
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontFamily="mono" color={textColor}>
                          {formatAddress(tx.hash)}
                        </Text>
                        <Tooltip hasArrow label="Copy Hash">
                          <IconButton
                            aria-label="Copy transaction hash"
                            icon={<FaCopy />}
                            size="xs"
                            variant="ghost"
                            color={textColor}
                            onClick={() => {
                              navigator.clipboard.writeText(tx.hash);
                              toast({
                                title: 'Copied',
                                description: 'Transaction hash copied to clipboard',
                                status: 'success',
                                duration: 2000,
                              });
                            }}
                          />
                        </Tooltip>
                        <Tooltip hasArrow label="View on Explorer">
                          <IconButton
                            aria-label="View on explorer"
                            icon={<FaExternalLinkAlt />}
                            size="xs"
                            variant="ghost"
                            color={textColor}
                            onClick={() => {
                              const explorerUrl = network === 'sepolia' 
                                ? `https://sepolia.etherscan.io/tx/${tx.hash}`
                                : `https://testnet.bscscan.com/tx/${tx.hash}`;
                              window.open(explorerUrl, '_blank');
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </HStack>

                    {/* Addresses */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color={mutedTextColor} mb={1}>From:</Text>
                        <Text fontSize="sm" fontFamily="mono" color={textColor}>
                          {formatAddress(tx.from)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={mutedTextColor} mb={1}>To:</Text>
                        <Text fontSize="sm" fontFamily="mono" color={textColor}>
                          {formatAddress(tx.to)}
                        </Text>
                      </Box>
                    </SimpleGrid>

                    {/* Details Toggle */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDetails({ ...showDetails, [tx.hash]: !showDetails[tx.hash] })}
                      leftIcon={showDetails[tx.hash] ? <FaEyeSlash /> : <FaEye />}
                      color={mutedTextColor}
                    >
                      {showDetails[tx.hash] ? 'Hide Details' : 'Show Details'}
                    </Button>

                    {/* Expanded Details */}
                    {showDetails[tx.hash] && (
                      <Box p={4} bg="rgba(0,0,0,0.2)" borderRadius="md">
                        <VStack spacing={3} align="stretch">
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Block Number:</Text>
                              <Text fontSize="sm" color={textColor}>{tx.blockNumber?.toLocaleString()}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Confirmations:</Text>
                              <Text fontSize="sm" color={textColor}>{tx.confirmations?.toLocaleString()}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Gas Used:</Text>
                              <Text fontSize="sm" color={textColor}>{parseInt(tx.gasUsed || '0').toLocaleString()}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Gas Price:</Text>
                              <Text fontSize="sm" color={textColor}>{tx.gasPrice} Gwei</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color={mutedTextColor}>Nonce:</Text>
                              <Text fontSize="sm" color={textColor}>{tx.nonce}</Text>
                            </Box>
                            {tx.contractAddress && (
                              <Box>
                                <Text fontSize="sm" color={mutedTextColor}>Contract:</Text>
                                <Text fontSize="sm" fontFamily="mono" color={textColor}>
                                  {formatAddress(tx.contractAddress)}
                                </Text>
                              </Box>
                            )}
                          </SimpleGrid>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </MotionCard>
            ))
          ) : (
            <Card bg={cardBg} borderColor={borderColor} borderRadius="xl">
              <CardBody p={8}>
                <Center>
                  <VStack spacing={4}>
                    <Icon as={FaHistory} color={mutedTextColor} boxSize={12} />
                    <Text color={textColor} fontWeight="bold">No Transactions Found</Text>
                    <Text color={mutedTextColor} textAlign="center">
                      {searchTerm || filter !== 'all' 
                        ? 'No transactions match your current filters.'
                        : 'This wallet has no transaction history yet.'
                      }
                    </Text>
                  </VStack>
                </Center>
              </CardBody>
            </Card>
          )}
        </VStack>
      </VStack>
    </Box>
  );
}; 