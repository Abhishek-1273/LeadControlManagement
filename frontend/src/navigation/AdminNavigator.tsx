import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminLeadsScreen from '../screens/admin/AdminLeadsScreen';
import AdminEmployeesScreen from '../screens/admin/AdminEmployeesScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AddEmployeeScreen from '../screens/admin/AddEmployeeScreen';
import EmployeeDetailScreen from '../screens/admin/EmployeeDetailScreen';
import AdminLeadDetailScreen from '../screens/admin/AdminLeadDetailScreen';
import AssignLeadScreen from '../screens/admin/AssignLeadScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AdminTabs() {
    const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 60 + insets.bottom, 
          paddingBottom: insets.bottom + 4, 
          paddingTop: 8,
          elevation: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'AdminLeads') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'AdminEmployees') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'AdminProfile') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: route.name === 'AdminDashboard' ? 'Dashboard'
          : route.name === 'AdminLeads' ? 'Leads'
          : route.name === 'AdminEmployees' ? 'Employees'
          : 'Settings',
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="AdminLeads" component={AdminLeadsScreen} />
      <Tab.Screen name="AdminEmployees" component={AdminEmployeesScreen} />
      <Tab.Screen name="AdminProfile" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <Stack.Screen name="AdminLeadDetail" component={AdminLeadDetailScreen} />
      <Stack.Screen name="AssignLead" component={AssignLeadScreen} />
    </Stack.Navigator>
  );
}