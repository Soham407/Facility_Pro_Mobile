import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { PlaceholderScreen } from '../../screens/shared/PlaceholderScreen';
import type { SupervisorTabParamList } from '../../types/navigation';

const Tab = createBottomTabNavigator<SupervisorTabParamList>();
const ROLE = 'Security Supervisor';

function DashboardScreen() {
  return <PlaceholderScreen screenName="Dashboard" roleName={ROLE} iconName="grid" />;
}
function GuardsScreen() {
  return <PlaceholderScreen screenName="Guards" roleName={ROLE} iconName="shield" />;
}
function AlertsScreen() {
  return <PlaceholderScreen screenName="Alerts" roleName={ROLE} iconName="notifications" />;
}
function ReportsScreen() {
  return <PlaceholderScreen screenName="Reports" roleName={ROLE} iconName="bar-chart" />;
}

export function SupervisorNavigator() {
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
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
      <Tab.Screen name="Guards" component={GuardsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="shield" size={size} color={color} /> }} />
      <Tab.Screen name="Alerts" component={AlertsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} /> }} />
      <Tab.Screen name="Reports" component={ReportsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
