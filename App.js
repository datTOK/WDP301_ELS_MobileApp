import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TabNavigator, AuthStackScreen, ProfileStackScreen } from './navigation/Navigator';

const RootStack = createNativeStackNavigator();

function RootNavigatorContent() {
  const { userToken, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CC2FF" />
        <Text style={styles.loadingText}>Loading application...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        <RootStack.Screen name="Auth" component={AuthStackScreen} />
      ) : (
        <RootStack.Group>
          <RootStack.Screen name="MainTabs" component={TabNavigator} />
          <RootStack.Screen name="ProfileStack" component={ProfileStackScreen} />
        </RootStack.Group>
      )}
    </RootStack.Navigator>
  );
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <NavigationContainer>
        <RootNavigatorContent />
      </NavigationContainer>
      <StatusBar style={theme.statusBarStyle} />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});