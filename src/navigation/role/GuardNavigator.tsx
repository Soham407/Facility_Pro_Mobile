import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { HomeScreen } from '../../screens/guard/HomeScreen';
import { PatrolScreen } from '../../screens/guard/PatrolScreen';
import { VisitorScreen } from '../../screens/guard/VisitorScreen';
import { ChecklistScreen } from '../../screens/guard/ChecklistScreen';
import { SOSScreen } from '../../screens/guard/SOSScreen';
import type { GuardTabParamList } from '../../types/navigation';

const Tab = createBottomTabNavigator<GuardTabParamList>();

const ROLE = 'Security Guard';

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
        component={VisitorScreen}
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
