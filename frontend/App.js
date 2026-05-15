import React from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import SignupScreen from './src/screens/Auth/SignupScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import ExploreScreen from './src/screens/Explore/ExploreScreen';
import UploadScreen from './src/screens/Upload/UploadScreen';
import ActivityScreen from './src/screens/Activity/ActivityScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';

// Theme
import { COLORS } from './src/theme/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Auth Stack - Login & Signup
 */
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

/**
 * Main Tab Navigator - 5-way bottom navigation
 */
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: COLORS.background,
        borderTopWidth: 0.5,
        borderTopColor: COLORS.border,
        height: 50,
        paddingBottom: 4,
      },
      tabBarActiveTintColor: COLORS.textPrimary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'HomeTab':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'ExploreTab':
            iconName = focused ? 'search' : 'search-outline';
            break;
          case 'UploadTab':
            iconName = focused ? 'add-circle' : 'add-circle-outline';
            break;
          case 'ActivityTab':
            iconName = focused ? 'heart' : 'heart-outline';
            break;
          case 'ProfileTab':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'ellipse-outline';
        }

        return <Ionicons name={iconName} size={26} color={color} />;
      },
    })}
  >
    <Tab.Screen name="HomeTab" component={HomeScreen} />
    <Tab.Screen name="ExploreTab" component={ExploreScreen} />
    <Tab.Screen name="UploadTab" component={UploadScreen} />
    <Tab.Screen name="ActivityTab" component={ActivityScreen} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} />
  </Tab.Navigator>
);

/**
 * Root Navigator - Switches between Auth and Main based on session
 */
const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

/**
 * App Root - Wraps everything in AuthProvider
 */
export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
