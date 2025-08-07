import React, { useState, useContext } from 'react';
import {
  Box,
  VStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  HStack,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FaEthereum, FaSearch, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { ethers } from 'ethers';
import { NetworkContext } from './DAppLayout';

// ERC-20 Token ABI (minimal for basic info)
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
];

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance?: string;
  isValid: boolean;
}

interface TokenSelectorProps {
  selectedToken: TokenInfo | null;
  onTokenSelect: (token: TokenInfo) => void;
  userAddress?: string;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  userAddress,
}) => {
  const { network: selectedNetwork } = useContext(NetworkContext);
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

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

  // Native token option
  const nativeToken: TokenInfo = {
    address: '0x0000000000000000000000000000000000000000',
    name: selectedNetwork.name,
    symbol: getAssetName(),
    decimals: 18,
    isValid: true,
  };

  const validateAddress = (address: string): boolean => {
    return ethers.isAddress(address);
  };

  const fetchTokenInfo = async (address: string): Promise<TokenInfo | null> => {
    try {
      const provider = new ethers.JsonRpcProvider(selectedNetwork.rpc[0]);
      const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      let balance = '0';
      if (userAddress) {
        try {
          const balanceWei = await tokenContract.balanceOf(userAddress);
          balance = ethers.formatUnits(balanceWei, decimals);
        } catch (error) {
          console.warn('Could not fetch user balance:', error);
        }
      }

      return {
        address,
        name,
        symbol,
        decimals,
        balance,
        isValid: true,
      };
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  };

  const handleTokenAddressChange = (address: string) => {
    setTokenAddress(address);
    setError(null);
    setTokenInfo(null);

    if (address.trim() === '') {
      return;
    }

    if (!validateAddress(address)) {
      setError('Invalid token address format');
      return;
    }

    setIsLoading(true);
    fetchTokenInfo(address)
      .then((info) => {
        if (info) {
          setTokenInfo(info);
        } else {
          setError('Could not fetch token information. Please check the address.');
        }
      })
      .catch((error) => {
        setError('Error fetching token information');
        console.error('Token fetch error:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleNativeTokenSelect = () => {
    onTokenSelect(nativeToken);
    toast({
      title: 'Native Token Selected',
      description: `You selected ${getAssetName()} (native token)`,
      status: 'success',
      duration: 3000,
    });
  };

  const handleCustomTokenSelect = () => {
    if (tokenInfo) {
      onTokenSelect(tokenInfo);
      toast({
        title: 'Custom Token Selected',
        description: `You selected ${tokenInfo.symbol} (${tokenInfo.name})`,
        status: 'success',
        duration: 3000,
      });
    }
  };

  return (
    <VStack spacing={6} align="stretch" position="relative" zIndex={1}>
      <Box position="relative">
        <Text fontSize="lg" fontWeight="bold" mb={4} color="#ffffff">
          Select Token Type
        </Text>
        
        {/* Native Token Option */}
        <Box
          p={4}
          border="2px solid"
                     borderColor={selectedToken?.address === nativeToken.address ? 'purple.500' : '#4a5568'}
          borderRadius="lg"
          cursor="pointer"
          onClick={handleNativeTokenSelect}
                     _hover={{ borderColor: 'purple.300', bg: 'rgba(127, 90, 240, 0.1)' }}
          transition="all 0.2s"
        >
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Icon as={FaEthereum} color="purple.500" boxSize={5} />
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">{getAssetName()}</Text>
                <Text fontSize="sm" color="#a0a0a0">
                  Native {selectedNetwork.name} token
                </Text>
              </VStack>
            </HStack>
            {selectedToken?.address === nativeToken.address && (
              <Icon as={FaCheck} color="green.500" boxSize={5} />
            )}
          </HStack>
        </Box>

        <Text fontSize="md" fontWeight="semibold" mt={6} mb={3} color="#ffffff">
          Or Use Custom ERC-20 Token
        </Text>

        {/* Custom Token Input */}
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="#a0a0a0" />
          </InputLeftElement>
          <Input
            value={tokenAddress}
            onChange={(e) => handleTokenAddressChange(e.target.value)}
            placeholder="0x..."
            isInvalid={!!error}
            pr={isLoading ? '3rem' : '4.5rem'}
            _placeholder={{ color: '#cccccc' }}
          />
        </InputGroup>
        <Text fontSize="sm" color="#a0a0a0" mt={2}>
          Enter the contract address of any ERC-20 token
        </Text>

        {/* Error Display */}
        {error && (
          <Box
            mt={4}
            p={3}
            bg="red.50"
            border="1px solid"
            borderColor="red.100"
            borderRadius="md"
            color="red.800"
            fontSize="sm"
          >
            <Icon as={FaExclamationTriangle} mr={2} />
            {error}
          </Box>
        )}

        {/* Token Info Display */}
        {tokenInfo && !error && (
          <Box
            p={4}
            border="2px solid"
                         borderColor={selectedToken?.address === tokenInfo.address ? 'purple.500' : '#4a5568'}
            borderRadius="lg"
            cursor="pointer"
            onClick={handleCustomTokenSelect}
            _hover={{ borderColor: 'purple.300', bg: 'rgba(127, 90, 240, 0.1)' }}
            transition="all 0.2s"
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={2}>
                <HStack spacing={2}>
                  <Icon as={FaEthereum} color="blue.500" boxSize={5} />
                  <Text fontWeight="bold">{tokenInfo.symbol}</Text>
                  <Badge colorScheme="blue" variant="subtle">
                    ERC-20
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="#a0a0a0">
                  {tokenInfo.name}
                </Text>
                <Text fontSize="xs" color="#a0a0a0" fontFamily="mono">
                  {tokenInfo.address}
                </Text>
                {userAddress && tokenInfo.balance && (
                  <Text fontSize="sm" color="green.600">
                    Your Balance: {parseFloat(tokenInfo.balance).toFixed(4)} {tokenInfo.symbol}
                  </Text>
                )}
              </VStack>
              {selectedToken?.address === tokenInfo.address && (
                <Icon as={FaCheck} color="green.500" boxSize={5} />
              )}
            </HStack>
          </Box>
        )}

        {/* Warning for Custom Tokens */}
        {tokenInfo && (
          <Box
            mt={4}
            p={3}
            bg="yellow.50"
            border="1px solid"
            borderColor="yellow.100"
            borderRadius="md"
            color="yellow.800"
            fontSize="sm"
          >
            <Icon as={FaExclamationTriangle} mr={2} />
            Make sure this is the correct token address. Verify the token symbol and name match your expectations.
          </Box>
        )}
      </Box>
    </VStack>
  );
}; 