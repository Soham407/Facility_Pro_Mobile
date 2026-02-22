import './global.css';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from './src/lib/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/lib/constants';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: Colors.primary,
                background: Colors.background,
                card: Colors.surface,
                text: Colors.textPrimary,
                border: Colors.border,
                notification: Colors.danger,
              },
              fonts: {
                regular: { fontFamily: 'System', fontWeight: '400' },
                medium: { fontFamily: 'System', fontWeight: '500' },
                bold: { fontFamily: 'System', fontWeight: '700' },
                heavy: { fontFamily: 'System', fontWeight: '800' },
              },
            }}
          >
            <StatusBar
              barStyle="light-content"
              backgroundColor={Colors.background}
              translucent={false}
            />
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
