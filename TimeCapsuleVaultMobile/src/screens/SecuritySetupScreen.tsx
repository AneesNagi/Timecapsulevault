import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  Switch,
  Avatar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function SecuritySetupScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    const checkBiometricSupport = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);
      setBiometricEnabled(compatible && enrolled);
    };
    checkBiometricSupport();
  }, []);

  const handleSetupSecurity = async () => {
    if (biometricEnabled) {
      if (pin.length < 4) {
        Alert.alert('Error', 'PIN must be at least 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        Alert.alert('Error', 'PINs do not match');
        return;
      }
    }

    setIsSettingUp(true);

    try {
      if (biometricEnabled) {
        await SecureStore.setItemAsync('wallet_pin', pin);
        await SecureStore.setItemAsync('biometric_enabled', 'true');
      } else {
        await SecureStore.setItemAsync('biometric_enabled', 'false');
      }
      
      await SecureStore.setItemAsync('security_setup_completed', 'true');
      
      Alert.alert(
        'Success', 
        'Security setup completed successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Security setup error:', error);
      Alert.alert('Error', 'Failed to setup security. Please try again.');
    }

    setIsSettingUp(false);
  };

  const handleSkip = async () => {
    try {
      await SecureStore.setItemAsync('security_setup_completed', 'true');
      await SecureStore.setItemAsync('biometric_enabled', 'false');
      navigation.goBack();
    } catch (error) {
      console.error('Skip security setup error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Avatar.Icon 
          size={80} 
          icon="shield-check" 
          style={[styles.icon, { backgroundColor: colors.accent }]} 
        />
        
        <Title style={[styles.title, { color: colors.text }]}>
          Secure Your Wallets
        </Title>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Set up biometric authentication and PIN protection to keep your crypto wallets secure.
        </Text>

        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content>
            <View style={styles.optionRow}>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Enable Security Protection
                </Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {isBiometricSupported 
                    ? 'Use biometric authentication and PIN' 
                    : 'Use PIN protection for your wallets'
                  }
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
              />
            </View>

            {!isBiometricSupported && biometricEnabled && (
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Biometric authentication is not available on this device. PIN protection will be used.
              </Text>
            )}

            {biometricEnabled && (
              <View style={styles.pinContainer}>
                <TextInput
                  label="Enter PIN (4+ digits)"
                  value={pin}
                  onChangeText={setPin}
                  mode="outlined"
                  secureTextEntry
                  keyboardType="numeric"
                  style={styles.pinInput}
                />
                <TextInput
                  label="Confirm PIN"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  mode="outlined"
                  secureTextEntry
                  keyboardType="numeric"
                  style={styles.pinInput}
                />
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSetupSecurity}
            loading={isSettingUp}
            disabled={isSettingUp || (biometricEnabled && (pin.length < 4 || pin !== confirmPin))}
            style={styles.setupButton}
          >
            Setup Security
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleSkip}
            disabled={isSettingUp}
            style={styles.skipButton}
          >
            Skip for Now
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  card: {
    marginBottom: 30,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionText: {
    flex: 1,
    marginRight: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
  },
  warningText: {
    fontSize: 12,
    marginBottom: 15,
  },
  pinContainer: {
    marginTop: 10,
  },
  pinInput: {
    marginBottom: 15,
  },
  buttonContainer: {
    gap: 15,
  },
  setupButton: {
    paddingVertical: 5,
  },
  skipButton: {
    paddingVertical: 5,
  },
});
