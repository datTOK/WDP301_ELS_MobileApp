import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AchievementScreen from '../screens/AchievementScreen';
import CoursesScreen from '../screens/CoursesScreen';
import MembershipScreen from '../screens/MembershipScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BlogScreen from '../screens/BlogScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import ChangePasswordScreen from '../screens/Auth/ChangePasswordScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import CourseOverviewScreen from '../screens/CourseOverviewScreen';
import CourseLessonScreen from '../screens/CourseLessonScreen';
import TestScreen from '../screens/TestScreen';
import TestScreenDetail from '../screens/TestScreenDetail';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BlogStackScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#202020' },
      }}
    >
      <Stack.Screen name="Blog" component={BlogScreen} />
      <Stack.Screen
        name="BlogDetail"
        component={BlogDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export function ProfileStackScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#202020' },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}

function CoursesStackScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#202020' },
      }}
    >
      <Stack.Screen name="CoursesList" component={CoursesScreen} />
      <Stack.Screen
        name="CourseOverview"
        component={CourseOverviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CourseLesson"
        component={CourseLessonScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TestScreen"
        component={TestScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TestScreenDetail"
        component={TestScreenDetail}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function MyCoursesStackScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#202020' },
      }}
    >
      {/* <Stack.Screen name="MyCoursesList" component={MyCoursesScreen} /> */}
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Course Details',
          headerStyle: { backgroundColor: '#2B2B2B' },
          headerTintColor: '#ededed',
        }}
      />
    </Stack.Navigator>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Achievements') {
            iconName = 'trophy';
          } else if (route.name === 'Courses') {
            iconName = 'book';
          } else if (route.name === 'Membership') {
            iconName = 'card';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'BlogTab') {
            iconName = 'newspaper';
          }
          // } else if (route.name === 'MyCourses') {
          //   iconName = 'school';
          // }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CC2FF',
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarStyle: {
          backgroundColor: '#2B2B2B',
          borderTopWidth: 1,
          borderTopColor: '#1D1D1D',
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Mulish-Medium',
        },
      })
      }
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Achievements" component={AchievementScreen} />
      <Tab.Screen name="Courses" component={CoursesStackScreen} options={{ tabBarLabel: 'Courses' }} />
      <Tab.Screen name="Membership" component={MembershipScreen} />
      <Tab.Screen name="BlogTab" component={BlogStackScreen} options={{ tabBarLabel: 'Blog' }} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </ Tab.Navigator>
  );
}

export function AuthStackScreen() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#202020' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="GuestHome" component={HomeScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { userToken } = useAuth();

  return userToken == null ? <AuthStackScreen /> : <TabNavigator />;
}

// Default export for App.js
export default function Navigator() {
  return <AppNavigator />;
}