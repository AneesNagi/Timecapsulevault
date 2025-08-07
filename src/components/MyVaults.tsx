import { useState, useEffect } from 'react';
import { VaultCard } from './VaultCard';
import { VaultDetailsModal } from './VaultDetailsModal';
import { VaultCustomizationModal } from './VaultCustomizationModal';
import { VaultTimeline } from './VaultTimeline';
import { AutomationStatus } from './AutomationStatus';
import { useVault } from '../hooks/useVault';
import { EnhancedSkeletonCard } from './EnhancedSkeletonCard';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  useColorModeValue,
  Center,
  Heading,
} from '@chakra-ui/react';
import { FaTh, FaWallet, FaLock, FaBoxOpen, FaList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from './EmptyState';

export const MyVaults = () => {
  const navigate = useNavigate();
  const mobileOpt = useMobileOptimization();
  const [hasWallet, setHasWallet] = useState(false);
  const [selectedVault, setSelectedVault] = useState<any | null>(null);
  const [selectedVaultIndex, setSelectedVaultIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoWithdrawingVaults, setAutoWithdrawingVaults] = useState<Set<string>>(new Set());
  const [customizationVault, setCustomizationVault] = useState<string | null>(null);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  const bgColor = useColorModeValue('var(--bg-primary)', 'var(--bg-primary)');
  const textColor = useColorModeValue('var(--text-primary)', 'var(--text-primary)');
  const mutedTextColor = useColorModeValue('var(--text-secondary)', 'var(--text-secondary)');

  // Check if user has any wallets
  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const wallets = JSON.parse(savedWallets);
      setHasWallet(wallets.length > 0);
    } else {
      setHasWallet(false);
    }
  }, []);

  // Get vault data
  const { vaults, isLoading } = useVault();
  const errorToShow = null; // No error state exposed by useVault

  // Default network for automation status (BSC testnet)
  const defaultNetwork = {
    name: 'BSC Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545'
  };

  // Listen for auto-withdrawal events
  useEffect(() => {
    const handleAutoWithdrawalStart = (vaultAddress: string) => {
      setAutoWithdrawingVaults(prev => new Set([...prev, vaultAddress]));
    };

    const handleAutoWithdrawalComplete = (vaultAddress: string) => {
      setAutoWithdrawingVaults(prev => {
        const newSet = new Set(prev);
        newSet.delete(vaultAddress);
        return newSet;
      });
    };

    // Listen for console messages to detect auto-withdrawal
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog.apply(console, args);
      
      const message = args.join(' ');
      if (message.includes('Attempting auto-withdrawal from vault')) {
        const match = message.match(/vault (0x[a-fA-F0-9]+)/);
        if (match) {
          handleAutoWithdrawalStart(match[1]);
        }
      } else if (message.includes('Auto-withdrawal successful for vault') || message.includes('AUTO-WITHDRAWAL SUCCESSFUL')) {
        const match = message.match(/vault (0x[a-fA-F0-9]+)/);
        if (match) {
          handleAutoWithdrawalComplete(match[1]);
        }
      }
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const handleOpenModal = (vault: any, index: number) => {
    setSelectedVault(vault);
    setSelectedVaultIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = (didWithdraw = false) => {
    setIsModalOpen(false);
    setSelectedVault(null);
    setSelectedVaultIndex(null);
    // Refresh vaults if withdrawal occurred
    if (didWithdraw) {
      // Force re-fetch of vaults
      window.location.reload();
    }
  };

  const handleOpenCustomization = (vaultAddress: string) => {
    setCustomizationVault(vaultAddress);
    setIsCustomizationModalOpen(true);
  };

  const handleCloseCustomization = () => {
    setIsCustomizationModalOpen(false);
    setCustomizationVault(null);
    // Force re-fetch of vaults
    window.location.reload();
  };

  if (!hasWallet) {
    return (
      <EmptyState
        icon={FaWallet}
        title="No Wallet Found"
        description="You need to create or import a wallet first to start managing your crypto vaults and securely store your funds."
        primaryAction={{
          label: "Create Wallet",
          onClick: () => navigate('/wallet'),
          colorScheme: "blue"
        }}
        secondaryAction={{
          label: "Learn More",
          onClick: () => navigate('/')
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="white" mb={4}>
          My Vaults
        </Heading>
        <SimpleGrid 
          columns={{base: 1, md: 2, lg: 3}} 
          spacing={mobileOpt.spacing} 
          p={mobileOpt.padding}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <EnhancedSkeletonCard 
              key={i} 
              variant="vault" 
              index={i - 1} 
              height={mobileOpt.isMobile ? "220px" : "240px"}
            />
          ))}
        </SimpleGrid>
      </VStack>
    );
  }

  if (errorToShow) {
    return (
      <Center py={20} flexDirection="column">
        <Box mb={4}><FaBoxOpen size="3em" color="red.400" /></Box>
        <Text fontSize="xl" color="red.500" textAlign="center">
          Error loading vaults: {errorToShow}
        </Text>
        <Text fontSize="md" color="gray.500" mt={2}>
          Please try refreshing the page or connecting a different network.
        </Text>
      </Center>
    );
  }

  if (!vaults || vaults.length === 0) {
    return (
      <EmptyState
        icon={FaLock}
        title="No Vaults Yet"
        description="Create your first crypto vault to securely lock away your funds until a specific time, price target, or savings goal is reached."
        primaryAction={{
          label: "Create Vault",
          onClick: () => navigate('/create-vault'),
          colorScheme: "purple"
        }}
        secondaryAction={{
          label: "Back to Dashboard",
          onClick: () => navigate('/')
        }}
      />
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header with View Toggle */}
        <Box px={6}>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading as="h2" size="xl" color={textColor} fontWeight="extrabold" letterSpacing="wide">
              My Vaults
            </Heading>
            
            {/* View Toggle */}
            <HStack spacing={2}>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'solid' : 'outline'}
                colorScheme="purple"
                leftIcon={<FaTh />}
                onClick={() => setViewMode('grid')}
                borderRadius="lg"
              >
                Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'timeline' ? 'solid' : 'outline'}
                colorScheme="purple"
                leftIcon={<FaList />}
                onClick={() => setViewMode('timeline')}
                borderRadius="lg"
              >
                Timeline
              </Button>
            </HStack>
          </HStack>
          
          <Text color={mutedTextColor}>
            {vaults.length} vault{vaults.length !== 1 ? 's' : ''} • {viewMode === 'grid' ? 'Grid view' : 'Timeline view'}
          </Text>
        </Box>

        {/* Automation Status */}
        <Box px={6}>
          <AutomationStatus 
            isConnected={hasWallet} 
            selectedNetwork={defaultNetwork}
          />
        </Box>

        {/* Vault Content */}
        {viewMode === 'grid' ? (
          <SimpleGrid 
            columns={{ base: 1, md: 2, lg: 3 }} 
            spacing={6} 
            px={6}
            minChildWidth={{ base: "100%", md: "300px" }}
          >
            {vaults.map((vault, index: number) => {
              return (
                <VaultCard
                  key={vault.address}
                  vault={vault.address as `0x${string}`}
                  index={index}
                  onClick={() => handleOpenModal(vault, index)}
                  onRefresh={() => window.location.reload()}
                  onCustomize={() => handleOpenCustomization(vault.address)}
                  balance={vault.balance}
                  isTimeLocked={vault.isTimeLocked}
                  isPriceLocked={vault.isPriceLocked}
                  isGoalLocked={vault.isGoalLocked}
                  unlockTime={vault.unlockTime}
                  targetPrice={vault.targetPrice}
                  goalAmount={vault.goalAmount}
                  currentAmount={vault.currentAmount}
                  progressPercentage={vault.progressPercentage}
                  currentPrice={Number(vault.currentPrice) / 1e8}
                  isLocked={vault.isLocked}
                  isAutoWithdrawing={autoWithdrawingVaults.has(vault.address)}
                />
              );
            })}
          </SimpleGrid>
        ) : (
          <VaultTimeline 
            vaults={vaults.map(vault => ({
              id: vault.address,
              address: vault.address,
              createdAt: new Date().toISOString(), // Mock data - replace with real vault creation date
              unlockDate: vault.unlockTime ? new Date(Number(vault.unlockTime) * 1000).toISOString() : new Date().toISOString(),
              totalDeposited: vault.currentAmount || '0',
              deposits: vault.currentAmount ? [{
                amount: vault.currentAmount,
                timestamp: new Date().toISOString()
              }] : [],
              balance: vault.balance,
              isLocked: vault.isLocked,
              unlockReason: vault.unlockReason,
            }))}
            onVaultClick={(vault) => {
              const vaultIndex = vaults.findIndex(v => v.address === vault.id);
              if (vaultIndex !== -1) {
                handleOpenModal(vaults[vaultIndex], vaultIndex);
              }
            }}
          />
        )}

        {selectedVault && (
          <VaultDetailsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            vault={selectedVault.address as `0x${string}`}
            vaultIndex={selectedVaultIndex}
            balance={selectedVault.balance}
            isTimeLocked={selectedVault.isTimeLocked}
            isPriceLocked={selectedVault.isPriceLocked}
            isGoalLocked={selectedVault.isGoalLocked}
            unlockTime={selectedVault.unlockTime}
            targetPrice={selectedVault.targetPrice}
            currentPrice={selectedVault.currentPrice}
            isLocked={selectedVault.isLocked}
            unlockReason={selectedVault.unlockReason}
          />
        )}

        {customizationVault && (
          <VaultCustomizationModal
            isOpen={isCustomizationModalOpen}
            onClose={handleCloseCustomization}
            vaultAddress={customizationVault}
          />
        )}
      </VStack>
    </Box>
  );
};