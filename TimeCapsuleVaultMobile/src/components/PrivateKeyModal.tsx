import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Clipboard,
} from 'react-native';
import {
  Dialog,
  Portal,
  Text,
  Button,
  TextInput,
  Card,
  IconButton,
} from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface PrivateKeyModalProps {
  visible: boolean;
  onDismiss: () => void;
  privateKey: string;
  walletName: string;
}

export const PrivateKeyModal: React.FC<PrivateKeyModalProps> = ({
  visible,
  onDismiss,
  privateKey,
  walletName,
}) => {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const authenticateUser = async () => {
    setIsAuthenticating(true);
    
    try {
      const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
      
      if (biometricEnabled === 'true') {
        // Try biometric first
        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to view private key',
            fallbackLabel: 'Use PIN',
          });
          
          if (result.success) {
            setIsAuthenticated(true);
            setShowPrivateKey(true);
            setIsAuthenticating(false);
            return;
          }
        } catch (error) {
          console.log('Biometric auth failed, falling back to PIN');
        }
        
        // If biometric fails, validate PIN
        const storedPin = await SecureStore.getItemAsync('wallet_pin');
        if (storedPin && pin === storedPin) {
          setIsAuthenticated(true);
          setShowPrivateKey(true);
        } else {
          Alert.alert('Error', 'Invalid PIN');
        }
      } else {
        // No security setup, show directly
        setIsAuthenticated(true);
        setShowPrivateKey(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Authentication failed');
    }
    
    setIsAuthenticating(false);
  };

  const copyToClipboard = () => {
    Clipboard.setString(privateKey);
    Alert.alert('Copied', 'Private key copied to clipboard');
  };

  const handleDismiss = () => {
    setPin('');
    setIsAuthenticated(false);
    setShowPrivateKey(false);
    onDismiss();
  };

  const renderAuthenticationForm = () => (
    <View>
      <Text style={[styles.warning, { color: colors.error }]}>
        ⚠️ Your private key gives full access to your wallet. Never share it with anyone!
      </Text>
      
      <TextInput
        label="Enter PIN"
        value={pin}
        onChangeText={setPin}
        mode="outlined"
        secureTextEntry
        keyboardType="numeric"
        style={styles.pinInput}
      />
      
      <Button
        mode="contained"
        onPress={authenticateUser}
        loading={isAuthenticating}
        disabled={isAuthenticating || (!pin && pin.length < 4)}
        style={styles.authButton}
      >
        Authenticate
      </Button>
    </View>
  );

  const renderPrivateKey = () => (
    <View>
      <Text style={[styles.warning, { color: colors.error }]}>
        ⚠️ Keep this private key safe and secure. Anyone with this key can access your wallet!
      </Text>
      
      <Card style={[styles.keyCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.keyContainer}>
            <Text style={[styles.keyText, { color: colors.text }]}>
              {privateKey}
            </Text>
            <IconButton
              icon="content-copy"
              size={20}
              onPress={copyToClipboard}
              iconColor={colors.accent}
            />
          </View>
        </Card.Content>
      </Card>
      
      <Text style={[styles.instructions, { color: colors.textSecondary }]}>
        • Save this key in a secure location
        • Never share it with anyone
        • You need this key to recover your wallet
      </Text>
    </View>
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title style={{ color: colors.text }}>
          Export Private Key - {walletName}
        </Dialog.Title>
        <Dialog.Content>
          {!isAuthenticated || !showPrivateKey ? renderAuthenticationForm() : renderPrivateKey()}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss}>
            {showPrivateKey ? 'Close' : 'Cancel'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  warning: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  pinInput: {
    marginBottom: 15,
  },
  authButton: {
    marginTop: 10,
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
  instructions: {
    fontSize: 12,
    lineHeight: 18,
  },
});
