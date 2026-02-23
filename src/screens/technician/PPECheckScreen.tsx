import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useCurrentEmployee } from '../../hooks/useCurrentEmployee';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PhotoCapture } from '../../components/shared/PhotoCapture';

export function PPECheckScreen() {
  const navigation = useNavigation<any>();
  const { data: employee } = useCurrentEmployee();
  
  const [maskOk, setMaskOk] = useState(false);
  const [glovesOk, setGlovesOk] = useState(false);
  const [eyeOk, setEyeOk] = useState(false);
  const [apronOk, setApronOk] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already verified today
  useEffect(() => {
    if (employee?.id) {
      checkVerification();
    }
  }, [employee?.id]);

  const checkVerification = async () => {
    setChecking(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('pest_control_ppe_verification')
      .select('id')
      .eq('employee_id', employee!.id)
      .eq('shift_date', today)
      .single();

    if (data) {
      // Already verified, skip screen
      navigation.replace('TechnicianTabs');
    } else {
      setChecking(false);
    }
  };

  const handleConfirm = async () => {
    if (!photoUrl) {
      Alert.alert('Photo Required', 'Please take a verification photo to proceed.');
      return;
    }
    
    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      const { error } = await supabase.from('pest_control_ppe_verification').insert({
        employee_id: employee!.id,
        mask_ok: maskOk,
        gloves_ok: glovesOk,
        eye_protection_ok: eyeOk,
        apron_ok: apronOk,
        verified_by_photo_url: photoUrl,
        shift_date: today,
        verified_at: new Date().toISOString(),
      });

      if (error) throw error;
      navigation.replace('TechnicianTabs');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit verification');
    }
    
    setSubmitting(false);
  };

  if (checking) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={{ color: Colors.textMuted }}>Checking PPE status...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const allToggled = maskOk && glovesOk && eyeOk && apronOk;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Pest Control PPE Check</Text>
        <Text style={styles.subHeader}>Mandatory verification before starting shift.</Text>

        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Mask / Respirator</Text>
            <Switch value={maskOk} onValueChange={setMaskOk} trackColor={{ true: Colors.success }} />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Protective Gloves</Text>
            <Switch value={glovesOk} onValueChange={setGlovesOk} trackColor={{ true: Colors.success }} />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Eye Protection / Goggles</Text>
            <Switch value={eyeOk} onValueChange={setEyeOk} trackColor={{ true: Colors.success }} />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Full Apron / Coverall</Text>
            <Switch value={apronOk} onValueChange={setApronOk} trackColor={{ true: Colors.success }} />
          </View>
        </Card>

        <View style={styles.photoContainer}>
          <Text style={styles.photoHeader}>Verification Photo *</Text>
          <PhotoCapture 
            bucket="ppe-verification" 
            pathPrefix={`${employee!.id}/${new Date().toISOString().split('T')[0]}`} 
            onUploadComplete={setPhotoUrl} 
          />
        </View>

        <Button 
          title="Confirm & Proceed" 
          onPress={handleConfirm} 
          disabled={!allToggled || !photoUrl} 
          loading={submitting}
          style={{ marginTop: Spacing.xl }} 
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingVertical: Spacing.xl,
  },
  header: {
    fontSize: FontSize.screenTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subHeader: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    marginBottom: Spacing['2xl'],
  },
  card: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: FontSize.cardTitle,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  photoContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  photoHeader: {
    fontSize: FontSize.cardTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
});
