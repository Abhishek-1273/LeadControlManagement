import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import SplashScreen from '../screens/auth/SplashScreen';

export default function AppNavigator() {
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth(); // single source of truth — called once on app mount
  }, []);

  // Show splash while AsyncStorage is being read
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <EmployeeNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
