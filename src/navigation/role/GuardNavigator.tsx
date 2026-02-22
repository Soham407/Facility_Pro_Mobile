import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { PlaceholderScreen } from '../../screens/shared/PlaceholderScreen';
import type { GuardTabParamList } from '../../types/navigation';

const Tab = createBottomTabNavigator<GuardTabParamList>();

const ROLE = 'Security Guard';

function HomeScreen() {
  return <PlaceholderScreen screenName="Home" roleName={ROLE} iconName="home" />;
}
function PatrolScreen() {
  return <PlaceholderScreen screenName="Patrol" roleName={ROLE} iconName="walk" />;
}
function VisitorsScreen() {
  return <PlaceholderScreen screenName="Visitors" roleName={ROLE} iconName="people" />;
}
function ChecklistScreen() {
  return <PlaceholderScreen screenName="Checklist" roleName={ROLE} iconName="checkbox" />;
}
function SOSScreen() {
  return <PlaceholderScreen screenName="SOS" roleName={ROLE} iconName="alert-circle" />;
}

export function GuardNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Patrol"
        component={PatrolScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="walk" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Visitors"
        component={VisitorsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SOS"
        component={SOSScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle" size={size} color={Colors.danger} />
          ),
          tabBarLabel: 'SOS',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '800', color: Colors.danger },
        }}
      />
    </Tab.Navigator>
  );
}
