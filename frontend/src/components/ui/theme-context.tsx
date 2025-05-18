'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  enableSystem?: boolean;
};

export interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [primaryColor, setPrimaryColor] = useState<string>('#0284c7'); // Default sky-600
  const [secondaryColor, setSecondaryColor] = useState<string>('#7c3aed'); // Default violet-600
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [theme, setThemeState] = useState<string>(defaultTheme);

  const setTheme = (theme: string) => {
    setThemeState(theme);
  };

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
  };

  useEffect(() => {
    // Apply theme colors to CSS variables
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    
    // Apply high contrast mode if enabled
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [primaryColor, secondaryColor, isHighContrast]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        primaryColor,
        setPrimaryColor,
        secondaryColor,
        setSecondaryColor,
        isHighContrast,
        toggleHighContrast,
      }}
    >
      <NextThemesProvider
        attribute="class"
        defaultTheme={defaultTheme}
        enableSystem={enableSystem}
        {...props}
      >
        {children}
      </NextThemesProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
