import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { PlaceholderScreen } from '../../screens/shared/PlaceholderScreen';
import type { BuyerTabParamList } from '../../types/navigation';

const Tab = createBottomTabNavigator<BuyerTabParamList>();
const ROLE = 'Buyer / Resident';

function RequestsScreen() {
  return <PlaceholderScreen screenName="Requests" roleName={ROLE} iconName="document-text" />;
}
function TrackScreen() {
  return <PlaceholderScreen screenName="Track" roleName={ROLE} iconName="trail-sign" />;
}
function FeedbackScreen() {
  return <PlaceholderScreen screenName="Feedback" roleName={ROLE} iconName="star" />;
}

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
