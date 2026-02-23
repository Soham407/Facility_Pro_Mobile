import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';
import { useSupervisorData } from '../../hooks/useSupervisorData';

export function ReportsScreen() {
  const { data } = useSupervisorData();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<'attendance' | 'compliance' | 'visitors' | null>('attendance');

  useEffect(() => {
    // Fetch today's attendance logs
    const fetchAttendance = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: att } = await supabase
        .from('attendance_logs')
        .select(`
          *,
          employees!inner (first_name, last_name, users!inner (roles (role_name)))
        `)
        .eq('log_date', today)
        .eq('employees.users.roles.role_name', 'security_guard');
      
      if (att) setAttendance(att);
    };
    fetchAttendance();
  }, []);

  const guards = data?.clockedInGuards || [];
  const todayStats = data?.todayStats || { checkInCount: 0, visitorCount: 0, complianceAvg: 0 };

  const handleExport = () => {
    // Show Coming soon toast (in RN you can use Alert or simply console.log for now)
    console.log('Export coming soon');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Reports</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Ionicons name="download-outline" size={16} color={Colors.primary} />
          <Text style={styles.exportBtnText}>EXPORT</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Attendance Report */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(expanded === 'attendance' ? null : 'attendance')}>
          <Text style={styles.cardTitle}>Attendance Report</Text>
          <Ionicons name={expanded === 'attendance' ? "chevron-up" : "chevron-down"} size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        
        {expanded === 'attendance' && (
          <View style={styles.cardContent}>
            {attendance.length === 0 ? <Text style={styles.emptyText}>No attendance records for today</Text> : (
              attendance.map((log, idx) => {
                let statusColor = Colors.success;
                if (log.status === 'absent') statusColor = Colors.danger;
                if (log.is_auto_punch_out) statusColor = Colors.accent;

                return (
                  <View key={`att-${idx}`} style={styles.rowItem}>
                    <Text style={styles.rowName}>{log.employees?.first_name} {log.employees?.last_name}</Text>
                    <View style={styles.rowDetails}>
                      <Text style={styles.rowTime}>{log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</Text>
                      <Text style={styles.rowTime}>{log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</Text>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>

      {/* 2. Checklist Compliance */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(expanded === 'compliance' ? null : 'compliance')}>
          <Text style={styles.cardTitle}>Checklist Compliance</Text>
          <Ionicons name={expanded === 'compliance' ? "chevron-up" : "chevron-down"} size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        {expanded === 'compliance' && (
          <View style={styles.cardContent}>
            <Text style={styles.avgText}>Average Compliance: {Math.round(todayStats.complianceAvg)}%</Text>
            {guards.map((guard, idx) => (
              <View key={`comp-${idx}`} style={styles.rowItem}>
                <Text style={styles.rowName}>{guard.first_name} {guard.last_name}</Text>
                {/* For full implementation, use get_guard_checklist_completion specifically per guard */}
                <Text style={styles.rowScore}>Pending Fetch</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 3. Visitor Summary */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(expanded === 'visitors' ? null : 'visitors')}>
          <Text style={styles.cardTitle}>Visitor Summary</Text>
          <Ionicons name={expanded === 'visitors' ? "chevron-up" : "chevron-down"} size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        {expanded === 'visitors' && (
          <View style={styles.cardContent}>
            <Text style={styles.rowName}>Total Entries Today: <Text style={styles.statBold}>{todayStats.visitorCount}</Text></Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingVertical: 8 },
  headerTitle: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.primary },
  exportBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardTitle: { fontSize: FontSize.cardTitle, fontWeight: '600', color: Colors.textPrimary },
  cardContent: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body, fontStyle: 'italic', textAlign: 'center' },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500', flex: 1 },
  rowDetails: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTime: { color: Colors.textMuted, fontSize: 12, width: 44, textAlign: 'right' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  avgText: { color: Colors.textPrimary, fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  rowScore: { color: Colors.accent, fontSize: 12, fontWeight: 'bold' },
  statBold: { fontWeight: 'bold', color: Colors.primary },
});
