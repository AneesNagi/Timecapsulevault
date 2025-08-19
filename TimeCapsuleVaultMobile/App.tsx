import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import VaultsScreen from './src/screens/VaultsScreen';
import WalletScreen from './src/screens/WalletScreen';
import CreateVaultScreen from './src/screens/CreateVaultScreen';
import VaultDetailsScreen from './src/screens/VaultDetailsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SecuritySetupScreen from './src/screens/SecuritySetupScreen';
import WalletDetailsScreen from './src/screens/WalletDetailsScreen';

// Import components
import { TabBarIcon } from './src/components/TabBarIcon';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NetworkProvider } from './src/contexts/NetworkContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          return <TabBarIcon route={route} focused={focused} color={color} size={size} />;
        },
        tabBarActiveTintColor: '#7f5af0',
        tabBarInactiveTintColor: isDark ? '#666' : '#999',
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderTopColor: isDark ? '#333' : '#e0e0e0',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Vaults" 
        component={VaultsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = isDark ? DarkTheme : DefaultTheme;
  const customTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: '#7f5af0',
      accent: '#7f5af0',
      background: isDark ? '#0d1117' : '#f8fafc',
      surface: isDark ? '#1a1a1a' : '#ffffff',
      text: isDark ? '#ffffff' : '#000000',
      placeholder: isDark ? '#666' : '#999',
    },
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={customTheme}>
        <ThemeProvider>
          <NetworkProvider>
            <NavigationContainer>
              <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
              >
                <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen 
                name="CreateVault" 
                component={CreateVaultScreen}
                options={{
                  headerShown: true,
                  title: 'Create Vault',
                  headerStyle: {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  },
                  headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
              />
              <Stack.Screen 
                name="VaultDetails" 
                component={VaultDetailsScreen}
                options={{
                  headerShown: true,
                  title: 'Vault Details',
                  headerStyle: {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  },
                  headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
                />
              <Stack.Screen 
                name="SecuritySetup" 
                component={SecuritySetupScreen}
                options={{
                  headerShown: true,
                  title: 'Security Setup',
                  headerStyle: {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  },
                  headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
                />
              <Stack.Screen 
                name="WalletDetails" 
                component={WalletDetailsScreen}
                options={{
                  headerShown: true,
                  title: 'Wallet Details',
                  headerStyle: {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  },
                  headerTintColor: isDark ? '#ffffff' : '#000000',
                }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </NetworkProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
