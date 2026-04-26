import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext({
  isDark: false,
  isHighContrast: false,
  toggleTheme: () => {},
  toggleHighContrast: (_value?: boolean) => {},
  theme: {
    bg: '#f5f5f5',
    card: '#ffffff',
    text: '#111111',
    secondaryText: '#4B5563',
    accent: '#CC2200',
    border: '#eeeeee',
  }
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [isHighContrast, setIsHighContrast] = useState(false);

  const lightTheme = {
    bg: '#f5f5f5',
    card: '#ffffff',
    text: '#111111',
    secondaryText: '#4B5563',
    accent: '#CC2200',
    border: '#eeeeee',
  };

  const darkTheme = {
    bg: '#000000',
    card: '#1A1A1A',
    text: '#FFFFFF',
    secondaryText: '#A0A0A0',
    accent: '#CC2200',
    border: '#2A2A2A',
  };

  const highContrastTheme = {
    bg: '#000000',
    card: '#000000',
    text: '#FFFFFF',
    secondaryText: '#FFFF00',
    accent: '#FFFF00',
    border: '#FFFFFF',
  };

  const theme = isHighContrast ? highContrastTheme : (isDark ? darkTheme : lightTheme);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleHighContrast = (value?: boolean) => {
    if (typeof value === 'boolean') {
      setIsHighContrast(value);
      return;
    }
    setIsHighContrast((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, isHighContrast, toggleTheme, toggleHighContrast, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);