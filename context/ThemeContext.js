import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LightTheme = {
  colors: {
    background: '#F8F8F8', 
    text: 'black',        
    primary: '#4CC2FF',  
    cardBackground: '#edefef', 
    borderColor: '#E0E0E0',
    iconColor: 'black',
  },
  statusBarStyle: 'dark-content',
};

const DarkTheme = {
  colors: {
    background: '#000000',
    text: 'white',    
    primary: '#4CC2FF',   
    cardBackground: '#1a1a1a', 
    borderColor: 'white',
    iconColor: 'white',
  },
  statusBarStyle: 'light-content',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); 
  const [theme, setTheme] = useState(LightTheme); 

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme === 'dark') {
          setTheme(DarkTheme);
        } else if (savedTheme === 'light') {
          setTheme(LightTheme);
        } else {
          setTheme(systemColorScheme === 'dark' ? DarkTheme : LightTheme);
        }
      } catch (e) {
        console.error("Failed to load theme from AsyncStorage", e);
        setTheme(systemColorScheme === 'dark' ? DarkTheme : LightTheme);
      }
    };
    loadSavedTheme();
  }, [systemColorScheme]); 

  const toggleTheme = async () => {
    const newThemeName = theme === LightTheme ? 'dark' : 'light';
    const newTheme = newThemeName === 'dark' ? DarkTheme : LightTheme;
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('appTheme', newThemeName);
    } catch (e) {
      console.error("Failed to save theme to AsyncStorage", e);
    }
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      AsyncStorage.getItem('appTheme').then(savedTheme => {
        if (!savedTheme) { 
          setTheme(colorScheme === 'dark' ? DarkTheme : LightTheme);
        }
      });
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);