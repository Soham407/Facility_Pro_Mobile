import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useCurrentEmployee } from '../../hooks/useCurrentEmployee';

// Screens
import { MyJobsScreen } from '../../screens/technician/MyJobsScreen';
import { JobDetailScreen } from '../../screens/technician/JobDetailScreen';
import { PPECheckScreen } from '../../screens/technician/PPECheckScreen';
import { PlaceholderScreen } from '../../screens/shared/PlaceholderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ROLE = 'Technician';

function TechnicianTabs() {
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
      <Tab.Screen name="History" component={MyJobsScreen} initialParams={{ isHistory: true }}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

export function TechnicianNavigator() {
  const { data: employee, isLoading: empLoading } = useCurrentEmployee();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    async function determineInitialRoute() {
      if (!employee?.id) return;
      
      const { data: profile } = await supabase
        .from('technician_profiles')
        .select('specialization')
        .eq('employee_id', employee.id)
        .single();
      
      if (profile?.specialization === 'pest_control') {
        const today = new Date().toISOString().split('T')[0];
        const { data: verification } = await supabase
          .from('pest_control_ppe_verification')
          .select('id')
          .eq('employee_id', employee.id)
          .eq('shift_date', today)
          .single();
          
        if (!verification) {
          setInitialRoute('PPECheck');
          return;
        }
      }
      setInitialRoute('TechnicianTabs');
    }
    
    if (employee?.id && !initialRoute) {
      determineInitialRoute();
    }
  }, [employee?.id, initialRoute]);

  if (empLoading || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PPECheck" component={PPECheckScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="TechnicianTabs" component={TechnicianTabs} options={{ gestureEnabled: false }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
    </Stack.Navigator>
  );
}
