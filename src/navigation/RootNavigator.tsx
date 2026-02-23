import React, { useEffect, useState, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuthStore } from '../stores/authStore';
import { ROLE_NAVIGATOR_MAP } from '../types/navigation';
import type { UserRole } from '../types/auth';

// Navigators
import { AuthNavigator } from './AuthNavigator';
import { GuardNavigator } from './role/GuardNavigator';
import { SupervisorNavigator } from './role/SupervisorNavigator';
import { ManagerNavigator } from './role/ManagerNavigator';
import { TechnicianNavigator } from './role/TechnicianNavigator';
import { DeliveryNavigator } from './role/DeliveryNavigator';
import { BuyerNavigator } from './role/BuyerNavigator';
import { SupplierNavigator } from './role/SupplierNavigator';
import { AdminNavigator } from './role/AdminNavigator';

// Splash
import { SplashScreen } from '../screens/shared/SplashScreen';

const Stack = createNativeStackNavigator();

function getRoleNavigator(roleName: UserRole | null) {
  if (!roleName) return null;
  const key = ROLE_NAVIGATOR_MAP[roleName];
  switch (key) {
    case 'Guard':
      return GuardNavigator;
    case 'Supervisor':
      return SupervisorNavigator;
    case 'Manager':
      return ManagerNavigator;
    case 'Technician':
      return TechnicianNavigator;
    case 'Delivery':
      return DeliveryNavigator;
    case 'Buyer':
      return BuyerNavigator;
    case 'Supplier':
      return SupplierNavigator;
    case 'Admin':
      return AdminNavigator;
    default:
      return AdminNavigator;
  }
}

export function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession } = useAuth();
  const role = useAuthStore((s) => s.role);
  const [splashDone, setSplashDone] = useState(false);

  // Initialize network monitoring
  useOnlineStatus();

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
  }, []);

  // Show splash while loading
  if (isLoading || !splashDone) {
    return <SplashScreen onReady={handleSplashDone} />;
  }

  // Not authenticated → login
  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  // Authenticated → role-based navigator
  const RoleNav = getRoleNavigator(role?.role_name ?? null);

  if (!RoleNav) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainApp" component={RoleNav} />
    </Stack.Navigator>
  );
}
