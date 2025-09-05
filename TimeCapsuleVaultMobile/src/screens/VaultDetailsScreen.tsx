import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Chip,
  Avatar,
  List,
  Divider,
  IconButton,
  Menu,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Transaction } from '../types';
import { useVault } from '../hooks/useVault';

const { width } = Dimensions.get('window');

export default function VaultDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppTheme();
  const [vault, setVault] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [depositDialogVisible, setDepositDialogVisible] = useState(false);
  const [withdrawDialogVisible, setWithdrawDialogVisible] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    // Get vault from route params
    const vaultParam = route.params?.vault as any;
    if (vaultParam) {
      setVault(vaultParam);
    }

    // Load mock transactions
    const mockTransactions: Transaction[] = [
      {
        hash: '0x1234...5678',
        from: '0x1234...5678',
        to: vaultParam?.address || '0x...',
        value: '0.1',
        gasUsed: '21000',
        gasPrice: '5000000000',
        timestamp: Date.now() - 86400000 * 2,
        status: 'confirmed',
        type: 'vault_deposit',
        network: 'BSC Testnet',
      },
      {
        hash: '0x8765...4321',
        from: vaultParam?.address || '0x...',
        to: '0xabcd...efgh',
        value: '0.05',
        gasUsed: '21000',
        gasPrice: '5000000000',
        timestamp: Date.now() - 86400000 * 5,
        status: 'confirmed',
        type: 'vault_withdraw',
        network: 'BSC Testnet',
      },
    ];

    setTransactions(mockTransactions);
  }, [route.params]);

  const { deposit, withdraw } = useVault('bsc-testnet');

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!vault) return;
    const ok = await deposit(amount, vault.address);
    if (ok) {
      Alert.alert('Success', `Deposited ${amount} tBNB to vault`);
      setDepositDialogVisible(false);
      setAmount('');
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (vault && parseFloat(amount) > Number(vault.balance) / 1e18) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!vault) return;
    const ok = await withdraw(vault.address);
    if (ok) {
      Alert.alert('Success', `Withdrawal submitted`);
      setWithdrawDialogVisible(false);
      setAmount('');
    }
  };

  const handleUnlock = () => {
    Alert.alert(
      'Unlock Vault',
      'Are you sure you want to unlock this vault? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlock', 
          style: 'destructive',
          onPress: () => {
            // Handle unlock logic here
            Alert.alert('Success', 'Vault unlocked successfully');
          }
        },
      ]
    );
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'vault_deposit':
        return 'arrow-down-circle';
      case 'vault_withdraw':
        return 'arrow-up-circle';
      case 'vault_create':
        return 'lock';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'vault_deposit':
        return colors.success;
      case 'vault_withdraw':
        return colors.error;
      case 'vault_create':
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  if (!vault) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Vault not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.accent, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.vaultEmoji}>{vault.emoji}</Text>
          <Title style={styles.headerTitle}>{vault.name}</Title>
          <Text style={styles.headerSubtitle}>{vault.description}</Text>
          <Chip 
            mode="outlined" 
            textStyle={{ color: vault.isLocked ? colors.error : colors.success }}
            style={{ borderColor: vault.isLocked ? colors.error : colors.success, marginTop: 10 }}
          >
            {vault.isLocked ? 'LOCKED' : 'UNLOCKED'}
          </Chip>
        </View>
      </LinearGradient>

      {/* Balance Card */}
      <Card style={[styles.balanceCard, { backgroundColor: colors.card }]}>
        <Card.Content>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Current Balance</Text>
              <Text style={[styles.balanceValue, { color: colors.accent }]}> 
                {(Number(vault.balance) / 1e18).toFixed(6)} tBNB
              </Text>
            </View>
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              iconColor={colors.textSecondary}
            />
          </View>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<View />}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setDepositDialogVisible(true);
              }}
              title="Deposit"
              leadingIcon="arrow-down-circle"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setWithdrawDialogVisible(true);
              }}
              title="Withdraw"
              leadingIcon="arrow-up-circle"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // Handle edit vault
              }}
              title="Edit Vault"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleUnlock();
              }}
              title="Unlock Vault"
              leadingIcon="lock-open"
            />
          </Menu>
        </Card.Content>
      </Card>

      {/* Lock Information */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Lock Information</Title>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vault Address</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{vault.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Network</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{vault.network}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(vault.createdAt).toLocaleDateString()}
            </Text>
          </View>

             {vault.isTimeLocked && vault.unlockTime && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Unlock Date</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(Number(vault.unlockTime) * 1000).toLocaleDateString()}
              </Text>
            </View>
          )}

             {vault.isPriceLocked && vault.targetPrice && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Target Price</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {(Number(vault.targetPrice) / 1e8).toFixed(2)}
              </Text>
            </View>
          )}

             {vault.isGoalLocked && vault.goalAmount && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Goal Amount</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {(Number(vault.goalAmount) / 1e18).toFixed(6)} tBNB
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Progress (for goal locks) */}
      {vault.isGoalLocked && vault.progressPercentage !== undefined && (
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Goal Progress</Title>
            
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
              <Text style={[styles.progressValue, { color: colors.accent }]}>
                {vault.progressPercentage.toFixed(1)}%
              </Text>
            </View>

            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, vault.progressPercentage)}%`,
                    backgroundColor: colors.accent 
                  }
                ]} 
              />
            </View>

            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>Current</Text>
                <Text style={[styles.progressStatValue, { color: colors.text }]}>
                   {(Number(vault.currentAmount) / 1e18).toFixed(6)} tBNB
                </Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>Target</Text>
                <Text style={[styles.progressStatValue, { color: colors.text }]}>
                  {(Number(vault.goalAmount) / 1e18).toFixed(6)} tBNB
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Title>
          
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              icon="arrow-down-circle"
              onPress={() => setDepositDialogVisible(true)}
              style={[styles.actionButton, { backgroundColor: colors.success }]}
            >
              Deposit
            </Button>
            <Button
              mode="outlined"
              icon="arrow-up-circle"
              onPress={() => setWithdrawDialogVisible(true)}
              style={styles.actionButton}
            >
              Withdraw
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Transaction History */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Title>
          
          {transactions.map((transaction) => (
            <List.Item
              key={transaction.hash}
              title={transaction.type.replace('_', ' ').toUpperCase()}
              description={`${transaction.value} ${transaction.network === 'BSC Testnet' ? 'tBNB' : 'ETH'}`}
              left={() => (
                <Avatar.Icon 
                  size={40} 
                  icon={getTransactionIcon(transaction.type)} 
                  style={{ backgroundColor: getTransactionColor(transaction.type) }} 
                />
              )}
              right={() => (
                <View style={styles.transactionRight}>
                  <Chip 
                    mode="outlined" 
                    textStyle={{ color: transaction.status === 'confirmed' ? colors.success : colors.warning }}
                    style={{ borderColor: transaction.status === 'confirmed' ? colors.success : colors.warning }}
                  >
                    {transaction.status.toUpperCase()}
                  </Chip>
                  <Text style={[styles.transactionTime, { color: colors.textSecondary }]}>
                    {Math.ceil((Date.now() - transaction.timestamp) / (1000 * 60 * 60 * 24))} days ago
                  </Text>
                </View>
              )}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
              style={{ paddingVertical: 8 }}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Deposit Dialog */}
      <Portal>
        <Dialog visible={depositDialogVisible} onDismiss={() => setDepositDialogVisible(false)}>
          <Dialog.Title style={{ color: colors.text }}>Deposit to Vault</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Amount (tBNB)"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="numeric"
              style={{ marginBottom: 16 }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Enter the amount you want to deposit into this vault.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDepositDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeposit} mode="contained">Deposit</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Withdraw Dialog */}
      <Portal>
        <Dialog visible={withdrawDialogVisible} onDismiss={() => setWithdrawDialogVisible(false)}>
          <Dialog.Title style={{ color: colors.text }}>Withdraw from Vault</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Amount (tBNB)"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="numeric"
              style={{ marginBottom: 16 }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Enter the amount you want to withdraw from this vault.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setWithdrawDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleWithdraw} mode="contained">Withdraw</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  vaultEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  balanceCard: {
    margin: 20,
    marginTop: -20,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  card: {
    margin: 20,
    marginTop: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionTime: {
    fontSize: 12,
    marginTop: 5,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
});
