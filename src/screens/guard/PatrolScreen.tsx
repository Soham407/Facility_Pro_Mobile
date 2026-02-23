import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useGuardData } from '../../hooks/useGuardData';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Colors, FontSize, Radius } from '../../lib/constants';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function PatrolScreen() {
  const { user } = useAuthStore();
  const { data: guardData } = useGuardData();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [patrolLogId, setPatrolLogId] = useState<string | null>(null);
  const [scannedCheckpoints, setScannedCheckpoints] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);

  const startPatrol = async () => {
    try {
      const { data, error } = await supabase.from('guard_patrol_logs').insert({
        guard_id: guardData?.securityGuard?.id,
        patrol_start_time: new Date().toISOString(),
        checkpoints_verified: 0,
        patrol_route: [],
      }).select('id').single();

      if (error) throw error;
      setPatrolLogId(data.id);
      setIsPatrolling(true);
      setScannedCheckpoints([]);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Could not start patrol');
    }
  };

  const endPatrol = async () => {
    try {
      if (patrolLogId) {
        await supabase.from('guard_patrol_logs').update({
          patrol_end_time: new Date().toISOString(),
          checkpoints_verified: scannedCheckpoints.length,
        }).eq('id', patrolLogId);
      }
      setIsPatrolling(false);
      setPatrolLogId(null);
      setScannedCheckpoints([]);
      setShowScanner(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Could not end patrol');
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessingQR || !isPatrolling) return;
    setIsProcessingQR(true);
    
    try {
      // Data is expected to be a UUID in qr_codes table
      const { data: qrData, error: qrErr } = await supabase.from('qr_codes').select('id, location_name').eq('id', data).single();
      if (qrErr || !qrData) {
        Alert.alert('Invalid QR', 'This is not a valid checkpoint QR code.');
        setIsProcessingQR(false);
        return;
      }

      if (scannedCheckpoints.includes(data)) {
        Alert.alert('Already Scanned', 'This checkpoint was already scanned.');
        setIsProcessingQR(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      const { error: insErr } = await supabase.from('qr_scans').insert({
        qr_id: data,
        scanned_by: user?.id,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        scanned_at: new Date().toISOString(),
      });

      if (!insErr) {
        setScannedCheckpoints(prev => [...prev, data]);
        
        // Update route in patrol log
        if (patrolLogId) {
            const newRoute = [...scannedCheckpoints, data].map(id => ({ point: id, time: new Date().toISOString() }));
            await supabase.from('guard_patrol_logs').update({
              checkpoints_verified: newRoute.length,
              patrol_route: newRoute,
            }).eq('id', patrolLogId);
        }
        
        Alert.alert('Success', `Scanned: ${qrData.location_name}`);
      }
    } catch (e) {
       console.error(e);
    }
    setTimeout(() => setIsProcessingQR(false), 2000); // Debounce
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>{isPatrolling ? 'Active Patrol' : 'No Active Patrol'}</Text>
        <Text style={styles.subtitle}>{guardData?.assignedLocation?.location_name || 'Standby'}</Text>
      </View>

      {!isPatrolling ? (
        <View style={styles.center}>
          <Ionicons name="shield-checkmark" size={80} color={Colors.border} />
          <Text style={styles.emptyText}>Start a patrol to begin scanning checkpoints.</Text>
          <Button title="Start Patrol" onPress={startPatrol} icon={<Ionicons name="play" color="white" size={20} />} style={{ marginTop: 24 }} />
        </View>
      ) : (
        <View style={styles.patrolActive}>
          {showScanner && permission?.granted ? (
            <View style={styles.scannerWrapper}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={isProcessingQR ? undefined : handleBarcodeScanned}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scanBox} />
                <TouchableOpacity style={styles.stopScanBtn} onPress={() => setShowScanner(false)}>
                  <Text style={styles.stopScanText}>Close Scanner</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
             <View style={{ flex: 1 }}>
                <Card style={styles.statsCard}>
                   <View style={styles.statLine}>
                      <Text style={styles.statLabel}>Checkpoints Verified</Text>
                      <Text style={styles.statValue}>{scannedCheckpoints.length}</Text>
                   </View>
                </Card>
                
                <Button 
                   title="Scan QR Checkpoint" 
                   onPress={async () => {
                     const p = await requestPermission();
                     if (p.granted) setShowScanner(true);
                   }} 
                   icon={<Ionicons name="qr-code" color="white" size={20} />}
                   style={{ marginVertical: 24 }}
                />
                
                <Button title="End Patrol" variant="danger" onPress={endPatrol} />
             </View>
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 24,
  },
  title: {
    fontSize: FontSize.screenTitle,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    marginTop: 16,
  },
  patrolActive: {
    flex: 1,
  },
  statsCard: {
    padding: 24,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionTitle,
  },
  statValue: {
    color: Colors.success,
    fontSize: 24,
    fontWeight: '800',
  },
  scannerWrapper: {
    flex: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  stopScanBtn: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.button,
  },
  stopScanText: {
    color: 'white',
    fontWeight: '600',
  }
});
