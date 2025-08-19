import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    card: string;
    input: string;
    inputBorder: string;
    inputText: string;
    inputPlaceholder: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Default to system preference, fallback to false if undefined
    return systemColorScheme === 'dark' || false;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('timecapsule-theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference to storage
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('timecapsule-theme', isDarkMode ? 'dark' : 'light');
      } catch (error) {
        console.log('Error saving theme:', error);
      }
    };
    saveTheme();
  }, [isDarkMode]);

  const getColors = (darkMode: boolean) => ({
    primary: '#7f5af0',
    secondary: '#6b46c1',
    background: darkMode ? '#0d1117' : '#f8fafc',
    surface: darkMode ? '#1a1a1a' : '#ffffff',
    text: darkMode ? '#ffffff' : '#1a202c',
    textSecondary: darkMode ? '#a0a0a0' : '#4a5568',
    border: darkMode ? 'rgba(65, 67, 69, 0.5)' : 'rgba(226, 232, 240, 0.8)',
    accent: '#7f5af0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    card: darkMode ? 'rgba(35, 37, 38, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    input: darkMode ? '#2d3748' : '#ffffff',
    inputBorder: darkMode ? '#4a5568' : '#e2e8f0',
    inputText: darkMode ? '#ffffff' : '#1a202c',
    inputPlaceholder: darkMode ? '#a0a0a0' : '#718096',
  });

  const colors = getColors(isDarkMode);

  // Provide a loading fallback if theme is not yet loaded
  if (!isLoaded) {
    const defaultColors = getColors(false); // Default to light theme during loading
    return (
      <ThemeContext.Provider value={{ isDarkMode: false, toggleTheme, setTheme, colors: defaultColors }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Provide a fallback theme instead of throwing an error
    console.warn('useTheme must be used within a ThemeProvider. Using fallback theme.');
    const defaultColors = {
      primary: '#7f5af0',
      secondary: '#6b46c1',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1a202c',
      textSecondary: '#4a5568',
      border: 'rgba(226, 232, 240, 0.8)',
      accent: '#7f5af0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      card: 'rgba(255, 255, 255, 0.9)',
      input: '#ffffff',
      inputBorder: '#e2e8f0',
      inputText: '#1a202c',
      inputPlaceholder: '#718096',
    };
    return {
      isDarkMode: false,
      toggleTheme: () => {},
      setTheme: () => {},
      colors: defaultColors,
    };
  }
  return context;
};

