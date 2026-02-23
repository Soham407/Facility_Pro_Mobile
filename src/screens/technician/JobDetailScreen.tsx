import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { useMyJobs } from '../../hooks/useMyJobs';
import { Colors, FontSize, Radius } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PhotoCapture } from '../../components/shared/PhotoCapture';
import { PartsLogger } from './components/PartsLogger';
import type { ServiceRequest } from '../../types/database';

export function JobDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const jobId = route.params?.jobId;

  const { jobs, updateJobStatus } = useMyJobs();
  const job = jobs?.find((j: any) => j.id === jobId);

  const [localParts, setLocalParts] = useState<any[]>([]);

  useEffect(() => {
    if (job?.parts_used) {
      setLocalParts(job.parts_used);
    }
  }, [job?.parts_used]);

  if (!job) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={{ color: Colors.textMuted }}>Select a job first</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const handleStart = async () => {
    try {
      // Trigger GPS as requested (even if not strictly stored)
      await Location.requestForegroundPermissionsAsync();
      await Location.getCurrentPositionAsync({});
      
      await updateJobStatus({
        requestId: job.id,
        newStatus: 'in_progress',
        extraData: { started_at: new Date().toISOString() },
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to start job.');
    }
  };

  const handleComplete = async () => {
    if (!job.before_photo_url) {
      Alert.alert('Missing Photo', 'Before photo is required to complete the job.');
      return;
    }

    Alert.alert('Complete Job', 'Are you sure you want to mark this job as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'default',
        onPress: async () => {
          try {
            await updateJobStatus({
              requestId: job.id,
              newStatus: 'completed',
              extraData: { 
                completed_at: new Date().toISOString(),
                parts_used: localParts, // Save any local parts changes
              },
            });
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to complete job.');
          }
        },
      },
    ]);
  };

  const onBeforePhoto = async (url: string) => {
    await updateJobStatus({ requestId: job.id, newStatus: job.status, extraData: { before_photo_url: url } });
  };

  const onAfterPhoto = async (url: string) => {
    await updateJobStatus({ requestId: job.id, newStatus: job.status, extraData: { after_photo_url: url } });
  };

  const isPending = job.status === 'pending' || job.status === 'accepted';
  const isInProgress = job.status === 'in_progress';
  const isCompleted = job.status === 'completed';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.reqNumber}>{job.request_number}</Text>
            <Badge label={job.status.replace('_', ' ').toUpperCase()} variant={isCompleted ? 'success' : isInProgress ? 'info' : 'warning'} />
            {job.priority !== 'normal' && (
              <Badge label={job.priority.toUpperCase()} variant={job.priority === 'urgent' ? 'danger' : 'warning'} />
            )}
          </View>
          <Text style={styles.serviceName}>{job.services?.service_name}</Text>
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.textMain}>{job.company_locations?.location_name}</Text>
          {job.flats && <Text style={styles.textSub}>Flat: {job.flats.flat_number}</Text>}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Job Info</Text>
          <Text style={styles.textMain}>{job.description}</Text>
          {job.scheduled_date && (
            <Text style={styles.textSub}>Scheduled: {new Date(job.scheduled_date).toLocaleDateString()}</Text>
          )}
        </Card>

        {isPending && (
          <Button title="START JOB" onPress={handleStart} style={{ marginTop: 24 }} />
        )}

        {(isInProgress || isCompleted) && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Before Photo *</Text>
            {job.before_photo_url ? (
              <PhotoCapture bucket="service-evidence" pathPrefix={job.id} onUploadComplete={onBeforePhoto} />
            ) : (
              <PhotoCapture bucket="service-evidence" pathPrefix={job.id} onUploadComplete={onBeforePhoto} />
            )}
            
            {(job.before_photo_url || isCompleted) && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>After Photo</Text>
                <PhotoCapture bucket="service-evidence" pathPrefix={job.id} onUploadComplete={onAfterPhoto} />
              </>
            )}

            <PartsLogger parts={localParts} onPartsChange={setLocalParts} readonly={isCompleted} />

            {isInProgress && (
              <Button 
                title="COMPLETE JOB" 
                onPress={handleComplete} 
                disabled={!job.before_photo_url} 
                style={{ marginTop: 24 }} 
              />
            )}

            {isCompleted && job.feedback_rating && (
              <Card style={{ marginTop: 24, backgroundColor: Colors.surface }}>
                <Text style={styles.sectionTitle}>Feedback received: {job.feedback_rating}★</Text>
                {job.feedback_comment && <Text style={styles.textSub}>{job.feedback_comment}</Text>}
              </Card>
            )}
          </View>
        )}
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
    paddingBottom: 40,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reqNumber: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: 'bold',
  },
  serviceName: {
    fontSize: FontSize.screenTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textMain: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  textSub: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
});
