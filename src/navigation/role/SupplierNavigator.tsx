import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import type { SupplierTabParamList } from '../../types/navigation';
import { RequestsScreen } from '../../screens/supplier/RequestsScreen';
import { BillScreen } from '../../screens/supplier/BillScreen';

const Tab = createBottomTabNavigator<SupplierTabParamList>();

export function SupplierNavigator() {
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
      <Tab.Screen name="Inbox" component={RequestsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="mail" size={size} color={color} /> }} />
      <Tab.Screen name="Active" component={RequestsScreen}
        options={{ tabBarLabel: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> }} />
      <Tab.Screen name="History" component={RequestsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
      <Tab.Screen name="Billing" component={BillScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
