import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('timecapsule-theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('timecapsule-theme', isDarkMode ? 'dark' : 'light');
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Update CSS custom properties
    const root = document.documentElement;
    if (isDarkMode) {
      root.style.setProperty('--bg-primary', '#181a20');
      root.style.setProperty('--bg-secondary', 'rgba(35, 37, 38, 0.9)');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#a0a0a0');
      root.style.setProperty('--border-color', 'rgba(65, 67, 69, 0.5)');
      root.style.setProperty('--accent-color', '#7f5af0');
      root.style.setProperty('--success-color', '#10b981');
      root.style.setProperty('--warning-color', '#f59e0b');
      root.style.setProperty('--error-color', '#ef4444');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', 'rgba(248, 250, 252, 0.9)');
      root.style.setProperty('--text-primary', '#1a202c');
      root.style.setProperty('--text-secondary', '#4a5568');
      root.style.setProperty('--border-color', 'rgba(226, 232, 240, 0.8)');
      root.style.setProperty('--accent-color', '#7f5af0');
      root.style.setProperty('--success-color', '#10b981');
      root.style.setProperty('--warning-color', '#f59e0b');
      root.style.setProperty('--error-color', '#ef4444');
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