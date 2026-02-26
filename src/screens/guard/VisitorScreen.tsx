import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert, FlatList, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

import { useAuthStore } from '../../stores/authStore';
import { useGuardData } from '../../hooks/useGuardData';
import { useNetworkStore } from '../../stores/networkStore';
import { Colors, FontSize, Radius, MIN_TOUCH_TARGET } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type Tab = 'log_entry' | 'todays_log';

export function VisitorScreen() {
  const { user } = useAuthStore();
  const { data: guardData } = useGuardData();
  const isOnline = useNetworkStore((s) => s.isOnline);

  const [activeTab, setActiveTab] = useState<Tab>('log_entry');

  // Form State
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('Delivery');
  const [flatId, setFlatId] = useState(''); // Simplified: user types flat ID or number
  const [vehicle, setVehicle] = useState('');
  
  // Camera
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frequentVisitorMsg, setFrequentVisitorMsg] = useState<string | null>(null);

  // Today's log
  const [todaysLog, setTodaysLog] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'todays_log') {
      fetchTodaysLog();
    }
  }, [activeTab]);

  useEffect(() => {
    if (phone.length === 10) {
      checkFrequentVisitor();
    } else {
      setFrequentVisitorMsg(null);
    }
  }, [phone]);

  const checkFrequentVisitor = async () => {
    if (!isOnline) return;
    const { data } = await supabase
      .from('visitors')
      .select('visitor_name, entry_time')
      .eq('phone', phone)
      .eq('is_frequent_visitor', true)
      .order('entry_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setFrequentVisitorMsg(`Known visitor: ${data.visitor_name}, last visit ${new Date(data.entry_time).toLocaleDateString()}`);
      if (!visitorName) setVisitorName(data.visitor_name);
    }
  };

  const fetchTodaysLog = async () => {
    if (!guardData?.securityGuard?.id) return;
    setIsLoadingLogs(true);
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const { data } = await supabase
        .from('visitors')
        .select('*')
        .eq('entry_guard_id', guardData.securityGuard.id)
        .gte('entry_time', today.toISOString())
        .order('entry_time', { ascending: false });
      
      if (data) setTodaysLog(data);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingLogs(false);
  };

  const takePhoto = async () => {
    if (cameraRef && !isSubmitting) {
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.7 });
        setPhotoUri(photo?.uri || null);
        setShowCamera(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCapturePress = async () => {
    const perm = await requestCameraPermission();
    if (perm.granted) {
      setShowCamera(true);
    }
  };

  const handleSubmit = async () => {
    if (!visitorName || !phone) {
      Alert.alert('Validation Error', 'Name and Phone are required.');
      return;
    }
    setIsSubmitting(true);
    
    try {
      let uploadedPhotoUrl = null;
      if (photoUri && isOnline) {
        const manipResult = await ImageManipulator.manipulateAsync(
          photoUri, [{ resize: { width: 800, height: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `visitor_${Date.now()}.jpg`;
        const filePath = `${user?.employee_id}/${dateStr}/${filename}`;
        
        const formData = new FormData() as any;
        formData.append('file', { uri: manipResult.uri, name: filename, type: 'image/jpeg' });
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('visitor-photos')
          .upload(filePath, formData, { contentType: 'image/jpeg' });
          
        if (!uploadErr && uploadData) {
          uploadedPhotoUrl = uploadData.path;
        }
      }

      const payload = {
        visitor_name: visitorName,
        visitor_type: purpose,
        phone,
        vehicle_number: vehicle,
        photo_url: uploadedPhotoUrl,
        flat_id: flatId || null,
        entry_time: new Date().toISOString(),
        entry_guard_id: guardData?.securityGuard?.id,
        is_frequent_visitor: false,
      };

      let serverId = null;
      if (isOnline) {
        const { data, error } = await supabase.from('visitors').insert(payload).select('id').single();
        if (error) throw error;
        serverId = data.id;
      }



      Alert.alert('Success', 'Visitor logged successfully.');
      
      // Reset form
      setVisitorName('');
      setPhone('');
      setVehicle('');
      setFlatId('');
      setPhotoUri(null);
      setFrequentVisitorMsg(null);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to log visitor.');
    }
    
    setIsSubmitting(false);
  };

  const handleExit = async (id: string, serverId: string) => {
    try {
      const exitTime = new Date().toISOString();
      if (isOnline && serverId) {
         await supabase.from('visitors').update({ exit_time: exitTime }).eq('id', serverId);
      }
      

      fetchTodaysLog();
    } catch (e) {
       console.error(e);
    }
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView style={{ flex: 1 }} facing="back" ref={ref => setCameraRef(ref)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end', paddingBottom: 60, alignItems: 'center' }}>
            <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 24 }} onPress={() => setShowCamera(false)}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'log_entry' && styles.activeTab]} onPress={() => setActiveTab('log_entry')}>
          <Text style={[styles.tabText, activeTab === 'log_entry' && styles.activeTabText]}>Log Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'todays_log' && styles.activeTab]} onPress={() => setActiveTab('todays_log')}>
          <Text style={[styles.tabText, activeTab === 'todays_log' && styles.activeTabText]}>Today's Log</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'log_entry' ? (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          {frequentVisitorMsg && (
            <View style={styles.bannerSuccess}>
              <Text style={styles.bannerText}>{frequentVisitorMsg}</Text>
            </View>
          )}

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter phone" placeholderTextColor={Colors.border} />

          <Text style={styles.label}>Visitor Name *</Text>
          <TextInput style={styles.input} value={visitorName} onChangeText={setVisitorName} placeholder="Enter name" placeholderTextColor={Colors.border} />

          <Text style={styles.label}>Purpose</Text>
          <View style={styles.pickerContainer}>
            {['Delivery', 'Meeting', 'Maintenance', 'Resident Guest', 'Other'].map(p => (
              <TouchableOpacity key={p} style={[styles.purposePill, purpose === p && styles.purposePillActive]} onPress={() => setPurpose(p)}>
                 <Text style={[styles.purposePillText, purpose === p && styles.purposePillTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Flat / Unit</Text>
          <TextInput style={styles.input} value={flatId} onChangeText={setFlatId} placeholder="e.g. A-102" placeholderTextColor={Colors.border} />

          <Text style={styles.label}>Vehicle Number</Text>
          <TextInput style={styles.input} value={vehicle} onChangeText={setVehicle} placeholder="Optional" placeholderTextColor={Colors.border} />

          <Text style={styles.label}>Photo</Text>
          {photoUri ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: photoUri }} style={styles.previewImg} />
              <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhotoUri(null)}>
                 <Text style={styles.retakeText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoCaptureBox} onPress={handleCapturePress}>
              <Ionicons name="camera" size={32} color={Colors.textMuted} />
              <Text style={styles.photoHint}>Tap to capture</Text>
            </TouchableOpacity>
          )}

          <Button title="Submit Entry" onPress={handleSubmit} loading={isSubmitting} style={{ marginTop: 24, marginBottom: 40 }} />
        </ScrollView>
      ) : (
        <View style={styles.logContainer}>
          {isLoadingLogs ? (
             <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }}/>
          ) : (
             <FlatList
               data={todaysLog}
               keyExtractor={item => item.id}
               contentContainerStyle={{ paddingVertical: 16 }}
               renderItem={({ item }) => (
                 <Card style={styles.logCard}>
                    <View style={styles.logHeader}>
                       <Text style={styles.logName}>{item.visitor_name}</Text>
                       <Text style={styles.logBadge}>{item.visitor_type}</Text>
                    </View>
                    <Text style={styles.logDetail}>Flat: {item.flat_id || 'N/A'}</Text>
                    <Text style={styles.logTime}>In: {new Date(item.entry_time).toLocaleTimeString()}</Text>
                    {item.exit_time ? (
                       <Text style={styles.logTime}>Out: {new Date(item.exit_time).toLocaleTimeString()}</Text>
                    ) : (
                       <TouchableOpacity style={styles.exitBtn} onPress={() => handleExit(item.id, item.id)}>
                         <Text style={styles.exitText}>Log Exit</Text>
                       </TouchableOpacity>
                    )}
                 </Card>
               )}
               ListEmptyComponent={<Text style={styles.emptyText}>No visitors logged today.</Text>}
             />
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', marginTop: 16, marginBottom: 24, paddingHorizontal: 16, backgroundColor: Colors.surface, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { backgroundColor: Colors.border },
  tabText: { color: Colors.textMuted, fontSize: FontSize.body, fontWeight: '600' },
  activeTabText: { color: Colors.textPrimary },
  formContainer: { flex: 1 },
  label: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, paddingHorizontal: 16, height: MIN_TOUCH_TARGET, color: Colors.textPrimary, fontSize: FontSize.body },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  purposePill: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  purposePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryDark },
  purposePillText: { color: Colors.textPrimary, fontSize: FontSize.caption },
  purposePillTextActive: { color: Colors.white, fontWeight: '700' },
  photoCaptureBox: { backgroundColor: Colors.surface, height: 120, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  photoHint: { color: Colors.textMuted, marginTop: 8 },
  photoPreviewBox: { height: 200, borderRadius: Radius.card, overflow: 'hidden', position: 'relative' },
  previewImg: { width: '100%', height: '100%' },
  retakeBtn: { position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.button },
  retakeText: { color: 'white', fontWeight: '600' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
  logContainer: { flex: 1 },
  logCard: { marginBottom: 12 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logName: { fontSize: FontSize.sectionTitle, color: Colors.textPrimary, fontWeight: '700' },
  logBadge: { backgroundColor: Colors.primaryDark, color: 'white', fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  logDetail: { color: Colors.textMuted, fontSize: FontSize.body, marginBottom: 4 },
  logTime: { color: Colors.primaryLight, fontSize: FontSize.caption, marginTop: 2 },
  exitBtn: { marginTop: 12, backgroundColor: Colors.border, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.button },
  exitText: { color: Colors.textPrimary, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 24 },
  bannerSuccess: { backgroundColor: '#064E3B', padding: 12, borderRadius: 8, marginBottom: 16 },
  bannerText: { color: '#10B981', fontWeight: '600' },
});
