import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import type { BuyerTabParamList } from '../../types/navigation';
import { RequestsScreen } from '../../screens/buyer/RequestsScreen';
import { TrackScreen } from '../../screens/buyer/TrackScreen';
import { FeedbackScreen } from '../../screens/buyer/FeedbackScreen';

const Tab = createBottomTabNavigator<BuyerTabParamList>();

export function BuyerNavigator() {
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
      <Tab.Screen name="Requests" component={RequestsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} /> }} />
      <Tab.Screen name="Track" component={TrackScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="trail-sign" size={size} color={color} /> }} />
      <Tab.Screen name="Feedback" component={FeedbackScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
