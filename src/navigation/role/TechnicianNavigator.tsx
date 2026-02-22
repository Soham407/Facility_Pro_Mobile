import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { PlaceholderScreen } from '../../screens/shared/PlaceholderScreen';
import type { TechnicianTabParamList } from '../../types/navigation';

const Tab = createBottomTabNavigator<TechnicianTabParamList>();
const ROLE = 'Technician';

function MyJobsScreen() {
  return <PlaceholderScreen screenName="My Jobs" roleName={ROLE} iconName="briefcase" />;
}
function StartJobScreen() {
  return <PlaceholderScreen screenName="Start Job" roleName={ROLE} iconName="play-circle" />;
}
function HistoryScreen() {
  return <PlaceholderScreen screenName="History" roleName={ROLE} iconName="time" />;
}

export function TechnicianNavigator() {
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
      <Tab.Screen name="MyJobs" component={MyJobsScreen}
        options={{ tabBarLabel: 'My Jobs', tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} /> }} />
      <Tab.Screen name="StartJob" component={StartJobScreen}
        options={{ tabBarLabel: 'Start Job', tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" size={size} color={color} /> }} />
      <Tab.Screen name="History" component={HistoryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
