import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "user-theme-mode";

const getStoredTheme = async (): Promise<ThemeMode | null> => {
    if (Platform.OS === "web") {
        try {
            return localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
        } catch (e) {
            console.error("Błąd odczytu z localStorage", e);
            return null;
        }
    } else {
        const savedMode = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        return savedMode as ThemeMode | null;
    }
};

const setStoredTheme = async (mode: ThemeMode) => {
    if (Platform.OS === "web") {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (e) {
            console.error("Błąd zapisu do localStorage", e);
        }
    } else {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        // Załaduj zapisany motyw przy starcie 
        getStoredTheme().then((savedMode) => {
            if (savedMode) {
                setThemeModeState(savedMode);
            }
        });
    }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode); // Aktualizacja stanu UI
    await setStoredTheme(mode); // Zapis do pamięci przeglądarki/telefonu!
  };

  // Oblicz wynikowy schemat kolorów
  const colorScheme = themeMode === 'system' 
    ? (systemColorScheme || 'light') 
    : themeMode;

  return (
    <ThemeContext.Provider value={{ themeMode, colorScheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};