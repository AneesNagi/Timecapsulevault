import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  route: any;
  focused: boolean;
  color: string;
  size: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ route, focused, color, size }) => {
  let iconName: keyof typeof Ionicons.glyphMap;

  if (route.name === 'Dashboard') {
    iconName = focused ? 'stats-chart' : 'stats-chart-outline';
  } else if (route.name === 'Vaults') {
    iconName = focused ? 'lock-closed' : 'lock-closed-outline';
  } else if (route.name === 'Wallet') {
    iconName = focused ? 'wallet' : 'wallet-outline';
  } else if (route.name === 'Settings') {
    iconName = focused ? 'settings' : 'settings-outline';
  } else {
    iconName = 'help-circle-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

