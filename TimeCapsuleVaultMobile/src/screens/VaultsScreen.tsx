import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  FlatList,
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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { useVault } from '../hooks/useVault';

export default function VaultsScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { vaults } = useVault('bsc-testnet');
  const [filteredVaults, setFilteredVaults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'locked' | 'unlocked' | 'goals'>('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  useEffect(() => {
    setFilteredVaults(vaults as any);
  }, [vaults]);

  useEffect(() => {
    let filtered = vaults;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((vault: any) =>
        (vault.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vault.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vault.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (filter) {
      case 'locked':
        filtered = filtered.filter((vault: any) => vault.isLocked);
        break;
      case 'unlocked':
        filtered = filtered.filter((vault: any) => !vault.isLocked);
        break;
      case 'goals':
        filtered = filtered.filter((vault: any) => vault.isGoalLocked);
        break;
      default:
        break;
    }

    setFilteredVaults(filtered);
  }, [vaults, searchQuery, filter]);

  const getStatusColor = (vault: Vault) => {
    if (!vault.isLocked) return colors.success;
    if (vault.isGoalLocked && vault.progressPercentage === 100) return colors.success;
    return colors.error;
  };

  const getStatusText = (vault: Vault) => {
    if (!vault.isLocked) return 'UNLOCKED';
    if (vault.isGoalLocked && vault.progressPercentage === 100) return 'GOAL COMPLETED';
    return 'LOCKED';
  };

  const renderVaultItem = ({ item: vault }: { item: any }) => (
    <Card style={[styles.vaultCard, { backgroundColor: colors.card }]}>
      <Card.Content>
        <View style={styles.vaultHeader}>
          <View style={styles.vaultInfo}>
            <Text style={[styles.vaultEmoji, { fontSize: 28 }]}>{vault.emoji || '🔒'}</Text>
            <View style={styles.vaultDetails}>
              <Title style={[styles.vaultName, { color: colors.text }]}>{vault.name || 'Vault'}</Title>
              <Text style={[styles.vaultDescription, { color: colors.textSecondary }]}>
                {vault.description || ''}
              </Text>
              <Text style={[styles.vaultAddress, { color: colors.textSecondary }]}>
                {vault.address}
              </Text>
            </View>
          </View>
          <Menu
            visible={menuVisible === vault.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(vault.id)}
                iconColor={colors.textSecondary}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                navigation.navigate('VaultDetails', { vault });
              }}
              title="View Details"
              leadingIcon="eye"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                // Handle edit vault
              }}
              title="Edit Vault"
              leadingIcon="pencil"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                // Handle withdraw
              }}
              title="Withdraw"
              leadingIcon="cash"
            />
          </Menu>
        </View>

        <View style={styles.vaultStatus}>
          <Chip 
            mode="outlined" 
            textStyle={{ color: getStatusColor(vault) }}
            style={{ borderColor: getStatusColor(vault) }}
          >
            {getStatusText(vault)}
          </Chip>
          {vault.category && (
            <Chip 
              mode="outlined" 
              textStyle={{ color: colors.accent }}
              style={{ borderColor: colors.accent, marginLeft: 8 }}
            >
              {vault.category}
            </Chip>
          )}
        </View>

        <View style={styles.vaultBalance}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance</Text>
          <Text style={[styles.balanceValue, { color: colors.accent }]}>
            {(Number(vault.balance) / 1e18).toFixed(6)} tBNB
          </Text>
        </View>

        {vault.isGoalLocked && vault.progressPercentage !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Goal Progress</Text>
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
            <Text style={[styles.progressText, { color: colors.textSecondary }]}> 
              {(Number(vault.currentAmount || 0) / 1e18).toFixed(6)} / {(Number(vault.goalAmount || 0) / 1e18).toFixed(6)} tBNB
            </Text>
          </View>
        )}

        {vault.isTimeLocked && vault.unlockTime && (
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              Unlocks in {Math.ceil(((Number(vault.unlockTime) * 1000) - Date.now()) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
        )}

        {vault.isPriceLocked && vault.targetPrice && (
          <View style={styles.priceContainer}>
            <Ionicons name="trending-up-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.priceText, { color: colors.textSecondary }]}>
              Target: ${(Number(vault.targetPrice) / 1e8).toFixed(2)} | Current: {(Number(vault.currentPrice || 0) / 1e8).toFixed(2)}
            </Text>
          </View>
        )}

        {vault.tags && vault.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {vault.tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} compact style={styles.tag}>
                {tag}
              </Chip>
            ))}
            {vault.tags.length > 3 && (
              <Chip compact style={styles.tag}>
                +{vault.tags.length - 3}
              </Chip>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const FilterChip = ({ label, value, selected }: { label: string; value: string; selected: boolean }) => (
    <Chip
      mode={selected ? 'flat' : 'outlined'}
      selected={selected}
      onPress={() => setFilter(value as any)}
      style={selected ? { backgroundColor: colors.accent } : {}}
      textStyle={{ color: selected ? 'white' : colors.text }}
    >
      {label}
    </Chip>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Title style={[styles.headerTitle, { color: colors.text }]}>My Vaults</Title>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {filteredVaults.length} vault{filteredVaults.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Searchbar
          placeholder="Search vaults..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: colors.input }]}
          iconColor={colors.textSecondary}
          inputStyle={{ color: colors.inputText }}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <FilterChip label="All" value="all" selected={filter === 'all'} />
          <FilterChip label="Locked" value="locked" selected={filter === 'locked'} />
          <FilterChip label="Unlocked" value="unlocked" selected={filter === 'unlocked'} />
          <FilterChip label="Goals" value="goals" selected={filter === 'goals'} />
        </ScrollView>
      </View>

      {/* Vaults List */}
      <FlatList
        data={filteredVaults}
        renderItem={renderVaultItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('CreateVault')}
      />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchbar: {
    marginBottom: 15,
    elevation: 0,
  },
  filtersContainer: {
    marginBottom: 10,
  },
  filtersContent: {
    paddingRight: 20,
    gap: 10,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  vaultCard: {
    marginBottom: 15,
    elevation: 2,
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  vaultInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  vaultEmoji: {
    marginRight: 12,
  },
  vaultDetails: {
    flex: 1,
  },
  vaultName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vaultDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  vaultAddress: {
    fontSize: 12,
  },
  vaultStatus: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  vaultBalance: {
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
  progressContainer: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceText: {
    fontSize: 12,
    marginLeft: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    marginRight: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

