import {
  Box,
  Container,
  Flex,
  Heading,
  Link,
  Spacer,
  Stack,
  Button,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
  useBreakpointValue,
  HStack
} from '@chakra-ui/react'
import { Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import React from 'react'
import { FaBars } from 'react-icons/fa'
import { ethers } from 'ethers'

import { VaultForm } from './VaultForm'
import { MyVaults } from './MyVaults'
import { WalletManager } from './WalletManager'
import { WalletDetail } from './WalletDetail'
import WelcomePage from './WelcomePage'
import Dashboard from './Dashboard'
import { ThemeToggle } from './ThemeToggle'
// import NotificationBell from './NotificationBell'
import { SUPPORTED_NETWORKS } from '../constants/networks.js'
import { NetworkSelector } from './NetworkSelector';


// Create a context for the selected network
export const NetworkContext = React.createContext({
  network: SUPPORTED_NETWORKS[0],
  setNetwork: (_n: typeof SUPPORTED_NETWORKS[0]) => {},
  refreshWallets: () => {},
})

function DAppLayout() {
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [selectedNetwork, setSelectedNetwork] = useState(() => {
    const stored = localStorage.getItem('selectedNetwork');
    const parsed = stored ? JSON.parse(stored) : null;
    
    // Use SUPPORTED_NETWORKS
    const networksToUse = SUPPORTED_NETWORKS;
    
    // Validate that the stored network is still in the supported list
    if (parsed && networksToUse.find(n => n.id === parsed.id)) {
      return parsed;
    }
    
    // Default to first network
    return networksToUse[0];
  });

  // Save network selection to localStorage
  useEffect(() => {
    localStorage.setItem('selectedNetwork', JSON.stringify(selectedNetwork));
  }, [selectedNetwork]);

  // Trigger global wallet refresh when network changes
  useEffect(() => {
    console.log('🔄 DAppLayout: Network changed to', selectedNetwork.name);
    setTimeout(() => {
      refreshWallets();
    }, 1000); // Small delay to ensure network change is complete
  }, [selectedNetwork]);



  // Determine button label and link based on route
  let buttonLabel = 'Create Wallet';
  let buttonTo = '/wallet';
  if (location.pathname.startsWith('/my-vaults') || location.pathname.startsWith('/create-vault')) {
    buttonLabel = 'Create Vault';
    buttonTo = '/create-vault';
  } else if (location.pathname.startsWith('/wallet')) {
    buttonLabel = 'Create Wallet';
    buttonTo = '/wallet';
  }
  
  // Global wallet refresh function
  const refreshWallets = async () => {
    try {
      const savedWallets = localStorage.getItem('wallets');
      if (!savedWallets) return;
      
      const currentWallets = JSON.parse(savedWallets);
      if (currentWallets.length === 0) return;
      
      console.log('🌐 Global wallet refresh triggered for network:', selectedNetwork.name);
      
      const updatedWallets = await Promise.all(
        currentWallets.map(async (wallet: any) => {
          try {
            // Try multiple RPC endpoints for better reliability
            let balance = null;
                         for (const rpcUrl of selectedNetwork.rpc) {
               try {
                 const provider = new ethers.JsonRpcProvider(rpcUrl);
                 balance = await provider.getBalance(wallet.address);
                 break; // Success, stop trying other RPCs
               } catch (rpcError) {
                 console.warn(`RPC ${rpcUrl} failed for ${wallet.address}:`, rpcError);
                 continue; // Try next RPC
               }
             }
             
             if (balance !== null) {
               return {
                 ...wallet,
                 balance: ethers.formatEther(balance),
                 lastActivity: new Date().toISOString(),
               };
            } else {
              return wallet; // Keep original wallet data
            }
          } catch (error) {
            console.warn(`Failed to fetch balance for ${wallet.address}:`, error);
            return wallet;
          }
        })
      );
      
      console.log('🌐 Global wallet refresh completed:', updatedWallets.map(w => ({ address: w.address, balance: w.balance })));
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
    } catch (error) {
      console.error('Global wallet refresh failed:', error);
    }
  };

  return (
    <NetworkContext.Provider value={{ network: selectedNetwork, setNetwork: setSelectedNetwork, refreshWallets }}>
      <Box minH="100vh" minW="100vw" bg="var(--bg-primary)" style={{ background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 60%, var(--accent-color) 100%)' }} position="relative" zIndex={0}>
        {/* Navigation Bar */}
        <Flex as="nav" p={4} bg="rgba(24,26,32,0.95)" backdropFilter="blur(10px)" boxShadow="0 2px 12px 0 rgba(0,0,0,0.25)" borderBottom="1px solid var(--border-color)" alignItems="center" zIndex={9999} position="sticky" top="0" width="100%">
          <Heading as="h1" size="md" color="var(--text-primary)" fontWeight="extrabold">
            <RouterLink to="/">TimeCapsuleVault</RouterLink>
          </Heading>
          <Spacer />
          
          {/* Mobile Menu Button */}
          {isMobile ? (
            <IconButton
              aria-label="Open menu"
              icon={<FaBars />}
              onClick={onOpen}
              variant="ghost"
              color="var(--text-primary)"
              _hover={{ bg: 'whiteAlpha.200' }}
            />
          ) : (
            <Stack direction="row" spacing={4} alignItems="center">
              {/* Global Network Selector */}
              <NetworkSelector
                selectedNetwork={selectedNetwork}
                onNetworkChange={setSelectedNetwork}
                size="sm"
                variant="compact"
              />
              <ThemeToggle />
            
            <Link as={RouterLink} to="/dashboard" px={3} py={1} rounded="md" color="var(--text-primary)" _hover={{ color: "var(--accent-color)", textDecoration: 'underline' }} transition="all 0.2s">
              Dashboard
            </Link>
            <Link as={RouterLink} to="/my-vaults" px={3} py={1} rounded="md" color="var(--text-primary)" _hover={{ color: "var(--accent-color)", textDecoration: 'underline' }} transition="all 0.2s">
              My Vaults
            </Link>
                          <Link as={RouterLink} to="/wallet" px={3} py={1} rounded="md" color="var(--text-primary)" _hover={{ color: "var(--accent-color)", textDecoration: 'underline' }} transition="all 0.2s">
                Wallets
              </Link>
                              {/* <NotificationBell /> */}
              <Button 
                as={RouterLink} 
                to={buttonTo} 
                colorScheme="purple" 
                size="sm" 
                px={5} 
                py={2} 
                rounded="full" 
                fontWeight="bold"
                _hover={{ bg: "var(--accent-color)", color: "var(--text-primary)", shadow: "lg" }} 
                transition="all 0.2s"
              >
                {buttonLabel}
              </Button>
            </Stack>
          )}
        </Flex>

        {/* Mobile Navigation Drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
          <DrawerOverlay zIndex={9998} />
          <DrawerContent bg="rgba(24,26,32,0.98)" color="white" zIndex={9999}>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" borderColor="#414345">
              <HStack>
                <Heading size="md">Menu</Heading>
                <Spacer />
                {/* <NotificationBell /> */}
              </HStack>
            </DrawerHeader>

            <DrawerBody>
              <VStack spacing={6} align="stretch" pt={4}>
                {/* Network Selector */}
                <NetworkSelector
                  selectedNetwork={selectedNetwork}
                  onNetworkChange={setSelectedNetwork}
                  variant="mobile"
                />
                <ThemeToggle />

                {/* Navigation Links */}
                <VStack spacing={3} align="stretch">
                  <Heading size="sm" color="gray.500">Navigation</Heading>
                  <Link 
                    as={RouterLink} 
                    to="/dashboard" 
                    p={3} 
                    rounded="md" 
                    bg={location.pathname === '/dashboard' ? 'purple.600' : 'transparent'}
                    _hover={{ bg: 'purple.700' }}
                    onClick={onClose}
                  >
                    📊 Dashboard
                  </Link>
                  <Link 
                    as={RouterLink} 
                    to="/my-vaults" 
                    p={3} 
                    rounded="md" 
                    bg={location.pathname === '/my-vaults' ? 'purple.600' : 'transparent'}
                    _hover={{ bg: 'purple.700' }}
                    onClick={onClose}
                  >
                    🔒 My Vaults
                  </Link>
                  <Link 
                    as={RouterLink} 
                    to="/wallet" 
                    p={3} 
                    rounded="md" 
                    bg={location.pathname === '/wallet' ? 'purple.600' : 'transparent'}
                    _hover={{ bg: 'purple.700' }}
                    onClick={onClose}
                  >
                    💳 Wallets
                  </Link>
                </VStack>

                {/* Quick Actions */}
                <VStack spacing={3} align="stretch">
                  <Heading size="sm" color="gray.500">Quick Actions</Heading>
                  <Button 
                    as={RouterLink} 
                    to="/create-vault" 
                    colorScheme="purple" 
                    size="lg"
                    onClick={onClose}
                  >
                    ✨ Create New Vault
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/wallet" 
                    variant="outline" 
                    colorScheme="purple"
                    onClick={onClose}
                  >
                    ➕ Add Wallet
                  </Button>
                </VStack>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <Container maxW="container.xl" py={8} px={4} position="relative" zIndex={1}>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-vaults" element={<MyVaults />} />
            <Route path="/create-vault" element={<VaultForm />} />
            <Route path="/wallet" element={<WalletManager />} />
            <Route path="/wallet/:address" element={<WalletDetail />} />
          </Routes>
        </Container>
      </Box>
    </NetworkContext.Provider>
  );
}

export default DAppLayout; 