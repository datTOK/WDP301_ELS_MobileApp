import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import * as Font from 'expo-font';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import Navigator from './navigation/Navigator';
import LoadingSpinner from './components/LoadingSpinner';

// Import all screens
import LoginScreen from './screens/Auth/LoginScreen';
import SignupScreen from './screens/Auth/SignupScreen';
import ChangePasswordScreen from './screens/Auth/ChangePasswordScreen';
import HomeScreen from './screens/HomeScreen';
import CoursesScreen from './screens/CoursesScreen';
import CourseDetailScreen from './screens/CourseDetailScreen';
import CourseOverviewScreen from './screens/CourseOverviewScreen';
import CourseLessonScreen from './screens/CourseLessonScreen';
import TestScreen from './screens/TestScreen';
import TestScreenDetail from './screens/TestScreenDetail';
import ProfileScreen from './screens/ProfileScreen';
import MyCoursesScreen from './screens/MyCoursesScreen';
import MembershipScreen from './screens/MembershipScreen';
import BlogScreen from './screens/BlogScreen';
import BlogDetailScreen from './screens/BlogDetailScreen';
import AchievementScreen from './screens/AchievementScreen';
import FlashcardSetsScreen from './screens/FlashcardSetsScreen';
import FlashcardSetDetailScreen from './screens/FlashcardSetDetailScreen';
import MyFlashcardSetsScreen from './screens/MyFlashcardSetsScreen';
import CreateFlashcardSetScreen from './screens/CreateFlashcardSetScreen';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Mulish-Regular': require('./assets/fonts/Mulish-Regular.ttf'),
          'Mulish-Medium': require('./assets/fonts/Mulish-Medium.ttf'),
          'Mulish-SemiBold': require('./assets/fonts/Mulish-SemiBold.ttf'),
          'Mulish-Bold': require('./assets/fonts/Mulish-Bold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue without fonts if loading fails
      }
    }

    loadFonts();
  }, []);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#202020', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner fullScreen text="Loading ELS..." />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmationProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                  headerShown: false,
                  cardStyle: { backgroundColor: '#202020' },
                }}
              >
                {/* Auth Screens */}
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                
                {/* Main App Screens */}
                <Stack.Screen name="Main" component={Navigator} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Courses" component={CoursesScreen} />
                <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
                <Stack.Screen name="CourseOverview" component={CourseOverviewScreen} />
                <Stack.Screen name="CourseLesson" component={CourseLessonScreen} />
                <Stack.Screen name="Test" component={TestScreen} />
                <Stack.Screen name="TestScreenDetail" component={TestScreenDetail} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
                <Stack.Screen name="Membership" component={MembershipScreen} />
                <Stack.Screen name="Blog" component={BlogScreen} />
                <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
                <Stack.Screen name="Achievement" component={AchievementScreen} />
                
                {/* Flashcard Screens */}
                <Stack.Screen name="FlashcardSets" component={FlashcardSetsScreen} />
                <Stack.Screen name="FlashcardSetDetail" component={FlashcardSetDetailScreen} />
                <Stack.Screen name="MyFlashcardSets" component={MyFlashcardSetsScreen} />
                <Stack.Screen name="CreateFlashcardSet" component={CreateFlashcardSetScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </ConfirmationProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}