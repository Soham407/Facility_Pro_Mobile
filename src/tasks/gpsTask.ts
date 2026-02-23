import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase, authStorage } from '../lib/supabase';
import { database } from '../lib/watermelon';
import { GpsPointModel } from '../db/models/GpsPoint';

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

  // Only track if guard is clocked in (we could check if we have a valid session/employee_id)
  // Check MMKV for a stored employee_id or something similar? 
  // For now, let's grab the Supabase session, check if active.
  const authSessionStr = authStorage.getString('supabase.auth.token'); // We used custom MMKV adapter, so the key might vary. Actually, Supabase uses chunks or similar keys if not customized. But it's in mmkv.
  // Wait, let's just make the Supabase client getSession.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return; // Not logged in

  const userId = session.user.id;
  // We need employee_id. The easiest way without a DB lookup every time in background is to store employee_id in MMKV on login, or derive if needed. Let's do a quiet DB lookup if necessary or just insert to 'gps_tracking' which might be linked to employee_id implicitly, but the schema requires employee_id. Let's fetch it:
  const { data: userData } = await supabase
    .from('users')
    .select('employee_id')
    .eq('id', userId)
    .single();

  if (!userData?.employee_id) return;
  const employeeId = userData.employee_id;

  // Insert to WatermelonDB
  try {
    await database.write(async () => {
      await database.collections.get<GpsPointModel>('gps_points').create((point) => {
        point.employeeId = employeeId;
        point.latitude = location.coords.latitude;
        point.longitude = location.coords.longitude;
        point.trackedAt = location.timestamp;
        point.isMockLocation = location.mocked ?? false;
        point.isSynced = false;
      });
    });

    // Try to sync instantly to Supabase
    const { error: insertError } = await supabase.from('gps_tracking').insert({
      employee_id: employeeId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      tracked_at: new Date(location.timestamp).toISOString(),
      is_mock_location: location.mocked ?? false,
    });

    if (!insertError) {
      // Mark synced in local DB
      // We could query the last created point and update it, but usually sync handles this.
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
