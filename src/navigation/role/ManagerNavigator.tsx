import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { PlaceholderScreen } from '../../screens/shared/PlaceholderScreen';
import type { ManagerTabParamList } from '../../types/navigation';

const Tab = createBottomTabNavigator<ManagerTabParamList>();
const ROLE = 'Society Manager';

function OverviewScreen() {
  return <PlaceholderScreen screenName="Overview" roleName={ROLE} iconName="analytics" />;
}
function ServiceScreen() {
  return <PlaceholderScreen screenName="Service" roleName={ROLE} iconName="construct" />;
}
function ComplaintsScreen() {
  return <PlaceholderScreen screenName="Complaints" roleName={ROLE} iconName="chatbubble-ellipses" />;
}
function VisitorsScreen() {
  return <PlaceholderScreen screenName="Visitors" roleName={ROLE} iconName="people" />;
}

export function ManagerNavigator() {
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
      <Tab.Screen name="Overview" component={OverviewScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} /> }} />
      <Tab.Screen name="Service" component={ServiceScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="construct" size={size} color={color} /> }} />
      <Tab.Screen name="Complaints" component={ComplaintsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} /> }} />
      <Tab.Screen name="Visitors" component={VisitorsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
