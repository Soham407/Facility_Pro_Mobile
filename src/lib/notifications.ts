import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { supabase } from './supabase';

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('sos-alerts', {
      name: 'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'alarm',
      bypassDnd: true,
    });
    Notifications.setNotificationChannelAsync('high-priority', {
      name: 'High Priority',
      importance: Notifications.AndroidImportance.HIGH,
    });
    Notifications.setNotificationChannelAsync('normal', {
      name: 'Normal',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }

  try {
    // Determine token type based on firebase vs expo. 
    // Usually @react-native-firebase/messaging is for FCM directly.
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();

    if (token) {
      await supabase.from('push_tokens').upsert({
        user_id: userId,
        token,
        token_type: 'fcm',
        device_type: Platform.OS,
        is_active: true,
      }, { onConflict: 'token' });
    }

    return token;
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
}

export function setupNotificationChannels(): void {
  // Handled inside registerForPushNotifications typically, but created separately just in case
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('sos-alerts', {
      name: 'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'alarm',
      bypassDnd: true,
    });
    Notifications.setNotificationChannelAsync('high-priority', {
      name: 'High Priority',
      importance: Notifications.AndroidImportance.HIGH,
    });
    Notifications.setNotificationChannelAsync('normal', {
      name: 'Normal',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export function handleForegroundNotification(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const type = notification.request.content.data?.type;
      
      if (type === 'panic_alert' || type === 'sos') {
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }
      
      return {
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
}
