import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase, authStorage } from '../lib/supabase';

const GPS_TASK_NAME = 'FACILITYPRO_GPS_TRACKING';

// Define the background task
TaskManager.defineTask(GPS_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('GPS Task Error:', error);
    return;
  }

  const { locations } = data as any;
  if (!locations || locations.length === 0) return;
  const location = locations[0];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return; // Not logged in

  const userId = session.user.id;
  const { data: userData } = await supabase
    .from('users')
    .select('employee_id')
    .eq('id', userId)
    .single();

  if (!userData?.employee_id) return;
  const employeeId = userData.employee_id;

  // Insert directly to Supabase
  try {
    const { error: insertError } = await supabase.from('gps_tracking').insert({
      employee_id: employeeId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      tracked_at: new Date(location.timestamp).toISOString(),
      is_mock_location: location.mocked ?? false,
    });

    if (insertError) {
      console.error('Failed to insert GPS point:', insertError);
    }
  } catch (err) {
    console.error('Failed to save GPS point:', err);
  }
});

export async function startGPSTracking() {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Background location permission denied');
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(GPS_TASK_NAME);
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(GPS_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 300000, // 5 minutes
      distanceInterval: 50, // 50 meters
      foregroundService: {
        notificationTitle: 'FacilityPro',
        notificationBody: 'Guard tracking active',
        notificationColor: '#1E40AF',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });
  }
}

export async function stopGPSTracking() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GPS_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(GPS_TASK_NAME);
  }
}
