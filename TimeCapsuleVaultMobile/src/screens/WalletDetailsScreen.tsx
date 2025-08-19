import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

export default function WalletDetailsScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { wallet } = route.params;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Wallet Details</Text>
      <Text style={[styles.info, { color: colors.textSecondary }]}>
        This screen can be used for detailed wallet information in the future.
      </Text>
      <Text style={[styles.walletName, { color: colors.text }]}>
        Wallet: {wallet.name}
      </Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.goBack()}
        style={{ marginTop: 20 }}
      >
        Go Back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
