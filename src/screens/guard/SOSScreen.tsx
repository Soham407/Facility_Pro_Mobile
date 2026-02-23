import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Vibration, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../../lib/constants';
import { useAuthStore } from '../../stores/authStore';
import { useGuardData } from '../../hooks/useGuardData';
import { database } from '../../lib/watermelon';
import { PanicAlertModel } from '../../db/models/PanicAlert';
import { supabase } from '../../lib/supabase';
import { useNetworkStore } from '../../stores/networkStore';

export function SOSScreen() {
  const { user } = useAuthStore();
  const { data: guardData } = useGuardData();
  const isOnline = useNetworkStore((s) => s.isOnline);

  const [isHolding, setIsHolding] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertId, setAlertId] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerSOS = async () => {
    Vibration.vibrate([0, 500, 200, 500]);
    setIsActivated(true);
    
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const currentCoords = { lat: location.coords.latitude, lng: location.coords.longitude };
      
      const alertPayload = {
        guard_id: guardData?.securityGuard?.id,
        alert_type: 'panic',
        latitude: currentCoords.lat,
        longitude: currentCoords.lng,
        alert_time: new Date().toISOString(),
        is_resolved: false,
      };

      let pendingServerId: string | null = null;
      let insertedAlert = null;
      
      if (isOnline) {
        const { data, error } = await supabase.from('panic_alerts').insert(alertPayload).select('id').single();
        if (!error && data) {
           pendingServerId = data.id;
           setAlertId(data.id);
        } else {
           console.error(error);
        }
      }

      await database.write(async () => {
        const alertModel = await database.collections.get<PanicAlertModel>('panic_alerts').create(alert => {
          if (pendingServerId) alert.serverId = pendingServerId;
          alert.guardId = alertPayload.guard_id!;
          alert.alertType = alertPayload.alert_type;
          alert.latitude = alertPayload.latitude;
          alert.longitude = alertPayload.longitude;
          alert.alertTime = new Date(alertPayload.alert_time).getTime();
          alert.isResolved = false;
          alert.isSynced = isOnline && !!pendingServerId;
        });
        if (!pendingServerId) {
           setAlertId(alertModel.id); // Show local Watermelon ID if offline
        }
      });
      
    } catch (e: any) {
       console.error(e);
       Alert.alert('Location Error', 'Failed to get location, but SOS was triggered locally.');
    }
  };

  const onPressIn = () => {
    if (isActivated) return;
    setIsHolding(true);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    holdTimer.current = setTimeout(() => {
      triggerSOS();
    }, 3000);
  };

  const onPressOut = () => {
    if (isActivated) return;
    setIsHolding(false);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
    }
    Animated.spring(progressAnim, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  const cancelAlert = async () => {
    setIsActivated(false);
    progressAnim.setValue(0);
    
    if (alertId) {
       // Mark resolved
       if (isOnline && alertId.includes('-')) {
          await supabase.from('panic_alerts').update({ is_resolved: true }).eq('id', alertId);
       }
       await database.write(async () => {
          const panics = await database.collections.get<PanicAlertModel>('panic_alerts').query().fetch();
          const target = panics.find(p => p.serverId === alertId || p.id === alertId);
          if (target) {
            await target.update(p => { p.isResolved = true; });
          }
       });
    }
    setAlertId(null);
  };

  const containerBg = isActivated ? Colors.danger : '#7F1D1D';
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={styles.topSection}>
        <Text style={styles.emergencyLabel}>EMERGENCY</Text>
        <Text style={styles.timeLabel}>{currentTime.toLocaleTimeString()} - {currentTime.toLocaleDateString()}</Text>
      </View>

      <View style={styles.centerSection}>
        {!isActivated ? (
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={styles.sosButton}
          >
            <View style={styles.sosButtonInner}>
              <Ionicons name="warning" size={64} color="white" />
              <Text style={styles.sosHoldText}>HOLD 3 SECONDS</Text>
            </View>
            <Animated.View style={[styles.progressRing, { height: progressWidth }]} />
          </Pressable>
        ) : (
          <View style={styles.activatedView}>
            <Ionicons name="warning" size={100} color="white" />
            <Text style={styles.alertSentText}>ALERT SENT</Text>
            <Text style={styles.helpComingText}>Help is coming</Text>
            <Text style={styles.alertIdText}>Alert ID: {alertId?.substring(0, 8)}</Text>
            
            <Pressable style={styles.cancelBtn} onPress={cancelAlert}>
              <Text style={styles.cancelBtnText}>I'm Safe — Cancel Alert</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.guardNameText}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.guardLocText}>{guardData?.assignedLocation?.location_name || 'Unassigned'}</Text>
        {!isActivated && (
          <View style={styles.emergencyContacts}>
            {/* Hardcoded for now as per minimal requirement, would pull from DB */}
            <Pressable style={styles.phoneBtn}><Ionicons name="call" size={20} color="white"/></Pressable>
            <Pressable style={styles.phoneBtn}><Ionicons name="call" size={20} color="white"/></Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  emergencyLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 8,
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontSize: 14,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#991B1B',
    elevation: 12,
  },
  sosButtonInner: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sosHoldText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 18,
    marginTop: 12,
  },
  activatedView: {
    alignItems: 'center',
  },
  alertSentText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 16,
  },
  helpComingText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  alertIdText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 12,
  },
  cancelBtn: {
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
  },
  cancelBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  guardNameText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  guardLocText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  emergencyContacts: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  phoneBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
