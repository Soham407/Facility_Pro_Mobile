import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useManagerData } from '../../hooks/useManagerData';
import { useLeave } from '../../hooks/useLeave';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';

export function StaffScreen() {
  const { data: managerData } = useManagerData();
  const { approveLeave, rejectLeave } = useLeave();
  const [searchQuery, setSearchQuery] = useState('');
  const [showApprovals, setShowApprovals] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingLeaves = managerData?.pendingLeaves || [];

  const { data: staffList, isLoading } = useQuery({
    queryKey: ['managerStaffList'],
    queryFn: async () => {
      // Basic implementation - fetch employees and check attendance for today
      const today = new Date().toISOString().split('T')[0];
      const { data: employees } = await supabase
        .from('employees')
        .select('*, attendance_logs(log_date, check_in_time)');
        
      return (employees || []).map(emp => {
        const todayLog = emp.attendance_logs?.find((l: any) => l.log_date === today);
        return {
          ...emp,
          checkedInToday: !!todayLog,
          checkInTime: todayLog?.check_in_time
        };
      });
    }
  });

  const filteredStaff = (staffList || []).filter(s => 
    s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    try {
      await approveLeave.mutateAsync(id);
      Alert.alert('Success', 'Leave approved');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }
    try {
      await rejectLeave.mutateAsync({ applicationId: rejectId, reason: rejectReason });
      setRejectId(null);
      setRejectReason('');
      Alert.alert('Success', 'Leave rejected');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Staff & Approvals</Text>

      {/* Leave Approvals Section */}
      <View style={styles.approvalsSection}>
        <TouchableOpacity 
          style={styles.approvalsHeader} 
          onPress={() => setShowApprovals(!showApprovals)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={20} color={Colors.white} />
            <Text style={styles.approvalsTitle}>{pendingLeaves.length} Pending Approvals</Text>
          </View>
          <Ionicons name={showApprovals ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.white} />
        </TouchableOpacity>
        
        {showApprovals && (
          <View style={styles.approvalsList}>
            {pendingLeaves.length === 0 ? (
              <Text style={styles.emptyText}>No pending leaves to approve</Text>
            ) : (
              pendingLeaves.map((leave) => (
                <View key={leave.id} style={styles.approvalCard}>
                  <Text style={styles.empName}>{leave.employees?.first_name} {leave.employees?.last_name}</Text>
                  <Text style={styles.leaveType}>{leave.leave_types?.leave_type_name} ({leave.total_days} days)</Text>
                  <Text style={styles.datesText}>{leave.start_date} to {leave.end_date}</Text>
                  <Text style={styles.reasonText}>Reason: {leave.reason}</Text>
                  
                  <View style={styles.approvalActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn]} 
                      onPress={() => setRejectId(leave.id)}
                      disabled={approveLeave.isPending || rejectLeave.isPending}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.approveBtn]} 
                      onPress={() => handleApprove(leave.id)}
                      disabled={approveLeave.isPending || rejectLeave.isPending}
                    >
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* Reject Modal */}
      <Modal visible={!!rejectId} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reject Leave</Text>
            <Text style={styles.modalLabel}>Rejection Reason (required)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Explain why this is rejected..."
              placeholderTextColor={Colors.border}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setRejectId(null)} style={styles.cancelLink}><Text style={{ color: Colors.textMuted }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleReject} style={styles.confirmRejectBtn}>
                <Text style={{ color: Colors.white, fontWeight: 'bold' }}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Staff Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or code..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Staff List */}
      <FlatList
        data={filteredStaff}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.staffCard} onPress={() => setSelectedStaff(item)}>
            <View style={styles.staffAvatar}>
              <Text style={{ color: Colors.white, fontWeight: 'bold' }}>{item.first_name[0]}</Text>
              <View style={[styles.statusDot, { backgroundColor: item.checkedInToday ? Colors.success : Colors.border }]} />
            </View>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.staffRole}>{item.designation || 'Staff'} · {item.department || 'N/A'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Staff Detail Sheet */}
      {selectedStaff && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Staff Details</Text>
              <TouchableOpacity onPress={() => setSelectedStaff(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sheetProfile}>
              <View style={[styles.staffAvatar, { width: 64, height: 64, borderRadius: 32, marginBottom: 12 }]}>
                 <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 24 }}>{selectedStaff.first_name[0]}</Text>
              </View>
              <Text style={[styles.staffName, { fontSize: 20 }]}>{selectedStaff.first_name} {selectedStaff.last_name}</Text>
              <Text style={styles.staffRole}>{selectedStaff.employee_code} · {selectedStaff.designation}</Text>
            </View>

            <View style={styles.sheetInfoBox}>
              <Text style={styles.infoLabel}>Today's Attendance</Text>
              <Text style={styles.infoValue}>
                {selectedStaff.checkInTime ? `Checked in at ${new Date(selectedStaff.checkInTime).toLocaleTimeString()}` : 'Not yet checked in'}
              </Text>
            </View>

            <TouchableOpacity style={styles.sheetBtnOutline}>
              <Text style={styles.sheetBtnOutlineText}>View Payslips</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetBtnOutline, { borderColor: Colors.danger, marginTop: 12 }]}>
              <Text style={[styles.sheetBtnOutlineText, { color: Colors.danger }]}>Raise Behaviour Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerTitle: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  approvalsSection: { marginHorizontal: 16, marginBottom: 16, borderRadius: Radius.card, overflow: 'hidden' },
  approvalsHeader: { backgroundColor: Colors.accent, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  approvalsTitle: { color: Colors.white, fontWeight: 'bold', fontSize: FontSize.cardTitle },
  approvalsList: { backgroundColor: Colors.surface, padding: 16, borderWidth: 1, borderColor: Colors.border, borderTopWidth: 0, borderBottomLeftRadius: Radius.card, borderBottomRightRadius: Radius.card },
  emptyText: { color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center' },
  approvalCard: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  empName: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  leaveType: { color: Colors.textPrimary, fontSize: 13, marginBottom: 2 },
  datesText: { color: Colors.textMuted, fontSize: 12, marginBottom: 4 },
  reasonText: { color: Colors.textMuted, fontSize: 12, fontStyle: 'italic', marginBottom: 12 },
  approvalActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center' },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.danger },
  rejectBtnText: { color: Colors.danger, fontWeight: 'bold', fontSize: 12 },
  approveBtn: { backgroundColor: Colors.success },
  approveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: Colors.surface, width: '100%', padding: 24, borderRadius: Radius.card },
  modalTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalLabel: { color: Colors.textMuted, marginBottom: 8 },
  textArea: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, color: Colors.textPrimary, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 24 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  cancelLink: { padding: 8 },
  confirmRejectBtn: { backgroundColor: Colors.danger, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.sm },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 16, borderRadius: Radius.button, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.textPrimary, height: 48, marginLeft: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  staffCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.card, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  staffAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.surface },
  staffInfo: { flex: 1, marginLeft: 16 },
  staffName: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  staffRole: { color: Colors.textMuted, fontSize: 12 },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  sheetProfile: { alignItems: 'center', marginBottom: 24 },
  sheetInfoBox: { backgroundColor: Colors.background, padding: 16, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  infoLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 4 },
  infoValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  sheetBtnOutline: { borderWidth: 1, borderColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.button, alignItems: 'center' },
  sheetBtnOutlineText: { color: Colors.primary, fontWeight: 'bold' },
});
