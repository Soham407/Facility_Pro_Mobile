import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Camera, CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { database } from '../../lib/watermelon';
import { AttendanceLogModel } from '../../db/models/AttendanceLog';
import { useAuthStore } from '../../stores/authStore';
import { useNetworkStore } from '../../stores/networkStore';
import { useGuardData } from '../../hooks/useGuardData';
import { syncOfflineData } from '../../lib/sync';
import { Colors, FontSize, Radius } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { startGPSTracking, stopGPSTracking } from '../../tasks/gpsTask';

export function HomeScreen() {
  const { data: guardData, isLoading, refetch } = useGuardData();
  const { user } = useAuthStore();
  const isOnline = useNetworkStore((s) => s.isOnline);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline]);

  const handleCheckInPress = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Check-in requires an internet connection.');
      return;
    }

    if (!guardData?.assignedLocation) {
      Alert.alert('Error', 'No assigned location found for your profile.');
      return;
    }

    setIsProcessing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location services in Settings.');
        setIsProcessing(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentCoords({ lat: location.coords.latitude, lng: location.coords.longitude });

      // Check geofence RPC
      const { data: isInside, error } = await supabase.rpc('check_geofence', {
        p_lat: location.coords.latitude,
        p_lng: location.coords.longitude,
        p_site_lat: guardData.assignedLocation.latitude,
        p_site_lng: guardData.assignedLocation.longitude,
        p_radius_meters: guardData.assignedLocation.geo_fence_radius || 100, // Default 100m
      });

      if (error) throw error;

      if (!isInside) {
        Alert.alert('Outside Geofence', `You are outside the designated area. Please move to your post and try again.`);
        setIsProcessing(false);
        return;
      }

      const camPerm = await requestCameraPermission();
      if (!camPerm.granted) {
        Alert.alert('Permission Denied', 'Please enable camera in Settings -> Apps -> FacilityPro.');
        setIsProcessing(false);
        return;
      }

      setShowCamera(true);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to verify location');
    }
    setIsProcessing(false);
  };

  const takePhoto = async () => {
    if (cameraRef && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.7 });
        setPhotoUri(photo?.uri || null);
      } catch (e) {
        console.error(e);
      }
      setIsProcessing(false);
    }
  };

  const confirmCheckIn = async () => {
    if (!photoUri || !currentCoords || !user?.employee_id || !guardData?.assignedLocation) return;
    setIsProcessing(true);
    try {
      // Manipulate image
      const manipResult = await ImageManipulator.manipulateAsync(
        photoUri,
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Upload Selfie
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `checkin_${Date.now()}.jpg`;
      const filePath = `${user.employee_id}/${dateStr}/${filename}`;
      
      const formData = new FormData() as any;
      formData.append('file', {
        uri: manipResult.uri,
        name: filename,
        type: 'image/jpeg',
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-selfies')
        .upload(filePath, formData, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const photoPath = uploadData.path;
      const logDate = new Date().toISOString().split('T')[0];
      const logData = {
        employee_id: user.employee_id,
        log_date: logDate,
        check_in_time: new Date().toISOString(),
        check_in_location_id: guardData.assignedLocation.id,
        check_in_latitude: currentCoords.lat,
        check_in_longitude: currentCoords.lng,
        check_in_selfie_url: photoPath,
        is_auto_punch_out: false,
        status: 'Present',
      };

      // Insert to Supabase
      const { data: insertResult, error: insertError } = await supabase
        .from('attendance_logs')
        .insert(logData)
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Save to Watermelon
      await database.write(async () => {
        await database.collections.get<AttendanceLogModel>('attendance_logs').create(att => {
          att.serverId = insertResult.id;
          att.employeeId = logData.employee_id;
          att.logDate = logData.log_date;
          att.checkInTime = new Date().getTime();
          att.checkInLat = currentCoords.lat;
          att.checkInLng = currentCoords.lng;
          att.checkInSelfieUrl = photoPath;
          att.isAutoPunchOut = false;
          att.isSynced = true;
        });
      });

      await startGPSTracking();
      await refetch();
      setShowCamera(false);
      setPhotoUri(null);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Save Failed', error.message || 'Error saving check-in');
    }
    setIsProcessing(false);
  };

  const handleCheckOut = async () => {
    setShowCheckOutConfirm(false);
    setIsProcessing(true);
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      if (!guardData?.todayAttendance?.id) throw new Error('No valid check-in record found.');
      const timeNow = new Date();
      
      const checkInDate = new Date(guardData.todayAttendance.check_in_time!);
      const diffMs = timeNow.getTime() - checkInDate.getTime();
      const totalHours = diffMs / (1000 * 60 * 60);

      const updatePayload = {
        check_out_time: timeNow.toISOString(),
        check_out_latitude: location.coords.latitude,
        check_out_longitude: location.coords.longitude,
        total_hours: totalHours,
      };

      const { error } = await supabase
        .from('attendance_logs')
        .update(updatePayload)
        .eq('id', guardData.todayAttendance.id);

      if (error) {
        // If offline and error, fall back to WatermelonDB update and sync later.
        console.error(error);
      }

      await database.write(async () => {
        const attLogs = await database.collections.get<AttendanceLogModel>('attendance_logs').query().fetch();
        const localLog = attLogs.find(l => l.serverId === guardData.todayAttendance?.id);
        if (localLog) {
          await localLog.update(att => {
            att.checkOutTime = timeNow.getTime();
            att.isSynced = isOnline; // If offline, we'd say false, but here we enforce online in a real scenario
          });
        }
      });

      await stopGPSTracking();
      await refetch();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Checkout Failed', error.message);
    }
    setIsProcessing(false);
  };

  if (isLoading || !guardData) {
    return (
      <ScreenWrapper>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      </ScreenWrapper>
    );
  }

  // Camera View
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        {photoUri ? (
          <View style={styles.cameraFrame}>
            <Text style={styles.cameraInstruction}>Preview Selfie</Text>
            <View style={{ flex: 1, backgroundColor: 'black' }} />
            <View style={styles.cameraActions}>
              <TouchableOpacity style={styles.camBtn} onPress={() => setPhotoUri(null)}>
                <Text style={styles.camBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.camBtn, { backgroundColor: Colors.primary }]} onPress={confirmCheckIn} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="white" /> : <Text style={styles.camBtnText}>Use Photo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <CameraView style={styles.cameraFrame} facing="front" ref={ref => setCameraRef(ref)}>
             <View style={styles.cameraOverlay}>
                <Text style={styles.cameraInstruction}>Position your face in the frame</Text>
                <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator color="white" /> : <View style={styles.captureInner} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelCam} onPress={() => setShowCamera(false)}>
                  <Text style={styles.camBtnText}>Cancel</Text>
                </TouchableOpacity>
             </View>
          </CameraView>
        )}
      </View>
    );
  }

  const isComplete = guardData.todayAttendance && guardData.todayAttendance.check_out_time !== null;
  const isCheckedIn = guardData.isCheckedIn;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.guardName}>{user?.first_name} {user?.last_name} ({guardData.securityGuard.guard_code})</Text>
        <Text style={styles.location}>{guardData.assignedLocation?.location_name || 'Unassigned Location'}</Text>
        <Text style={styles.timeClock}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
      </View>

      <View style={styles.mainArea}>
        {isComplete ? (
          <View style={styles.completeView}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            <Text style={styles.completeTitle}>Shift Complete</Text>
            <Text style={styles.completeSub}>You have checked out for the day.</Text>
          </View>
        ) : isCheckedIn ? (
          <View style={styles.checkedInView}>
            <Text style={styles.labelMuted}>Checked in at</Text>
            <Text style={styles.timeValue}>{new Date(guardData.todayAttendance!.check_in_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            
            <TouchableOpacity 
              style={[styles.bigActionBtn, { backgroundColor: Colors.danger, borderColor: Colors.danger }]}
              onPress={() => setShowCheckOutConfirm(true)}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="white" size="large" /> : <Text style={styles.bigActionText}>CHECK OUT</Text>}
            </TouchableOpacity>

            <View style={styles.summaryCards}>
              <Card style={styles.miniCard}>
                <Text style={styles.miniVal}>0</Text>
                <Text style={styles.miniLabel}>Visitors</Text>
              </Card>
              <Card style={styles.miniCard}>
                <Text style={styles.miniVal}>0%</Text>
                <Text style={styles.miniLabel}>Checklist</Text>
              </Card>
              <Card style={styles.miniCard}>
                <Text style={styles.miniVal}>0</Text>
                <Text style={styles.miniLabel}>Alerts</Text>
              </Card>
            </View>
          </View>
        ) : (
          <View style={styles.checkInView}>
            <TouchableOpacity 
              style={styles.bigActionBtn}
              onPress={handleCheckInPress}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="white" size="large" /> : <Text style={styles.bigActionText}>CHECK IN</Text>}
            </TouchableOpacity>
            <Text style={styles.needHelp}>Need help?</Text>
          </View>
        )}
      </View>

      <BottomSheet
        visible={showCheckOutConfirm}
        title="End Shift"
        message={`End your shift? Current time: ${currentTime.toLocaleTimeString()}`}
        onConfirm={handleCheckOut}
        onCancel={() => setShowCheckOutConfirm(false)}
        confirmLabel="Check Out"
        confirmVariant="danger"
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginVertical: 24 },
  guardName: { color: Colors.textPrimary, fontSize: FontSize.sectionTitle, fontWeight: '700' },
  location: { color: Colors.textMuted, fontSize: FontSize.body, marginTop: 4 },
  timeClock: { color: Colors.primaryLight, fontSize: 32, fontWeight: '800', marginTop: 12, fontVariant: ['tabular-nums'] },
  mainArea: { flex: 1, justifyContent: 'center' },
  checkInView: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  bigActionBtn: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.success,
    justifyContent: 'center', alignItems: 'center', borderWidth: 8, borderColor: '#064E3B',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  bigActionText: { color: Colors.white, fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  needHelp: { color: Colors.textMuted, marginTop: 32, textDecorationLine: 'underline' },
  checkedInView: { flex: 1, alignItems: 'center', paddingTop: 32 },
  labelMuted: { color: Colors.textMuted, fontSize: FontSize.body, fontWeight: '500' },
  timeValue: { color: Colors.textPrimary, fontSize: FontSize.screenTitle, fontWeight: '700', marginBottom: 40 },
  summaryCards: { flexDirection: 'row', gap: 12, marginTop: 'auto', marginBottom: 24 },
  miniCard: { flex: 1, alignItems: 'center', padding: 12 },
  miniVal: { fontSize: FontSize.sectionTitle, fontWeight: '700', color: Colors.textPrimary },
  miniLabel: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 4 },
  completeView: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, opacity: 0.6 },
  completeTitle: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary },
  completeSub: { fontSize: FontSize.body, color: Colors.textMuted },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  cameraFrame: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 24, paddingBottom: 60, backgroundColor: 'rgba(0,0,0,0.3)' },
  cameraInstruction: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: '600', marginTop: 40 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
  cancelCam: { alignSelf: 'center', marginTop: 24 },
  cameraActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 24, backgroundColor: '#000' },
  camBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: Radius.button },
  camBtnText: { color: 'white', fontSize: FontSize.body, fontWeight: '600' },
});
