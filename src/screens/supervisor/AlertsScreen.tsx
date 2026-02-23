import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';
import { setupSupervisorRealtime } from '../../lib/realtime';

export function AlertsScreen() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<any[]>([]);
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  const fetchAlerts = async () => {
    // Active
    const { data: act } = await supabase
      .from('panic_alerts')
      .select(`
        *,
        security_guards!inner (
          guard_code,
          employees (first_name, last_name)
        ),
        company_locations (location_name)
      `)
      .eq('is_resolved', false)
      .order('alert_time', { ascending: false });

    if (act) setActiveAlerts(act);

    // Resolved today
    const today = new Date().toISOString().split('T')[0];
    const { data: res } = await supabase
      .from('panic_alerts')
      .select(`
        *,
        security_guards!inner (
          guard_code,
          employees (first_name, last_name)
        ),
        company_locations (location_name),
        resolver:resolved_by (first_name, last_name)
      `)
      .eq('is_resolved', true)
      .gte('resolved_at', `${today}T00:00:00Z`)
      .order('resolved_at', { ascending: false });

    if (res) setResolvedAlerts(res);
  };

  useEffect(() => {
    fetchAlerts();

    const channel = setupSupervisorRealtime((newAlert) => {
      Vibration.vibrate([0, 500, 200, 500]);
      // Ideally show in-app banner here or use a toast library
      // For now we just refresh the list
      fetchAlerts();
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleResolve = async () => {
    if (!resolvingId || !user) return;
    
    const { error } = await supabase
      .from('panic_alerts')
      .update({
        is_resolved: true,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        description: resolveNote ? resolveNote : undefined,
      })
      .eq('id', resolvingId);
      
    if (!error) {
      setResolvingId(null);
      setResolveNote('');
      fetchAlerts();
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'panic': return Colors.danger;
      case 'inactivity': return Colors.accent;
      case 'geo_fence_breach': return '#EA580C'; // orange
      case 'checklist_incomplete': return '#EAB308'; // yellow
      default: return Colors.border;
    }
  };

  const renderActive = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: getAlertColor(item.alert_type) }]}>
          <Text style={styles.badgeText}>{item.alert_type.toUpperCase().replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.timeText}>{new Date(item.alert_time).toLocaleTimeString()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.guardName}>
          {item.security_guards?.employees?.first_name} {item.security_guards?.employees?.last_name} ({item.security_guards?.guard_code})
        </Text>
        <Text style={styles.locationText}>📍 {item.company_locations?.location_name || 'Unknown Location'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.resolveBtn} 
        onPress={() => setResolvingId(item.id)}
      >
        <Text style={styles.resolveBtnText}>RESOLVE</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResolved = ({ item }: { item: any }) => (
    <View style={[styles.card, { opacity: 0.7 }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: Colors.border }]}>
          <Text style={styles.badgeText}>{item.alert_type.toUpperCase().replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.timeText}>Resolved: {new Date(item.resolved_at).toLocaleTimeString()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.guardName}>
          {item.security_guards?.employees?.first_name} {item.security_guards?.employees?.last_name} ({item.security_guards?.guard_code})
        </Text>
        <Text style={styles.locationText}>📍 {item.company_locations?.location_name || 'Unknown Location'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Alerts Center</Text>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]} 
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active ({activeAlerts.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'resolved' && styles.activeTab]} 
          onPress={() => setActiveTab('resolved')}
        >
          <Text style={[styles.tabText, activeTab === 'resolved' && styles.activeTabText]}>Resolved Today</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'active' ? activeAlerts : resolvedAlerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={activeTab === 'active' ? renderActive : renderResolved}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            <Text style={styles.emptyText}>All clear — no active alerts</Text>
          </View>
        )}
      />

      {/* Resolution Bottom Sheet (simplified inline view) */}
      {resolvingId && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Resolution</Text>
            <Text style={styles.modalDesc}>Add a note (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Guard acknowledged mistake..."
              placeholderTextColor={Colors.border}
              value={resolveNote}
              onChangeText={setResolveNote}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setResolvingId(null)}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleResolve}>
                <Text style={styles.confirmBtnText}>CONFIRM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerTitle: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: FontSize.body, fontWeight: '600' },
  activeTabText: { color: Colors.primary },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  timeText: { color: Colors.textMuted, fontSize: 12 },
  cardBody: { marginBottom: 16 },
  guardName: { color: Colors.textPrimary, fontSize: FontSize.cardTitle, fontWeight: 'bold', marginBottom: 4 },
  locationText: { color: Colors.textMuted, fontSize: 13 },
  resolveBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.button, borderWidth: 1, borderColor: Colors.danger },
  resolveBtnText: { color: Colors.danger, fontWeight: 'bold', fontSize: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body, marginTop: 16 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSize.sectionTitle, fontWeight: 'bold', marginBottom: 8 },
  modalDesc: { color: Colors.textMuted, fontSize: FontSize.body, marginBottom: 16 },
  textInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, color: Colors.textPrimary, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  cancelBtnText: { color: Colors.textMuted, fontWeight: 'bold' },
  confirmBtn: { backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: Radius.button },
  confirmBtnText: { color: Colors.white, fontWeight: 'bold' },
});
