import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  TextInput,
  Chip,
  Avatar,
  SegmentedButtons,
  Switch,
  Divider,
  List,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useVault } from '../hooks/useVault';
import { loadWallets, WalletData } from '../utils/wallet';

type LockType = 'time' | 'price' | 'goal' | 'manual';

interface LockConfig {
  timeLock?: {
    unlockDate: Date;
    duration: number; // days
  };
  priceLock?: {
    targetPrice: number;
    asset: string;
  };
  goalLock?: {
    targetAmount: number;
    currentAmount: number;
  };
  manualLock?: {
    description: string;
  };
}

export default function CreateVaultScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const [vaultName, setVaultName] = useState('');
  const [description, setDescription] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [lockType, setLockType] = useState<LockType>('time');
  const [lockConfig, setLockConfig] = useState<LockConfig>({});
  const [customization, setCustomization] = useState({
    emoji: '💰',
    color: '#7f5af0',
    category: 'Savings',
    tags: [] as string[],
  });
  const [isAdvanced, setIsAdvanced] = useState(false);
  const { createNewVault, setSelectedWallet } = useVault('arbitrum-sepolia');

  useEffect(() => {
    const init = async () => {
      const ws = await loadWallets();
      setWallets(ws);
      if (ws.length > 0) {
        setSelectedWalletId(ws[0].id);
        setSelectedWallet(ws[0]);
      }
    };
    init();
  }, [setSelectedWallet]);

  // Wallets are loaded from storage

  const emojiOptions = ['💰', '⏰', '📈', '🎯', '🔒', '💎', '🚀', '🏠', '🎓', '🏖️'];
  const colorOptions = ['#7f5af0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const categoryOptions = ['Savings', 'Investment', 'Emergency', 'Goal', 'Trading', 'Custom'];

  const handleCreateVault = async () => {
    if (!vaultName.trim()) {
      Alert.alert('Error', 'Please enter a vault name');
      return;
    }

    if (!initialAmount || parseFloat(initialAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid initial amount');
      return;
    }

    if (!selectedWalletId) {
      Alert.alert('Error', 'Please select a wallet');
      return;
    }

    // Validate lock configuration based on type
    switch (lockType) {
      case 'time':
        if (!lockConfig.timeLock?.unlockDate) {
          Alert.alert('Error', 'Please set an unlock date');
          return;
        }
        break;
      case 'price':
        if (!lockConfig.priceLock?.targetPrice || lockConfig.priceLock.targetPrice <= 0) {
          Alert.alert('Error', 'Please enter a valid target price');
          return;
        }
        break;
      case 'goal':
        if (!lockConfig.goalLock?.targetAmount || lockConfig.goalLock.targetAmount <= 0) {
          Alert.alert('Error', 'Please enter a valid goal amount');
          return;
        }
        break;
    }

    // Build params
    const now = Math.floor(Date.now() / 1000);
    const durationDays = lockConfig.timeLock?.duration ?? 30;
    const unlockTime = now + durationDays * 24 * 60 * 60;
    const targetPrice = Math.floor((lockConfig.priceLock?.targetPrice || 0) * 1e8);
    const targetAmount = Math.floor((lockConfig.goalLock?.targetAmount || 0) * 1e18);

    const txHash = await createNewVault(unlockTime, targetPrice, targetAmount);
    if (txHash) {
      Alert.alert('Success', 'Vault created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const updateLockConfig = (updates: Partial<LockConfig>) => {
    setLockConfig(prev => ({ ...prev, ...updates }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !customization.tags.includes(tag.trim())) {
      setCustomization(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomization(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const renderLockTypeConfig = () => {
    switch (lockType) {
      case 'time':
        return (
          <Card style={[styles.configCard, { backgroundColor: colors.card }]}>
            <Card.Content>
              <Title style={[styles.configTitle, { color: colors.text }]}>Time Lock Configuration</Title>
              <TextInput
                label="Unlock Date"
                value={lockConfig.timeLock?.unlockDate?.toLocaleDateString() || ''}
                onPressIn={() => {
                  // Show date picker
                  const futureDate = new Date();
                  futureDate.setDate(futureDate.getDate() + 30);
                  updateLockConfig({
                    timeLock: {
                      unlockDate: futureDate,
                      duration: 30
                    }
                  });
                }}
                mode="outlined"
                right={<TextInput.Icon icon="calendar" />}
                style={{ marginBottom: 16 }}
              />
              <TextInput
                label="Duration (days)"
                value={lockConfig.timeLock?.duration?.toString() || ''}
                onChangeText={(text) => {
                  const days = parseInt(text) || 0;
                  updateLockConfig({
                    timeLock: {
                      unlockDate: lockConfig.timeLock?.unlockDate || new Date(),
                      duration: days
                    }
                  });
                }}
                mode="outlined"
                keyboardType="numeric"
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                Your funds will be locked until the specified date
              </Text>
            </Card.Content>
          </Card>
        );

      case 'price':
        return (
          <Card style={[styles.configCard, { backgroundColor: colors.card }]}>
            <Card.Content>
              <Title style={[styles.configTitle, { color: colors.text }]}>Price Lock Configuration</Title>
              <TextInput
                label="Target Price ($)"
                value={lockConfig.priceLock?.targetPrice?.toString() || ''}
                onChangeText={(text) => {
                  const price = parseFloat(text) || 0;
                  updateLockConfig({
                    priceLock: {
                      targetPrice: price,
                      asset: lockConfig.priceLock?.asset || 'ETH'
                    }
                  });
                }}
                mode="outlined"
                keyboardType="numeric"
                style={{ marginBottom: 16 }}
              />
              <TextInput
                label="Asset"
                value={lockConfig.priceLock?.asset || 'ETH'}
                onChangeText={(text) => {
                  updateLockConfig({
                    priceLock: {
                      targetPrice: lockConfig.priceLock?.targetPrice || 0,
                      asset: text
                    }
                  });
                }}
                mode="outlined"
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                Your funds will be unlocked when the asset reaches the target price
              </Text>
            </Card.Content>
          </Card>
        );

      case 'goal':
        return (
          <Card style={[styles.configCard, { backgroundColor: colors.card }]}>
            <Card.Content>
              <Title style={[styles.configTitle, { color: colors.text }]}>Goal Lock Configuration</Title>
              <TextInput
                label="Target Amount"
                value={lockConfig.goalLock?.targetAmount?.toString() || ''}
                onChangeText={(text) => {
                  const amount = parseFloat(text) || 0;
                  updateLockConfig({
                    goalLock: {
                      targetAmount: amount,
                      currentAmount: lockConfig.goalLock?.currentAmount || 0
                    }
                  });
                }}
                mode="outlined"
                keyboardType="numeric"
                style={{ marginBottom: 16 }}
              />
              <TextInput
                label="Current Amount"
                value={lockConfig.goalLock?.currentAmount?.toString() || ''}
                onChangeText={(text) => {
                  const amount = parseFloat(text) || 0;
                  updateLockConfig({
                    goalLock: {
                      targetAmount: lockConfig.goalLock?.targetAmount || 0,
                      currentAmount: amount
                    }
                  });
                }}
                mode="outlined"
                keyboardType="numeric"
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                Your funds will be unlocked when you reach your savings goal
              </Text>
            </Card.Content>
          </Card>
        );

      case 'manual':
        return (
          <Card style={[styles.configCard, { backgroundColor: colors.card }]}>
            <Card.Content>
              <Title style={[styles.configTitle, { color: colors.text }]}>Manual Lock Configuration</Title>
              <TextInput
                label="Lock Description"
                value={lockConfig.manualLock?.description || ''}
                onChangeText={(text) => {
                  updateLockConfig({
                    manualLock: { description: text }
                  });
                }}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                You can manually unlock your funds anytime
              </Text>
            </Card.Content>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.accent, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>Create New Vault</Title>
          <Text style={styles.headerSubtitle}>Secure your crypto with smart locks</Text>
        </View>
      </LinearGradient>

      {/* Basic Information */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Title>
          
          <TextInput
            label="Vault Name"
            value={vaultName}
            onChangeText={setVaultName}
            mode="outlined"
            style={{ marginBottom: 16 }}
          />

          <TextInput
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={{ marginBottom: 16 }}
          />

          <TextInput
            label="Initial Amount"
            value={initialAmount}
            onChangeText={setInitialAmount}
            mode="outlined"
            keyboardType="numeric"
            right={<TextInput.Affix text="tBNB" />}
            style={{ marginBottom: 16 }}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Select Wallet</Text>
          {wallets.map((wallet) => (
            <List.Item
              key={wallet.id}
              title={wallet.name}
              description={`${wallet.address}`}
              left={() => (
                <Avatar.Icon 
                  size={40} 
                  icon="wallet" 
                  style={{ backgroundColor: selectedWalletId === wallet.id ? colors.accent : colors.border }} 
                />
              )}
              right={() => 
                selectedWalletId === wallet.id && (
                  <IconButton icon="check-circle" iconColor={colors.accent} />
                )
              }
              onPress={() => { setSelectedWalletId(wallet.id); setSelectedWallet(wallet); }}
              style={[
                styles.walletItem,
                { 
                  backgroundColor: selectedWalletId === wallet.id ? colors.accent + '20' : 'transparent',
                  borderRadius: 8
                }
              ]}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Lock Type Selection */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Lock Type</Title>
          
          <SegmentedButtons
            value={lockType}
            onValueChange={setLockType as (value: string) => void}
            buttons={[
              { value: 'time', label: 'Time', icon: 'clock' },
              { value: 'price', label: 'Price', icon: 'trending-up' },
              { value: 'goal', label: 'Goal', icon: 'target' },
              { value: 'manual', label: 'Manual', icon: 'hand-pointing-up' },
            ]}
            style={{ marginBottom: 16 }}
          />

          {renderLockTypeConfig()}
        </Card.Content>
      </Card>

      {/* Customization */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <View style={styles.customizationHeader}>
            <Title style={[styles.sectionTitle, { color: colors.text }]}>Customization</Title>
            <Switch
              value={isAdvanced}
              onValueChange={setIsAdvanced}
            />
          </View>

          {isAdvanced && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Emoji</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiContainer}>
                {emojiOptions.map((emoji) => (
                  <Chip
                    key={emoji}
                    selected={customization.emoji === emoji}
                    onPress={() => setCustomization(prev => ({ ...prev, emoji }))}
                    style={styles.emojiChip}
                  >
                    {emoji}
                  </Chip>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorContainer}>
                {colorOptions.map((color) => (
                  <View
                    key={color}
                    style={[
                      styles.colorChip,
                      { backgroundColor: color },
                      customization.color === color && styles.selectedColorChip
                    ]}
                    onTouchEnd={() => setCustomization(prev => ({ ...prev, color }))}
                  />
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                {categoryOptions.map((category) => (
                  <Chip
                    key={category}
                    selected={customization.category === category}
                    onPress={() => setCustomization(prev => ({ ...prev, category }))}
                    style={styles.categoryChip}
                  >
                    {category}
                  </Chip>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Tags</Text>
              <View style={styles.tagsContainer}>
                {customization.tags.map((tag) => (
                  <Chip
                    key={tag}
                    onClose={() => removeTag(tag)}
                    style={styles.tagChip}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
              <TextInput
                label="Add Tag"
                mode="outlined"
                onSubmitEditing={(e) => {
                  addTag(e.nativeEvent.text);
                  e.currentTarget.clear();
                }}
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </Card.Content>
      </Card>

      {/* Create Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleCreateVault}
          style={[styles.createButton, { backgroundColor: colors.accent }]}
          contentStyle={styles.createButtonContent}
        >
          Create Vault
        </Button>
      </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  walletItem: {
    marginBottom: 8,
  },
  configCard: {
    marginTop: 16,
    elevation: 1,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  customizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiContainer: {
    marginBottom: 16,
  },
  emojiChip: {
    marginRight: 8,
  },
  colorContainer: {
    marginBottom: 16,
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorChip: {
    borderColor: '#000',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  createButton: {
    borderRadius: 12,
  },
  createButtonContent: {
    paddingVertical: 8,
  },
});
