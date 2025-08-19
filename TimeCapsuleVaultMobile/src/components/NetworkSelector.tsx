import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { useNetwork } from '../contexts/NetworkContext';
import { SUPPORTED_NETWORKS } from '../constants/networks';

interface NetworkSelectorProps {
  compact?: boolean;
  onNetworkChange?: (networkId: string) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ 
  compact = false, 
  onNetworkChange 
}) => {
  const { colors } = useTheme();
  const { selectedNetwork, setSelectedNetwork } = useNetwork();

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetwork(networkId);
    onNetworkChange?.(networkId);
  };

  const getNetworkColor = (networkId: string) => {
    switch (networkId) {
      case 'arbitrum-sepolia':
        return '#28A0F0'; // Arbitrum blue
      default:
        return colors.accent;
    }
  };

  const getNetworkIcon = (networkId: string) => {
    switch (networkId) {
      case 'arbitrum-sepolia':
        return '🔵'; // Arbitrum symbol
      default:
        return '?';
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Network</Text>
        <View style={styles.compactButtons}>
          {SUPPORTED_NETWORKS.map((network) => (
            <Button
              key={network.id}
              mode={selectedNetwork === network.id ? 'contained' : 'outlined'}
              onPress={() => handleNetworkSelect(network.id)}
              style={[
                styles.compactButton,
                selectedNetwork === network.id && {
                  backgroundColor: getNetworkColor(network.id)
                }
              ]}
              labelStyle={[
                styles.compactButtonLabel,
                { color: selectedNetwork === network.id ? '#fff' : colors.text }
              ]}
              compact
            >
              {getNetworkIcon(network.id)} {network.name.replace(' Testnet', '')}
            </Button>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Select Network</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Choose the blockchain network for your wallet
      </Text>
      
      {SUPPORTED_NETWORKS.map((network) => (
        <Card
          key={network.id}
          style={[
            styles.networkCard,
            { 
              backgroundColor: colors.card,
              borderColor: selectedNetwork === network.id ? getNetworkColor(network.id) : colors.border,
              borderWidth: selectedNetwork === network.id ? 2 : 1
            }
          ]}
          onPress={() => handleNetworkSelect(network.id)}
        >
          <Card.Content style={styles.networkContent}>
            <View style={styles.networkHeader}>
              <View style={[
                styles.networkIcon,
                { backgroundColor: getNetworkColor(network.id) }
              ]}>
                <Text style={styles.networkIconText}>
                  {getNetworkIcon(network.id)}
                </Text>
              </View>
              
              <View style={styles.networkInfo}>
                <Text style={[styles.networkName, { color: colors.text }]}>
                  {network.name}
                </Text>
                <Text style={[styles.networkDetails, { color: colors.textSecondary }]}>
                  Chain ID: {network.chainId} • Currency: {network.currency}
                </Text>
              </View>
              
              {selectedNetwork === network.id && (
                <View style={[styles.selectedIndicator, { backgroundColor: getNetworkColor(network.id) }]}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.networkDescription, { color: colors.textSecondary }]}>
              {network.id === 'arbitrum-sepolia' ? 'Arbitrum Testnet' : 'Unknown Network'}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  networkCard: {
    marginBottom: 16,
    elevation: 2,
  },
  networkContent: {
    padding: 16,
  },
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  networkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  networkIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  networkDetails: {
    fontSize: 12,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  networkDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  compactContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  compactButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  compactButtonLabel: {
    fontSize: 12,
  },
});
