import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext'; 

import { TabNavigator, AuthStackScreen } from './navigation/Navigator';
import BlogDetailScreen from './screens/BlogDetailScreen';

const RootStack = createNativeStackNavigator();

function RootNavigatorContent() {
  const { userToken, isLoading } = useAuth();

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
          <RootStack.Screen name="BlogDetail" component={BlogDetailScreen} />
        </RootStack.Group>
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <View style={styles.container}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigatorContent /> 
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});