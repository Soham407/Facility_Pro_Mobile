import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, Radius } from '../../lib/constants';

type TabType = 'All' | 'Pending' | 'In Progress' | 'Completed';

export function ServiceScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['serviceRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (service_name, category),
          assigned:employees (first_name, last_name, photo_url)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });

  const markUrgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_requests')
        .update({ priority: 'urgent' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
      // Update local selected request state too
      if (selectedReq) setSelectedReq({ ...selectedReq, priority: 'urgent' });
    }
  });

  const filteredRequests = (requests || []).filter((req) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return req.status === 'pending';
    if (activeTab === 'In Progress') return req.status === 'in_progress';
    if (activeTab === 'Completed') return req.status === 'completed';
    return true;
  });

  const getPriorityColor = (priority: string) => {
    if (priority === 'urgent') return Colors.danger;
    if (priority === 'high') return '#EA580C'; // orange
    return Colors.primaryLight; // normal
  };

  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: getPriorityColor(item.priority) }]}
      onPress={() => setSelectedReq(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.serviceName}>{item.services?.service_name || 'Service Request'}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.locationText}>
          <Ionicons name="location" size={12} color={Colors.textMuted} /> {item.location_id ? 'Location specified' : 'General'} 
          {item.flat_id && ` · Flat ${item.flat_id}`}
        </Text>
        <Text style={styles.dateText}>Scheduled: {new Date(item.scheduled_date).toLocaleDateString()}</Text>
        
        <View style={styles.assignedRow}>
          {item.assigned ? (
            <>
              <View style={styles.avatarTiny}>
                <Text style={styles.avatarTinyText}>{item.assigned.first_name[0]}</Text>
              </View>
              <Text style={styles.assignedName}>{item.assigned.first_name} {item.assigned.last_name}</Text>
            </>
          ) : (
            <Text style={styles.unassignedText}>Unassigned</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Service Requests</Text>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {(['All', 'Pending', 'In Progress', 'Completed'] as TabType[]).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Detail Bottom Sheet */}
      <Modal visible={!!selectedReq} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReq && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedReq.services?.service_name || 'Request Detail'}</Text>
                  <TouchableOpacity onPress={() => setSelectedReq(null)}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalDesc}>{selectedReq.description}</Text>
                  
                  <View style={styles.statusTimeline}>
                    <Text style={styles.timelineTitle}>Timeline</Text>
                    <Text style={styles.timelineItem}>• Created: {new Date(selectedReq.created_at).toLocaleString()}</Text>
                    {selectedReq.started_at && <Text style={styles.timelineItem}>• Started: {new Date(selectedReq.started_at).toLocaleString()}</Text>}
                    {selectedReq.completed_at && <Text style={styles.timelineItem}>• Completed: {new Date(selectedReq.completed_at).toLocaleString()}</Text>}
                  </View>

                  {(selectedReq.before_photo_url || selectedReq.after_photo_url) && (
                    <View style={styles.photosSection}>
                      <Text style={styles.timelineTitle}>Photos</Text>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        {selectedReq.before_photo_url && <View style={styles.photoBox}><Text style={styles.photoBoxText}>Before</Text></View>}
                        {selectedReq.after_photo_url && <View style={styles.photoBox}><Text style={styles.photoBoxText}>After</Text></View>}
                      </View>
                    </View>
                  )}

                  {selectedReq.priority !== 'urgent' && selectedReq.status !== 'completed' && (
                    <TouchableOpacity 
                      style={styles.markUrgentBtn}
                      onPress={() => markUrgent.mutate(selectedReq.id)}
                      disabled={markUrgent.isPending}
                    >
                      <Text style={styles.markUrgentBtnText}>
                        {markUrgent.isPending ? 'Marking...' : 'MARK URGENT'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerTitle: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  tabsContainer: { marginBottom: 16 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16, marginBottom: 12, borderWidth: 1, borderTopColor: Colors.border, borderRightColor: Colors.border, borderBottomColor: Colors.border, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceName: { color: Colors.textPrimary, fontSize: FontSize.cardTitle, fontWeight: 'bold' },
  statusBadge: { backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  statusText: { color: Colors.textPrimary, fontSize: 10, fontWeight: 'bold' },
  cardBody: { marginTop: 4 },
  locationText: { color: Colors.textMuted, fontSize: 13, marginBottom: 4 },
  dateText: { color: Colors.textMuted, fontSize: 13, marginBottom: 12 },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarTiny: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  avatarTinyText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  assignedName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  unassignedText: { color: Colors.danger, fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, height: '70%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSize.screenTitle, fontWeight: 'bold' },
  modalScroll: { flex: 1 },
  modalDesc: { color: Colors.textPrimary, fontSize: FontSize.body, marginBottom: 24, lineHeight: 22 },
  statusTimeline: { marginBottom: 24, padding: 16, backgroundColor: Colors.background, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border },
  timelineTitle: { color: Colors.textPrimary, fontWeight: 'bold', marginBottom: 8, fontSize: FontSize.cardTitle },
  timelineItem: { color: Colors.textMuted, fontSize: 13, marginBottom: 6 },
  photosSection: { marginBottom: 24 },
  photoBox: { width: 80, height: 80, backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  photoBoxText: { color: Colors.textMuted, fontSize: 11 },
  markUrgentBtn: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.danger, paddingVertical: 14, borderRadius: Radius.button, alignItems: 'center', marginTop: 12 },
  markUrgentBtnText: { color: Colors.danger, fontWeight: 'bold', fontSize: FontSize.body },
});
