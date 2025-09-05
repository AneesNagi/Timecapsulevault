import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Chip,
  Avatar,
  Searchbar,
  FAB,
  Menu,
  Divider,
  List,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  Switch,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useNetwork } from '../contexts/NetworkContext';
import { Transaction } from '../types';
import { loadWallets, createWallet, WalletData, deleteWallet, importWallet, updateAllWalletBalances, updateNetworkWalletBalances, testRPCConnection, checkWalletNetworkConsistency } from '../utils/wallet';
import { SUPPORTED_NETWORKS } from '../constants/networks';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { PrivateKeyModal } from '../components/PrivateKeyModal';
import { NetworkSelector } from '../components/NetworkSelector';

export default function WalletScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { selectedNetwork, setSelectedNetwork: setGlobalNetwork } = useNetwork();
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<WalletData[]>([]);

  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [privateKeyModalVisible, setPrivateKeyModalVisible] = useState(false);
  const [selectedWalletForKey, setSelectedWalletForKey] = useState<WalletData | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<WalletData | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreatedKey, setShowCreatedKey] = useState(false);
  const [createdWalletKey, setCreatedWalletKey] = useState('');
  const [networkSelectorVisible, setNetworkSelectorVisible] = useState(false);
  const [walletOptionsVisible, setWalletOptionsVisible] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [importWalletName, setImportWalletName] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [walletSelectorVisible, setWalletSelectorVisible] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch real-time balances from blockchain for current network only
      const updatedWallets = await updateNetworkWalletBalances(selectedNetwork);
      setWallets(updatedWallets);
      setFilteredWallets(updatedWallets);
      
      // Update selected wallet if it exists
      if (selectedWallet) {
        const updatedSelectedWallet = updatedWallets.find(w => w.id === selectedWallet.id);
        if (updatedSelectedWallet) {
          setSelectedWallet(updatedSelectedWallet);
        }
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedWallet, selectedNetwork]);

  useEffect(() => {
    // Check if security setup is needed
    const checkSecuritySetup = async () => {
      try {
        const setupCompleted = await SecureStore.getItemAsync('security_setup_completed');
        if (!setupCompleted && wallets.length === 0) {
          // Show security setup for first-time users
          navigation.navigate('SecuritySetup' as never);
        }
      } catch (error) {
        console.log('Error checking security setup:', error);
      }
    };

    const load = async () => {
      const ws = await loadWallets();
      setWallets(ws);
      setFilteredWallets(ws);
      
      if (ws.length === 0) {
        checkSecuritySetup();
      } else {
        // Update balances for existing wallets on current network
        try {
          const updatedWallets = await updateNetworkWalletBalances(selectedNetwork);
          setWallets(updatedWallets);
          setFilteredWallets(updatedWallets);
          
          // Update selected wallet if it exists
          if (selectedWallet) {
            const updatedSelectedWallet = updatedWallets.find(w => w.id === selectedWallet.id);
            if (updatedSelectedWallet) {
              setSelectedWallet(updatedSelectedWallet);
            }
          }
        } catch (error) {
          console.error('Error updating initial balances:', error);
        }
      }
    };
    load();
    setTransactions([]);
  }, []);

  useEffect(() => {
    setFilteredWallets(wallets);
    // Auto-select first wallet if none selected
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0]);
    }
  }, [wallets]);

  // Auto-refresh balances every 2 minutes
  useEffect(() => {
    if (wallets.length === 0) return;
    
    const interval = setInterval(async () => {
      try {
        const updatedWallets = await updateNetworkWalletBalances(selectedNetwork);
        setWallets(updatedWallets);
        setFilteredWallets(updatedWallets);
        
        // Update selected wallet if it exists
        if (selectedWallet) {
          const updatedSelectedWallet = updatedWallets.find(w => w.id === selectedWallet.id);
          if (updatedSelectedWallet) {
            setSelectedWallet(updatedSelectedWallet);
          }
        }
      } catch (error) {
        console.error('Error in auto-refresh:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [wallets.length, selectedWallet, selectedNetwork]);



  const renderWalletItem = ({ item: wallet }: { item: WalletData }) => (
    <Card 
      style={[styles.walletCard, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('WalletDetails' as never, { wallet })}
    >
      <Card.Content>
        <View style={styles.walletHeader}>
          <View style={styles.walletInfo}>
            <Avatar.Icon size={50} icon="wallet" style={{ backgroundColor: colors.accent }} />
            <View style={styles.walletDetails}>
              <Title style={[styles.walletName, { color: colors.text }]}>{wallet.name}</Title>
              <Text style={[styles.walletAddress, { color: colors.textSecondary }]}>
                {wallet.address}
              </Text>
              <Text style={[styles.walletNetwork, { color: colors.textSecondary }]}>
                {SUPPORTED_NETWORKS.find(n => n.id === wallet.network)?.name || wallet.network}
              </Text>
            </View>
          </View>
          <Menu
            visible={menuVisible === wallet.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(wallet.id)}
                iconColor={colors.textSecondary}
              />
            }
          >
            <Menu.Item
              onPress={() => handleViewDetails(wallet)}
              title="View Details"
              leadingIcon="eye"
            />
            <Menu.Item
              onPress={() => handleRefreshBalance(wallet)}
              title="Refresh Balance"
              leadingIcon="refresh"
            />
            <Menu.Item
              onPress={() => handleExportPrivateKey(wallet)}
              title="Export Private Key"
              leadingIcon="key"
            />
            <Divider />
            <Menu.Item
              onPress={() => handleDeleteWallet(wallet)}
              title="Delete Wallet"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <View style={styles.walletBalance}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance</Text>
          <Text style={[styles.balanceValue, { color: colors.accent }]}>
                         {getDisplayBalance(wallet)} {getCurrencySymbol()}
          </Text>
        </View>

        <View style={styles.walletStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Transactions</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{wallet.transactionCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Activity</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {wallet.lastActivity ? 
                `${Math.ceil((Date.now() - wallet.lastActivity) / (1000 * 60 * 60 * 24))} days ago` : 
                'Never'
              }
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );





  const authenticateForDelete = async (): Promise<boolean> => {
    try {
      const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
      
      if (biometricEnabled === 'true') {
        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to delete wallet',
            fallbackLabel: 'Use PIN',
          });
          
          if (result.success) return true;
        } catch (error) {
          console.log('Biometric auth failed, checking PIN');
        }
        
        const storedPin = await SecureStore.getItemAsync('wallet_pin');
        if (storedPin && deletePin === storedPin) {
          return true;
        }
        return false;
      }
      return true; // No security setup
    } catch (error) {
      console.error('Delete authentication error:', error);
      return false;
    }
  };

  const handleCreateWallet = async () => {
    console.log('handleCreateWallet called');
    
    if (!newWalletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    setIsCreatingWallet(true);
    
    try {
      console.log('Creating wallet with name:', newWalletName.trim());
      
      const w = await createWallet(newWalletName.trim(), selectedNetwork);
      console.log('Wallet created:', w);
      
      const ws = await loadWallets();
      console.log('Loaded wallets:', ws.length);
      
      setWallets(ws);
      setFilteredWallets(ws);
      setCreateDialogVisible(false);
      setNewWalletName('');
      
      // Show private key after creation
      setCreatedWalletKey(w.privateKey);
      setShowCreatedKey(true);
      
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
    }
    
    setIsCreatingWallet(false);
  };

  const handleViewDetails = (wallet: WalletData) => {
    setMenuVisible(null);
    const networkInfo = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
    const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork);
    
    Alert.alert(
      'Wallet Details',
      `Name: ${wallet.name}\n` +
      `Address: ${wallet.address}\n` +
      `Wallet Network: ${networkInfo?.name}\n` +
      `Current App Network: ${currentNetwork?.name}\n` +
      `Balance: ${getDisplayBalance(wallet)} ${getCurrencySymbol()}\n` +
      `Created: ${new Date(wallet.createdAt).toLocaleDateString()}\n\n` +
      `Note: Wallet balance is fetched from its own network (${networkInfo?.name}), not the current app network.`
    );
  };

  const handleRefreshBalance = async (wallet: WalletData) => {
    setMenuVisible(null);
    try {
      // Show loading state
      setRefreshing(true);
      
      // Update just this wallet's balance for its specific network
      const updatedWallets = await updateNetworkWalletBalances(wallet.network);
      setWallets(updatedWallets);
      setFilteredWallets(updatedWallets);
      
      // Update selected wallet if it's the one being refreshed
      if (selectedWallet && selectedWallet.id === wallet.id) {
        const updatedSelectedWallet = updatedWallets.find(w => w.id === wallet.id);
        if (updatedSelectedWallet) {
          setSelectedWallet(updatedSelectedWallet);
        }
      }
      
      Alert.alert('Success', 'Balance updated successfully!');
    } catch (error) {
      console.error('Error refreshing balance:', error);
      Alert.alert('Error', 'Failed to update balance. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestRPC = async () => {
    try {
      const result = await testRPCConnection(selectedNetwork);
      if (result.success) {
        Alert.alert(
          'RPC Test Success', 
          `Network: ${SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork)?.name}\nWorking RPCs: ${result.details?.workingRPCs?.length || 0}/${result.details?.totalTested || 0}`
        );
      } else {
        Alert.alert(
          'RPC Test Failed', 
          `Network: ${SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork)?.name}\nError: ${result.error}\n\nThis might explain why balances are not updating.`
        );
      }
    } catch (error) {
      Alert.alert('RPC Test Error', 'Failed to test RPC connectivity');
    }
  };

  const handleCheckWalletConsistency = async () => {
    try {
      const result = await checkWalletNetworkConsistency();
      if (result.issues.length === 0) {
        Alert.alert(
          'Wallet Consistency Check',
          `All wallets are properly configured!\n\nTotal wallets: ${result.wallets.length}\nNetworks: ${[...new Set(result.wallets.map(w => w.network))].join(', ')}`
        );
      } else {
        Alert.alert(
          'Wallet Consistency Issues Found',
          `Issues found:\n\n${result.issues.join('\n')}\n\nThese issues might explain why you're seeing incorrect balances.`
        );
      }
    } catch (error) {
      Alert.alert('Consistency Check Error', 'Failed to check wallet consistency');
    }
  };

  const handleExportPrivateKey = (wallet: WalletData) => {
    setMenuVisible(null);
    setSelectedWalletForKey(wallet);
    setPrivateKeyModalVisible(true);
  };

  const handleDeleteWallet = (wallet: WalletData) => {
    setMenuVisible(null);
    setWalletToDelete(wallet);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteWallet = async () => {
    if (!walletToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const authenticated = await authenticateForDelete();
      if (!authenticated) {
        Alert.alert('Authentication Failed', 'Invalid PIN or authentication failed');
        setIsDeleting(false);
        return;
      }
      
      await deleteWallet(walletToDelete.id);
      const ws = await loadWallets();
      setWallets(ws);
      setFilteredWallets(ws);
      
      setDeleteConfirmVisible(false);
      setWalletToDelete(null);
      setDeletePin('');
      
      Alert.alert('Success', 'Wallet deleted successfully');
    } catch (error) {
      console.error('Error deleting wallet:', error);
      Alert.alert('Error', 'Failed to delete wallet');
    }
    
    setIsDeleting(false);
  };

  const getCurrencySymbol = (wallet?: WalletData) => {
    // Show currency based on current global network
    const globalNetwork = SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork);
    return globalNetwork?.currency || 'ETH';
  };

  const getDisplayBalance = (wallet: WalletData) => {
    // You could fetch real balance here based on wallet's network
    return wallet.balance || '0.0000';
  };

  const handleImportWallet = async () => {
    if (!importWalletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }
    
    if (!importPrivateKey.trim()) {
      Alert.alert('Error', 'Please enter a private key');
      return;
    }

    setIsCreatingWallet(true);
    
    try {
      const w = await importWallet(importWalletName.trim(), importPrivateKey.trim(), selectedNetwork);
      console.log('Wallet imported:', w);
      
      const ws = await loadWallets();
      setWallets(ws);
      setFilteredWallets(ws);
      setImportDialogVisible(false);
      setImportWalletName('');
      setImportPrivateKey('');
      
      Alert.alert('Success', 'Wallet imported successfully!');
    } catch (error) {
      console.error('Error importing wallet:', error);
      Alert.alert('Error', 'Failed to import wallet. Please check your private key.');
    }
    
    setIsCreatingWallet(false);
  };

  const handleSend = () => {
    if (!selectedWallet) return;
    if (!sendAddress.trim()) {
      Alert.alert('Error', 'Please enter a recipient address');
      return;
    }
    if (!sendAmount.trim() || isNaN(Number(sendAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    Alert.alert(
      'Send Confirmation',
      `Send ${sendAmount} ${getCurrencySymbol()} to\n${sendAddress}?`,
      [
        { text: 'Cancel' },
        { 
          text: 'Send', 
          onPress: () => {
            Alert.alert('Success', 'Transaction sent! (Demo mode)');
            setSendModalVisible(false);
            setSendAddress('');
            setSendAmount('');
          }
        }
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Address copied to clipboard!');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <View>
        <Title style={[styles.headerTitle, { color: colors.text }]}>My Wallets</Title>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {filteredWallets.length} wallet{filteredWallets.length !== 1 ? 's' : ''}
        </Text>
      </View>
          <View style={styles.networkIndicator}>
            <View style={styles.networkButtons}>
              <Button
                mode="contained"
                onPress={() => setNetworkSelectorVisible(true)}
                style={[styles.networkBadge, { backgroundColor: colors.accent }]}
                labelStyle={styles.networkBadgeText}
                compact
              >
                {SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork)?.name.replace(' Testnet', '') || 'Unknown'}
              </Button>
              <Button
                mode="outlined"
                onPress={handleTestRPC}
                style={[styles.debugButton, { borderColor: colors.accent }]}
                labelStyle={[styles.debugButtonText, { color: colors.accent }]}
                compact
              >
                Test RPC
              </Button>
              <Button
                mode="outlined"
                onPress={handleCheckWalletConsistency}
                style={[styles.debugButton, { borderColor: colors.accent }]}
                labelStyle={[styles.debugButtonText, { color: colors.accent }]}
                compact
              >
                Check Wallets
              </Button>
            </View>
          </View>
        </View>
      </View>



             {/* Wallet Content */}
      {selectedWallet ? (
        <ScrollView 
          style={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        >
          {/* Wallet Selector */}
          <Card 
            style={[styles.walletSelectorCard, { backgroundColor: colors.card }]}
            onPress={() => setWalletSelectorVisible(true)}
          >
            <Card.Content style={styles.walletSelectorContent}>
              <View style={styles.walletSelectorInfo}>
                <Avatar.Icon 
                  size={40} 
                  icon="wallet" 
                  style={{ backgroundColor: selectedWallet.network === 'sepolia' ? '#627EEA' : '#F3BA2F' }} 
                />
                <View style={styles.walletSelectorDetails}>
                  <Text style={[styles.walletSelectorName, { color: colors.text }]}>
                    {selectedWallet.name}
                  </Text>
                  <Text style={[styles.walletSelectorAddress, { color: colors.textSecondary }]}>
                    {selectedWallet.address.substring(0, 6)}...{selectedWallet.address.substring(38)}
                  </Text>
                  <Text style={[styles.walletNetworkInfo, { color: colors.textSecondary, fontSize: 10 }]}>
                    Network: {SUPPORTED_NETWORKS.find(n => n.id === selectedWallet.network)?.name}
                  </Text>
                  {refreshing && (
                    <Text style={[styles.updatingText, { color: colors.accent }]}>
                      Updating balance...
                    </Text>
                  )}
                </View>
              </View>
              <IconButton icon="chevron-down" iconColor={colors.textSecondary} />
            </Card.Content>
          </Card>

          {/* Balance Display */}
          <Card style={[styles.balanceCard, { backgroundColor: colors.card }]}>
            <Card.Content style={styles.balanceContent}>
              <View style={styles.balanceHeader}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Total Balance</Text>
                <IconButton
                  icon="refresh"
                  size={20}
                  onPress={onRefresh}
                  iconColor={colors.accent}
                  disabled={refreshing}
                />
              </View>
              <Text style={[styles.balanceAmount, { color: colors.text }]}>
                {refreshing ? 'Updating...' : getDisplayBalance(selectedWallet)} {getCurrencySymbol()}
              </Text>
              <Text style={[styles.balanceUSD, { color: colors.textSecondary }]}>≈ $0.00 USD</Text>
              <Text style={[styles.networkInfo, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
                Balance from: {SUPPORTED_NETWORKS.find(n => n.id === selectedWallet.network)?.name}
              </Text>
              <Text style={[styles.networkInfo, { color: colors.textSecondary, fontSize: 10, marginTop: 4 }]}>
                (Not affected by current app network)
              </Text>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <Button
              mode="contained"
              icon="arrow-up"
              onPress={() => setSendModalVisible(true)}
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              labelStyle={styles.actionButtonLabel}
            >
              Send
            </Button>
            <Button
              mode="outlined"
              icon="arrow-down"
              onPress={() => setReceiveModalVisible(true)}
              style={styles.actionButton}
              labelStyle={[styles.actionButtonLabel, { color: colors.accent }]}
            >
              Receive
            </Button>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <Button
              mode="contained"
              onPress={() => {}}
              style={styles.tabButton}
              labelStyle={[styles.tabLabel, { color: '#fff' }]}
            >
              Holdings
            </Button>
            <Button
              mode="outlined"
              onPress={() => {}}
              style={styles.tabButton}
              labelStyle={[styles.tabLabel, { color: colors.text }]}
            >
              History
            </Button>
              </View>

          {/* Tab Content */}
          <Card style={[styles.tabContentCard, { backgroundColor: colors.card }]}>
            <Card.Content>
              <List.Item
                title={getCurrencySymbol()}
                description={SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork)?.name}
                left={() => (
                  <Avatar.Icon 
                    size={40} 
                    icon={selectedNetwork === 'sepolia' ? 'ethereum' : 'currency-btc'} 
                    style={{ backgroundColor: selectedNetwork === 'sepolia' ? '#627EEA' : '#F3BA2F' }} 
                  />
                )}
                right={() => (
                  <View style={styles.holdingAmount}>
                    <Text style={[styles.holdingValue, { color: colors.text }]}>
                      {getDisplayBalance(selectedWallet)}
                    </Text>
                    <Text style={[styles.holdingUSD, { color: colors.textSecondary }]}>
                      ≈ $0.00
                    </Text>
          </View>
                )}
                titleStyle={{ color: colors.text }}
                descriptionStyle={{ color: colors.textSecondary }}
              />
            </Card.Content>
          </Card>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No wallets yet. Create your first wallet to get started!
          </Text>
        </View>
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setWalletOptionsVisible(true)}
      />

      {/* Wallet Options Dialog */}
      <Portal>
        <Dialog visible={walletOptionsVisible} onDismiss={() => setWalletOptionsVisible(false)}>
          <Dialog.Title style={{ color: colors.text }}>Add Wallet</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.optionsDescription, { color: colors.textSecondary }]}>
              Choose how you want to add a new wallet
            </Text>
            
            <View style={styles.optionsContainer}>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => {
                  setWalletOptionsVisible(false);
                  setCreateDialogVisible(true);
                }}
                style={[styles.optionButton, { backgroundColor: colors.accent }]}
              >
                Create New Wallet
              </Button>
              
              <Button
                mode="outlined"
                icon="import"
                onPress={() => {
                  setWalletOptionsVisible(false);
                  setImportDialogVisible(true);
                }}
                style={styles.optionButton}
              >
                Import Existing Wallet
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setWalletOptionsVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

      {/* Create Wallet Dialog */}
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title style={{ color: colors.text }}>Create New Wallet</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Wallet Name"
              value={newWalletName}
              onChangeText={setNewWalletName}
              mode="outlined"
              style={{ marginBottom: 16 }}
              disabled={isCreatingWallet}
            />
            
            
            
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 16 }}>
              A new wallet will be created with a secure private key. Your private key will be shown after creation - make sure to save it safely.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setCreateDialogVisible(false)}
              disabled={isCreatingWallet}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleCreateWallet} 
              mode="contained"
              loading={isCreatingWallet}
              disabled={isCreatingWallet || !newWalletName.trim()}
            >
              {isCreatingWallet ? 'Creating...' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Created Wallet Private Key Dialog */}
        <Dialog visible={showCreatedKey} onDismiss={() => setShowCreatedKey(false)}>
          <Dialog.Title style={{ color: colors.text }}>Wallet Created Successfully!</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.successText, { color: colors.success }]}>
              Your wallet has been created. Please save your private key securely:
            </Text>
            
            <Card style={[styles.keyCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <View style={styles.keyContainer}>
                  <Text style={[styles.keyText, { color: colors.text }]}>
                    {createdWalletKey}
                  </Text>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => {
                      require('react-native').Clipboard.setString(createdWalletKey);
                      Alert.alert('Copied', 'Private key copied to clipboard');
                    }}
                    iconColor={colors.accent}
                  />
                </View>
              </Card.Content>
            </Card>
            
            <Text style={[styles.warningText, { color: colors.error }]}>
              ⚠️ Keep this private key safe! Anyone with this key can access your wallet.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setShowCreatedKey(false);
                setCreatedWalletKey('');
              }}
              mode="contained"
            >
              I've Saved It Safely
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog visible={deleteConfirmVisible} onDismiss={() => setDeleteConfirmVisible(false)}>
          <Dialog.Title style={{ color: colors.text }}>Delete Wallet</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.warningText, { color: colors.error }]}>
              ⚠️ Are you sure you want to delete "{walletToDelete?.name}"? This action cannot be undone!
            </Text>
            
            <TextInput
              label="Enter PIN to confirm"
              value={deletePin}
              onChangeText={setDeletePin}
              mode="outlined"
              secureTextEntry
              keyboardType="numeric"
              style={{ marginTop: 16 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setDeleteConfirmVisible(false);
                setDeletePin('');
                setWalletToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onPress={confirmDeleteWallet}
              mode="contained"
              loading={isDeleting}
              disabled={isDeleting}
              buttonColor={colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Import Wallet Dialog */}
        <Dialog visible={importDialogVisible} onDismiss={() => setImportDialogVisible(false)}>
          <Dialog.Title style={{ color: colors.text }}>Import Wallet</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Wallet Name"
              value={importWalletName}
              onChangeText={setImportWalletName}
              mode="outlined"
              style={{ marginBottom: 16 }}
              disabled={isCreatingWallet}
            />
            
            <TextInput
              label="Private Key"
              value={importPrivateKey}
              onChangeText={setImportPrivateKey}
              mode="outlined"
              secureTextEntry
              multiline
              numberOfLines={3}
              style={{ marginBottom: 16 }}
              disabled={isCreatingWallet}
              placeholder="Enter your private key (starts with 0x...)"
            />
            
            <Text style={[styles.networkInfo, { color: colors.textSecondary }]}>
              Network: {SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork)?.name || 'Unknown'}
            </Text>
            
            <Text style={[styles.warningText, { color: colors.error }]}>
              ⚠️ Never share your private key with anyone. Make sure you trust this device.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setImportDialogVisible(false);
                setImportWalletName('');
                setImportPrivateKey('');
              }}
              disabled={isCreatingWallet}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleImportWallet} 
              mode="contained"
              loading={isCreatingWallet}
              disabled={isCreatingWallet || !importWalletName.trim() || !importPrivateKey.trim()}
            >
              {isCreatingWallet ? 'Importing...' : 'Import'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Private Key Modal */}
      {selectedWalletForKey && (
        <PrivateKeyModal
          visible={privateKeyModalVisible}
          onDismiss={() => {
            setPrivateKeyModalVisible(false);
            setSelectedWalletForKey(null);
          }}
          privateKey={selectedWalletForKey.privateKey}
          walletName={selectedWalletForKey.name || 'Unnamed Wallet'}
        />
      )}

      {/* Network Selector Modal */}
      <Portal>
        <Dialog 
          visible={networkSelectorVisible} 
          onDismiss={() => setNetworkSelectorVisible(false)}
          style={styles.networkDialog}
        >
          <Dialog.Title style={{ color: colors.text }}>Select Network</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.networkDescription, { color: colors.textSecondary }]}>
              Choose the blockchain network. This will affect all new wallet creations and vault interactions.
            </Text>
            
            <View style={styles.networkOptionsContainer}>
              {SUPPORTED_NETWORKS.map((network) => (
                <Button
                  key={network.id}
                  mode={selectedNetwork === network.id ? 'contained' : 'outlined'}
                  onPress={async () => {
                    // Update global network
                    setGlobalNetwork(network.id);
                    setNetworkSelectorVisible(false);
                    
                    // Refresh wallets and update balances for new network
                    try {
                      const updatedWallets = await updateNetworkWalletBalances(network.id);
                      setWallets(updatedWallets);
                      setFilteredWallets(updatedWallets);
                      
                      // Update selected wallet if it exists
                      if (selectedWallet) {
                        const updatedSelectedWallet = updatedWallets.find(w => w.id === selectedWallet.id);
                        if (updatedSelectedWallet) {
                          setSelectedWallet(updatedSelectedWallet);
                        }
                      }
                    } catch (error) {
                      console.error('Error updating balances after network change:', error);
                      // Fallback to just loading wallets
                      const ws = await loadWallets();
                      setWallets(ws);
                      setFilteredWallets(ws);
                    }
                  }}
                  style={[
                    styles.networkOptionButton,
                    selectedNetwork === network.id && {
                      backgroundColor: network.id === 'sepolia' ? '#627EEA' : '#F3BA2F'
                    }
                  ]}
                  labelStyle={{
                    color: selectedNetwork === network.id ? '#fff' : colors.text
                  }}
                >
                  {network.id === 'sepolia' ? 'Ξ' : 'B'} {network.name}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNetworkSelectorVisible(false)}>
              Close
                       </Button>
         </Dialog.Actions>
       </Dialog>

       {/* Wallet Selector Modal */}
       <Dialog 
         visible={walletSelectorVisible} 
         onDismiss={() => setWalletSelectorVisible(false)}
         style={styles.walletSelectorModal}
       >
         <Dialog.Title style={{ color: colors.text }}>Select Wallet</Dialog.Title>
         <Dialog.Content>
           <Text style={[styles.selectorDescription, { color: colors.textSecondary }]}>
             Choose which wallet to view and manage
           </Text>
           
           <View style={styles.walletOptionsContainer}>
             {wallets.map((wallet) => (
               <Button
                 key={wallet.id}
                 mode={selectedWallet?.id === wallet.id ? 'contained' : 'outlined'}
                 onPress={() => {
                   setSelectedWallet(wallet);
                   setWalletSelectorVisible(false);
                 }}
                 style={[
                   styles.walletOptionButton,
                   selectedWallet?.id === wallet.id && {
                     backgroundColor: wallet.network === 'sepolia' ? '#627EEA' : '#F3BA2F'
                   }
                 ]}
                 labelStyle={{
                   color: selectedWallet?.id === wallet.id ? '#fff' : colors.text
                 }}
                 icon="wallet"
               >
                 {wallet.name} • {getCurrencySymbol()}
               </Button>
             ))}
           </View>
         </Dialog.Content>
         <Dialog.Actions>
           <Button onPress={() => setWalletSelectorVisible(false)}>
             Close
                      </Button>
         </Dialog.Actions>
       </Dialog>

       {/* Send Modal */}
       <Dialog 
         visible={sendModalVisible} 
         onDismiss={() => setSendModalVisible(false)}
         style={styles.sendModal}
       >
         <Dialog.Title style={{ color: colors.text }}>Send {getCurrencySymbol()}</Dialog.Title>
         <Dialog.Content>
           <TextInput
             label="Recipient Address"
             value={sendAddress}
             onChangeText={setSendAddress}
             mode="outlined"
             style={{ marginBottom: 16 }}
             placeholder="0x..."
           />
           
           <TextInput
             label={`Amount (${getCurrencySymbol()})`}
             value={sendAmount}
             onChangeText={setSendAmount}
             mode="outlined"
             keyboardType="numeric"
             style={{ marginBottom: 16 }}
             placeholder="0.0"
           />
           
           <Text style={[styles.balanceInfo, { color: colors.textSecondary }]}>
             Available: {selectedWallet ? getDisplayBalance(selectedWallet) : '0'} {getCurrencySymbol()}
           </Text>
         </Dialog.Content>
         <Dialog.Actions>
           <Button onPress={() => setSendModalVisible(false)}>Cancel</Button>
           <Button 
             onPress={handleSend} 
             mode="contained"
             style={{ backgroundColor: colors.accent }}
           >
             Send
           </Button>
         </Dialog.Actions>
       </Dialog>

       {/* Receive Modal */}
       <Dialog 
         visible={receiveModalVisible} 
         onDismiss={() => setReceiveModalVisible(false)}
         style={styles.receiveModal}
       >
         <Dialog.Title style={{ color: colors.text }}>Receive {getCurrencySymbol()}</Dialog.Title>
         <Dialog.Content>
           <View style={styles.receiveContent}>
             {selectedWallet && (
               <View style={styles.qrContainer}>
                 <QRCode
                   value={selectedWallet.address}
                   size={200}
                   backgroundColor="white"
                   color="black"
                 />
               </View>
             )}
             
             <Text style={[styles.receiveLabel, { color: colors.textSecondary }]}>
               Your {getCurrencySymbol()} Address:
             </Text>
             
             <Card style={[styles.addressCard, { backgroundColor: colors.surface }]}>
               <Card.Content>
                 <View style={styles.addressContainer}>
                   <Text style={[styles.addressText, { color: colors.text }]} selectable>
                     {selectedWallet?.address}
                   </Text>
                   <IconButton
                     icon="content-copy"
                     size={20}
                     onPress={() => selectedWallet && copyToClipboard(selectedWallet.address)}
                     iconColor={colors.accent}
                   />
                 </View>
               </Card.Content>
             </Card>
             
             <Text style={[styles.receiveWarning, { color: colors.textSecondary }]}>
               Only send {getCurrencySymbol()} to this address. Sending other tokens may result in permanent loss.
             </Text>
           </View>
         </Dialog.Content>
         <Dialog.Actions>
           <Button onPress={() => setReceiveModalVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  networkIndicator: {
    alignItems: 'flex-end',
  },
  networkButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  networkBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  networkBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  debugButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  networkInfo: {
    fontSize: 14,
    marginBottom: 8,
  },
  networkNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  optionsDescription: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 4,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  walletCard: {
    marginBottom: 15,
    elevation: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  walletDetails: {
    marginLeft: 15,
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 12,
    marginBottom: 2,
  },
  walletNetwork: {
    fontSize: 12,
  },
  walletBalance: {
    marginBottom: 15,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },

  successText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  keyCard: {
    marginVertical: 15,
  },
  keyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    flexWrap: 'wrap',
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  networkDialog: {
    marginHorizontal: 20,
  },
  networkDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  networkOptionsContainer: {
    gap: 12,
  },
     networkOptionButton: {
     marginBottom: 8,
     paddingVertical: 4,
   },
   
   // New wallet selector styles
   contentContainer: {
     flex: 1,
   },
   walletSelectorCard: {
     margin: 20,
     marginBottom: 16,
     elevation: 2,
   },
   walletSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
   },
   walletSelectorInfo: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   walletSelectorDetails: {
     marginLeft: 15,
     flex: 1,
   },
   walletSelectorName: {
     fontSize: 18,
    fontWeight: 'bold',
     marginBottom: 4,
   },
   walletSelectorAddress: {
     fontSize: 12,
   },
   balanceCard: {
     marginHorizontal: 20,
     marginBottom: 20,
     elevation: 2,
   },
   balanceContent: {
     alignItems: 'center',
     paddingVertical: 20,
   },
   balanceHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     width: '100%',
     marginBottom: 10,
   },
   balanceAmount: {
     fontSize: 32,
     fontWeight: 'bold',
     marginVertical: 8,
   },
   balanceUSD: {
     fontSize: 16,
   },
   actionButtonsContainer: {
     flexDirection: 'row',
     marginHorizontal: 20,
     marginBottom: 20,
     gap: 12,
   },
   actionButton: {
     flex: 1,
     paddingVertical: 8,
   },
   actionButtonLabel: {
     fontSize: 16,
     fontWeight: 'bold',
   },
   tabsContainer: {
     flexDirection: 'row',
     marginHorizontal: 20,
     marginBottom: 16,
     gap: 8,
   },
   tabButton: {
     flex: 1,
     paddingVertical: 4,
   },
   tabLabel: {
     fontSize: 14,
     fontWeight: 'bold',
   },
   tabContentCard: {
     marginHorizontal: 20,
     marginBottom: 20,
     elevation: 2,
   },
   holdingAmount: {
    alignItems: 'flex-end',
  },
   holdingValue: {
     fontSize: 16,
     fontWeight: 'bold',
   },
   holdingUSD: {
    fontSize: 12,
   },
   walletSelectorModal: {
     marginHorizontal: 20,
   },
   selectorDescription: {
     fontSize: 14,
     marginBottom: 20,
     lineHeight: 20,
   },
   walletOptionsContainer: {
     gap: 12,
   },
   walletOptionButton: {
     marginBottom: 8,
     paddingVertical: 4,
   },
   
   // Send/Receive Modal Styles
   sendModal: {
     marginHorizontal: 20,
   },
   receiveModal: {
     marginHorizontal: 20,
   },
   balanceInfo: {
     fontSize: 14,
     textAlign: 'center',
   },
   receiveContent: {
     alignItems: 'center',
   },
   qrContainer: {
     marginBottom: 20,
     padding: 16,
     backgroundColor: 'white',
     borderRadius: 8,
   },
   receiveLabel: {
     fontSize: 14,
     marginBottom: 12,
     textAlign: 'center',
   },
   addressCard: {
     marginBottom: 16,
     width: '100%',
   },
   addressContainer: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   addressText: {
     flex: 1,
     fontSize: 12,
     fontFamily: 'monospace',
   },
   receiveWarning: {
     fontSize: 12,
     textAlign: 'center',
     fontStyle: 'italic',
   },
   updatingText: {
     fontSize: 10,
     fontStyle: 'italic',
     marginTop: 2,
   },
   walletNetworkInfo: {
     fontSize: 10,
     marginTop: 2,
     fontStyle: 'italic',
   },
});
