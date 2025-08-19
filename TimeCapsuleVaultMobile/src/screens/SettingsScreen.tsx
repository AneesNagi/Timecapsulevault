import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  List,
  Switch,
  Divider,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode, toggleTheme } = useAppTheme();
  const [notifications, setNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [showBalances, setShowBalances] = useState(true);

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will export all your vault and wallet data as a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // Handle export logic here
            Alert.alert('Success', 'Data exported successfully');
          }
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your vaults, wallets, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? This will delete everything.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Everything', 
                  style: 'destructive',
                  onPress: () => {
                    // Handle clear data logic here
                    Alert.alert('Success', 'All data cleared');
                  }
                },
              ]
            );
          }
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://timecapsulevault.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://timecapsulevault.com/terms');
  };

  const openSupport = () => {
    Linking.openURL('mailto:support@timecapsulevault.com');
  };

  const openWebsite = () => {
    Linking.openURL('https://timecapsulevault.com');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.accent, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Avatar.Icon size={80} icon="cog" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
          <Title style={styles.headerTitle}>Settings</Title>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </View>
      </LinearGradient>

      {/* Appearance */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Title>
          
          <List.Item
            title="Dark Mode"
            description="Switch between light and dark themes"
            left={() => <List.Icon icon="theme-light-dark" color={colors.textSecondary} />}
            right={() => (
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                color={colors.accent}
              />
            )}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />
        </Card.Content>
      </Card>



      {/* Preferences */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Title>
          
          <List.Item
            title="Push Notifications"
            description="Receive alerts for vault activities"
            left={() => <List.Icon icon="bell" color={colors.textSecondary} />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={colors.accent}
              />
            )}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="Show Balances"
            description="Display vault and wallet balances"
            left={() => <List.Icon icon="eye" color={colors.textSecondary} />}
            right={() => (
              <Switch
                value={showBalances}
                onValueChange={setShowBalances}
                color={colors.accent}
              />
            )}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="Auto-Lock App"
            description="Automatically lock app when inactive"
            left={() => <List.Icon icon="lock-clock" color={colors.textSecondary} />}
            right={() => (
              <Switch
                value={autoLock}
                onValueChange={setAutoLock}
                color={colors.accent}
              />
            )}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />
        </Card.Content>
      </Card>

      {/* Security */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Security</Title>
          
          <List.Item
            title="Biometric Authentication"
            description="Use fingerprint or face ID to unlock"
            left={() => <List.Icon icon="fingerprint" color={colors.textSecondary} />}
            right={() => (
              <Switch
                value={biometricAuth}
                onValueChange={setBiometricAuth}
                color={colors.accent}
              />
            )}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="Change PIN"
            description="Update your app PIN"
            left={() => <List.Icon icon="key" color={colors.textSecondary} />}
            right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
            onPress={() => {
              // Handle change PIN
              Alert.alert('Change PIN', 'PIN change functionality coming soon');
            }}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="Export Data"
            description="Backup your vaults and wallets"
            left={() => <List.Icon icon="download" color={colors.textSecondary} />}
            right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
            onPress={handleExportData}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />
        </Card.Content>
      </Card>

      {/* Support */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Support</Title>
          
          <List.Item
            title="Help & FAQ"
            description="Get help and find answers"
            left={() => <List.Icon icon="help-circle" color={colors.textSecondary} />}
            right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
            onPress={() => {
              // Handle help
              Alert.alert('Help', 'Help section coming soon');
            }}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="Contact Support"
            description="Get in touch with our team"
            left={() => <List.Icon icon="email" color={colors.textSecondary} />}
            right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
            onPress={openSupport}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="Rate App"
            description="Rate us on the app store"
            left={() => <List.Icon icon="star" color={colors.textSecondary} />}
            right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
            onPress={() => {
              // Handle app rating
              Alert.alert('Rate App', 'App rating functionality coming soon');
            }}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />
        </Card.Content>
      </Card>

      {/* Legal */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>Legal</Title>
          
          <List.Item
            title="Privacy Policy"
            description="Read our privacy policy"
            left={() => <List.Icon icon="shield-check" color={colors.textSecondary} />}
            right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
            onPress={openPrivacyPolicy}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="Terms of Service"
            description="Read our terms of service"
            left={() => <List.Icon icon="file-document" color={colors.textSecondary} />}
            right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
            onPress={openTermsOfService}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="Open Source Licenses"
            description="View third-party licenses"
            left={() => <List.Icon icon="code-tags" color={colors.textSecondary} />}
            right={() => <List.Icon icon="chevron-right" color={colors.textSecondary} />}
            onPress={() => {
              // Handle licenses
              Alert.alert('Licenses', 'Open source licenses coming soon');
            }}
            titleStyle={{ color: colors.text }}
            descriptionStyle={{ color: colors.textSecondary }}
          />
        </Card.Content>
      </Card>

      {/* About */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.text }]}>About</Title>
          
          <View style={styles.aboutSection}>
            <Avatar.Icon size={60} icon="lock" style={{ backgroundColor: colors.accent }} />
            <View style={styles.aboutText}>
              <Title style={[styles.appName, { color: colors.text }]}>TimeCapsuleVault</Title>
              <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
              <Text style={[styles.appDescription, { color: colors.textSecondary }]}>
                Secure crypto storage with smart locks
              </Text>
            </View>
          </View>

          <View style={styles.aboutLinks}>
            <Button
              mode="text"
              icon="web"
              onPress={openWebsite}
              textColor={colors.accent}
            >
              Visit Website
            </Button>
            
            <Button
              mode="text"
              icon="github"
              onPress={() => Linking.openURL('https://github.com/TimeCapsuleVault')}
              textColor={colors.accent}
            >
              GitHub
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Title>
          
          <Button
            mode="outlined"
            icon="delete"
            onPress={handleClearData}
            style={[styles.dangerButton, { borderColor: colors.error }]}
            textColor={colors.error}
          >
            Clear All Data
          </Button>
        </Card.Content>
      </Card>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Made with ❤️ by the TimeCapsuleVault team
        </Text>
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
    marginTop: 15,
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
  aboutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutText: {
    marginLeft: 15,
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 5,
  },
  appDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  aboutLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dangerButton: {
    borderWidth: 2,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
