import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorMode } from '@chakra-ui/react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { colorMode, setColorMode } = useColorMode();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('timecapsule-theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setColorMode(newMode ? 'dark' : 'light');
  };

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
    setColorMode(isDark ? 'dark' : 'light');
  };

  useEffect(() => {
    // Sync with Chakra UI color mode
    setColorMode(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorMode]);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('timecapsule-theme', isDarkMode ? 'dark' : 'light');
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Update CSS custom properties for additional styling
    const root = document.documentElement;
    if (isDarkMode) {
      root.style.setProperty('--bg-primary', '#0d1117');
      root.style.setProperty('--bg-secondary', 'rgba(35, 37, 38, 0.9)');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#a0a0a0');
      root.style.setProperty('--border-color', 'rgba(65, 67, 69, 0.5)');
      root.style.setProperty('--accent-color', '#7f5af0');
      root.style.setProperty('--success-color', '#10b981');
      root.style.setProperty('--warning-color', '#f59e0b');
      root.style.setProperty('--error-color', '#ef4444');
      root.style.setProperty('--card-bg', 'rgba(35, 37, 38, 0.9)');
      root.style.setProperty('--input-bg', '#2d3748');
      root.style.setProperty('--input-border', '#4a5568');
      root.style.setProperty('--input-text', '#ffffff');
      root.style.setProperty('--input-placeholder', '#a0a0a0');
    } else {
      root.style.setProperty('--bg-primary', '#f8fafc');
      root.style.setProperty('--bg-secondary', 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--text-primary', '#1a202c');
      root.style.setProperty('--text-secondary', '#4a5568');
      root.style.setProperty('--border-color', 'rgba(226, 232, 240, 0.8)');
      root.style.setProperty('--accent-color', '#7f5af0');
      root.style.setProperty('--success-color', '#10b981');
      root.style.setProperty('--warning-color', '#f59e0b');
      root.style.setProperty('--error-color', '#ef4444');
      root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--input-border', '#e2e8f0');
      root.style.setProperty('--input-text', '#1a202c');
      root.style.setProperty('--input-placeholder', '#718096');
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 