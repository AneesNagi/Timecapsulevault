import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  Surface,
  Chip,
  Avatar,
  List,
  Divider,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { useNetwork } from '../contexts/NetworkContext';
import { VaultStats } from '../types';
import { useVault } from '../hooks/useVault';
import { SUPPORTED_NETWORKS } from '../constants/networks';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { colors } = useAppTheme();
  const { selectedNetwork, network } = useNetwork();
  const [refreshing, setRefreshing] = useState(false);
  const { vaults } = useVault(selectedNetwork);
  const [stats, setStats] = useState<VaultStats>({
    totalVaults: 0,
    totalValue: '0',
    lockedValue: '0',
    unlockedValue: '0',
    activeGoals: 0,
    completedGoals: 0,
    avgLockDuration: 0,
    successRate: 0,
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  useEffect(() => {
    const totalBalance = vaults.reduce((acc, v) => acc + Number(v.balance) / 1e18, 0);
    const locked = vaults.filter(v => v.isLocked).reduce((acc, v) => acc + Number(v.balance) / 1e18, 0);
    const unlocked = totalBalance - locked;
    const goals = vaults.filter(v => v.isGoalLocked);
    setStats({
      totalVaults: vaults.length,
      totalValue: totalBalance.toFixed(4),
      lockedValue: locked.toFixed(4),
      unlockedValue: unlocked.toFixed(4),
      activeGoals: goals.length,
      completedGoals: goals.filter(g => g.progressPercentage >= 100).length,
      avgLockDuration: 0,
      successRate: 0,
    });
  }, [vaults]);

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statHeader}>
          <Avatar.Icon size={40} icon={icon} style={{ backgroundColor: color }} />
          <View style={styles.statText}>
            <Title style={[styles.statValue, { color: colors.text }]}>{value}</Title>
            <Paragraph style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Paragraph>
          </View>
        </View>
        {subtitle && (
          <Paragraph style={[styles.statSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  const VaultCard = ({ vault }: { vault: any }) => (
    <Card style={[styles.vaultCard, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('VaultDetails', { vault })}>
      <Card.Content>
        <View style={styles.vaultHeader}>
          <View style={styles.vaultInfo}>
            <Text style={[styles.vaultEmoji, { fontSize: 24 }]}>{vault.emoji}</Text>
            <View style={styles.vaultDetails}>
              <Title style={[styles.vaultName, { color: colors.text }]}>{vault.name || 'Vault'}</Title>
              <Text style={[styles.vaultAddress, { color: colors.textSecondary }]}>{vault.address}</Text>
            </View>
          </View>
          <Chip 
            mode="outlined" 
            textStyle={{ color: vault.isLocked ? colors.error : colors.success }}
            style={{ borderColor: vault.isLocked ? colors.error : colors.success }}
          >
            {vault.isLocked ? 'LOCKED' : 'UNLOCKED'}
          </Chip>
        </View>
        
        <View style={styles.vaultBalance}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance</Text>
          <Text style={[styles.balanceValue, { color: colors.accent }]}>
            {(Number(vault.balance) / 1e18).toFixed(6)} {network.currency}
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
          </View>
        )}

        {vault.isTimeLocked && vault.unlockTime && (
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              Unlocks in {Math.ceil((Number(vault.unlockTime) * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.accent, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>TimeCapsuleVault</Title>
          <Text style={styles.headerSubtitle}>Secure Crypto Storage</Text>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Value"
          value={`${stats.totalValue} ${network.currency}`}
          subtitle="Across all vaults"
          icon="wallet"
          color={colors.accent}
        />
        <StatCard
          title="Active Vaults"
          value={stats.totalVaults.toString()}
          subtitle="Created vaults"
          icon="lock"
          color={colors.success}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          subtitle="Goal completion"
          icon="trophy"
          color={colors.warning}
        />
      </View>

      {/* Quick Actions */}
      <Card style={[styles.actionsCard, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Title>
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate('CreateVault')}
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
            >
              Create Vault
            </Button>
            <Button
              mode="outlined"
              icon="wallet"
              onPress={() => navigation.navigate('Wallet')}
              style={styles.actionButton}
            >
              Manage Wallets
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Vaults */}
      <View style={styles.vaultsContainer}>
        <View style={styles.sectionHeader}>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Recent Vaults</Title>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Vaults')}
            textColor={colors.accent}
          >
            View All
          </Button>
        </View>
        
        {vaults.map((vault) => (
          <VaultCard key={vault.id} vault={vault} />
        ))}
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
  statsContainer: {
    padding: 20,
    gap: 15,
  },
  statCard: {
    marginBottom: 0,
    elevation: 2,
  },
  statCardContent: {
    padding: 20,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statText: {
    marginLeft: 15,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 0,
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 5,
  },
  actionsCard: {
    margin: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  vaultsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
    alignItems: 'center',
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
    marginBottom: 2,
  },
  vaultAddress: {
    fontSize: 12,
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
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 5,
  },
});

