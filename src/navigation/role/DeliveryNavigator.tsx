import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import type { DeliveryTabParamList } from '../../types/navigation';
import { DeliveriesScreen } from '../../screens/delivery/DeliveriesScreen';
import { PatrolScreen } from '../../screens/guard/PatrolScreen'; 

const Tab = createBottomTabNavigator<DeliveryTabParamList>();

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
      <Tab.Screen name="Scanner" component={PatrolScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} /> }} />
      <Tab.Screen name="History" component={DeliveriesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
