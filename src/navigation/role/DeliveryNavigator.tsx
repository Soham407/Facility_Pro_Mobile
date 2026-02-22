import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { PlaceholderScreen } from '../../screens/shared/PlaceholderScreen';
import type { DeliveryTabParamList } from '../../types/navigation';

const Tab = createBottomTabNavigator<DeliveryTabParamList>();
const ROLE = 'Delivery Boy';

function DeliveriesScreen() {
  return <PlaceholderScreen screenName="Deliveries" roleName={ROLE} iconName="cube" />;
}
function ScannerScreen() {
  return <PlaceholderScreen screenName="Scanner" roleName={ROLE} iconName="qr-code" />;
}
function HistoryScreen() {
  return <PlaceholderScreen screenName="History" roleName={ROLE} iconName="time" />;
}

export function DeliveryNavigator() {
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
      <Tab.Screen name="Deliveries" component={DeliveriesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} /> }} />
      <Tab.Screen name="Scanner" component={ScannerScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} /> }} />
      <Tab.Screen name="History" component={HistoryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
