// components/TopBar.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header as HeaderRNE } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

const TopBar = () => {
  const navigation = useNavigation();
  
  // Try to get theme, but provide fallbacks if not available
  let theme;
  let hasTheme = false;
  
  try {
    const { useTheme } = require('../context/ThemeContext');
    const themeContext = useTheme();
    if (themeContext && themeContext.theme) {
      theme = themeContext.theme;
      hasTheme = true;
    }
  } catch (error) {
    // Theme context not available
  }
  
  // Fallback theme values - using dark ELS colors
  const fallbackTheme = {
    colors: {
      cardBackground: '#2B2B2B',
      borderColor: '#1D1D1D',
      text: '#ededed',
    },
    typography: {
      fontFamily: {
        bold: 'Mulish-Bold',
      },
      fontSize: {
        lg: 18,
      },
    }
  };
  
  const currentTheme = hasTheme ? theme : fallbackTheme;

  const handleArrowUpPress = () => {
    navigation.navigate('Profile');
  };

  return (
    <HeaderRNE
      rightComponent={
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={{ marginLeft: 10 }}
            onPress={handleArrowUpPress}
          >
            <Ionicons name="person" color={currentTheme.colors.text} size={25} />
          </TouchableOpacity>
        </View>
      }
      centerComponent={{ 
        text: 'ELS Learning', 
        style: [styles.heading, { 
          color: currentTheme.colors.text,
          fontFamily: currentTheme.typography?.fontFamily?.bold || 'Mulish-Bold',
          fontSize: currentTheme.typography?.fontSize?.lg || 18,
        }] 
      }}
      backgroundColor={currentTheme.colors.cardBackground}
      containerStyle={[styles.headerContainer, { 
        backgroundColor: currentTheme.colors.cardBackground,
        borderBottomColor: currentTheme.colors.borderColor,
      }]}
    />
  );
};

export default TopBar;

const styles = StyleSheet.create({
  heading: {
    fontWeight: 'bold',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 5,
  },
  headerContainer: {
    borderBottomWidth: 1, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    paddingHorizontal: 20,
  },
});