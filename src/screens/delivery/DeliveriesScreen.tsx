import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyJobs } from '../../hooks/useMyJobs';
import { Colors, FontSize, Radius, MIN_TOUCH_TARGET } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PhotoCapture } from '../../components/shared/PhotoCapture';

type Tab = 'active' | 'completed';

export function DeliveriesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const { jobs: deliveries, isLoading, refetch, updateJobStatus } = useMyJobs();

  // Modal State
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [updating, setUpdating] = useState(false);

  const activeDeliveries = deliveries?.filter(d => ['po_dispatched', 'in_progress'].includes(d.status)) || [];
  const completedDeliveries = deliveries?.filter(d => d.status === 'material_received' || d.status === 'completed') || [];

  const handleUpdateStatus = (job: any) => {
    setSelectedJob(job);
    setShowPhotoCapture(false);
  };

  const processStatusChange = async (url?: string) => {
    if (!selectedJob) return;
    setUpdating(true);

    try {
      if (selectedJob.status === 'po_dispatched') {
        await updateJobStatus({
          requestId: selectedJob.id,
          newStatus: 'in_progress',
        });
        setSelectedJob(null);
      } else if (selectedJob.status === 'in_progress') {
        if (!url) throw new Error('Photo URL is required for delivery proof');
        await updateJobStatus({
          requestId: selectedJob.id,
          newStatus: 'material_received',
          extraData: {
            delivery_proof_url: url,
            completed_at: new Date().toISOString(),
          },
        });
        setSelectedJob(null);
        setShowPhotoCapture(false);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Status update failed');
    }

    setUpdating(false);
  };

  const renderActiveCard = ({ item }: { item: any }) => {
    const itemCount = item.parts_used?.length || 0; // if items are stored in parts_used or we simply say "Item count unavailable" if not linked
    const supplierName = item.supplier_id ? `Supplier ID: ${item.supplier_id}` : 'Supplier Info Pending'; // Ideally we join supplier name in useMyJobs, but sticking to what we have

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.reqNumber}>{item.request_number}</Text>
          <Badge label={item.status.replace('_', ' ').toUpperCase()} variant="info" />
        </View>
        <Text style={styles.supplierText}>{item.services?.service_name}</Text>
        <Text style={styles.itemSummary}>{item.description}</Text>
        
        {item.scheduled_date && (
          <Text style={styles.dateText}>Expected: {new Date(item.scheduled_date).toLocaleDateString()}</Text>
        )}

        <Button 
          title="UPDATE STATUS" 
          onPress={() => handleUpdateStatus(item)} 
          style={{ marginTop: 16 }} 
          variant="secondary"
        />
      </Card>
    );
  };

  const renderCompletedCard = ({ item }: { item: any }) => (
    <Card style={[styles.card, { opacity: 0.8 }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.reqNumber}>{item.request_number}</Text>
        <View style={styles.row}>
          <Text style={{ color: Colors.success, fontWeight: 'bold', marginRight: 4 }}>Delivered ✓</Text>
        </View>
      </View>
      <Text style={styles.dateText}>Done: {new Date(item.completed_at || item.updated_at).toLocaleDateString()}</Text>
    </Card>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>My Deliveries</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.activeTab]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'completed' && styles.activeTab]} onPress={() => setActiveTab('completed')}>
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'active' ? (
        <FlatList
          data={activeDeliveries}
          renderItem={renderActiveCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.emptyText}>No active deliveries.</Text>}
        />
      ) : (
        <FlatList
          data={completedDeliveries}
          renderItem={renderCompletedCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.emptyText}>No completed deliveries in 30 days.</Text>}
        />
      )}

      {/* Status Update Modal */}
      <Modal visible={!!selectedJob} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Delivery Status</Text>
              <TouchableOpacity onPress={() => { setSelectedJob(null); setShowPhotoCapture(false); }}>
                <Ionicons name="close" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedJob && !showPhotoCapture ? (
              <View>
                <Text style={styles.statusLabel}>Current Status: {selectedJob.status}</Text>
                
                {selectedJob.status === 'po_dispatched' && (
                  <Button 
                    title="PICKED UP" 
                    onPress={() => processStatusChange()} 
                    loading={updating}
                  />
                )}

                {selectedJob.status === 'in_progress' && (
                  <Button 
                    title="DELIVERED" 
                    onPress={() => setShowPhotoCapture(true)} 
                  />
                )}
              </View>
            ) : selectedJob && showPhotoCapture ? (
              <View>
                <Text style={styles.statusLabel}>Capture Delivery Proof (Required)</Text>
                <PhotoCapture 
                  bucket="delivery-proof" 
                  pathPrefix={selectedJob.id} 
                  onUploadComplete={(url) => processStatusChange(url)} 
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
  },
  title: {
    fontSize: FontSize.screenTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    backgroundColor: Colors.border,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reqNumber: {
    color: Colors.textPrimary,
    fontSize: FontSize.cardTitle,
    fontWeight: 'bold',
  },
  supplierText: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSummary: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    marginBottom: 8,
  },
  dateText: {
    color: Colors.primaryLight,
    fontSize: FontSize.caption,
  },
  row: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  statusLabel: {
    color: Colors.textMuted,
    marginBottom: 16,
    fontSize: FontSize.body,
  },
});
