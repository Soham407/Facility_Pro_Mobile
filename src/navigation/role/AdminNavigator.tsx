import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { PlaceholderScreen } from '../../screens/shared/PlaceholderScreen';
import type { AdminTabParamList } from '../../types/navigation';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const ROLE = 'Admin';

function DashboardScreen() {
  return <PlaceholderScreen screenName="Dashboard" roleName={ROLE} iconName="speedometer" />;
}
function StaffScreen() {
  return <PlaceholderScreen screenName="Staff" roleName={ROLE} iconName="people-circle" />;
}
function FinanceScreen() {
  return <PlaceholderScreen screenName="Finance" roleName={ROLE} iconName="wallet" />;
}
function SettingsScreen() {
  return <PlaceholderScreen screenName="Settings" roleName={ROLE} iconName="settings" />;
}

export function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60, paddingBottom: 8, paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color} /> }} />
      <Tab.Screen name="Staff" component={StaffScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people-circle" size={size} color={color} /> }} />
      <Tab.Screen name="Finance" component={FinanceScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
