import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLeave } from '../../hooks/useLeave';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';

type Tab = 'my_leaves' | 'apply';
type Filter = 'All' | 'pending' | 'approved' | 'rejected';

export function LeaveScreen() {
  const { leaveBalance, leaveTypes, leaveHistory, isLoadingHistory, submitLeave } = useLeave();
  const [activeTab, setActiveTab] = useState<Tab>('my_leaves');
  const [filter, setFilter] = useState<Filter>('All');
  
  // Form State
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (e < s) return 0;
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApply = async () => {
    if (!selectedTypeId) return Alert.alert('Error', 'Select a leave type');
    if (!startDate || !endDate) return Alert.alert('Error', 'Select dates');
    const days = calculateDays(startDate, endDate);
    if (days <= 0) return Alert.alert('Error', 'Invalid date range');
    if (reason.length < 10) return Alert.alert('Error', 'Reason must be at least 10 characters');

    try {
      await submitLeave.mutateAsync({
        leave_type_id: selectedTypeId,
        start_date: startDate,
        end_date: endDate,
        total_days: days,
        reason
      });
      Alert.alert('Success', 'Application submitted — your supervisor will be notified');
      setActiveTab('my_leaves');
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      setSelectedTypeId('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const filteredHistory = leaveHistory.filter(h => filter === 'All' || h.status === filter);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return Colors.success;
      case 'rejected': return Colors.danger;
      case 'pending': return Colors.accent;
      default: return Colors.textMuted;
    }
  };

  const renderHistory = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyType}>{item.leave_types?.leave_type_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.datesText}>{new Date(item.start_date).toLocaleDateString()} to {new Date(item.end_date).toLocaleDateString()} ({item.total_days} days)</Text>
      <Text style={styles.reasonText}>{item.reason}</Text>
      {item.status === 'rejected' && item.rejection_reason && (
        <View style={styles.rejectComment}>
          <Text style={{ color: Colors.danger, fontSize: 12, fontStyle: 'italic' }}>Reason: {item.rejection_reason}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Leave Management</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'my_leaves' && styles.activeTab]} onPress={() => setActiveTab('my_leaves')}>
          <Text style={[styles.tabText, activeTab === 'my_leaves' && styles.activeTabText]}>My Leaves</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'apply' && styles.activeTab]} onPress={() => setActiveTab('apply')}>
          <Text style={[styles.tabText, activeTab === 'apply' && styles.activeTabText]}>Apply</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'my_leaves' ? (
        <ScrollView style={styles.scrollContent}>
          {/* Balance Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 24 }}>
            {leaveBalance.map((bal, idx) => (
              <View key={idx} style={styles.balanceCard}>
                <Text style={styles.balTitle}>{bal.type}</Text>
                <Text style={styles.balValue}>{bal.remaining} <Text style={styles.balMax}>/ {bal.max} left</Text></Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${(bal.used / bal.max) * 100}%`, backgroundColor: Colors.primary }]} />
                </View>
                <Text style={styles.balUsed}>{bal.used} days used</Text>
              </View>
            ))}
          </ScrollView>

          {/* Filters */}
          <View style={styles.filtersRow}>
            {(['All', 'pending', 'approved', 'rejected'] as Filter[]).map(f => (
              <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.activeFilterChip]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterChipText, filter === f && styles.activeFilterText]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* History */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            {isLoadingHistory ? (
              <ActivityIndicator color={Colors.primary} />
            ) : filteredHistory.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.textMuted, marginTop: 24 }}>No leaves found.</Text>
            ) : (
              filteredHistory.map(item => <React.Fragment key={item.id}>{renderHistory({item})}</React.Fragment>)
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <Text style={styles.label}>Leave Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {leaveTypes.map(lt => (
              <TouchableOpacity 
                key={lt.id}
                style={[styles.typeChip, selectedTypeId === lt.id && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                onPress={() => setSelectedTypeId(lt.id)}
              >
                <Text style={[styles.typeText, selectedTypeId === lt.id && { color: Colors.white }]}>{lt.leave_type_name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Start Date</Text>
              <TextInput style={styles.dateInput} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.border} value={startDate} onChangeText={setStartDate} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>End Date</Text>
              <TextInput style={styles.dateInput} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.border} value={endDate} onChangeText={setEndDate} />
            </View>
          </View>

          {startDate && endDate && (
            <Text style={styles.calcText}>Total: {calculateDays(startDate, endDate)} working days</Text>
          )}

          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={styles.reasonInput}
            multiline
            placeholder="Please detail why you need this leave..."
            placeholderTextColor={Colors.border}
            value={reason}
            onChangeText={setReason}
          />

          <Button 
            title="Submit Leave Request" 
            onPress={handleApply} 
            loading={submitLeave.isPending} 
            style={{ marginTop: 24 }}
          />
        </ScrollView>
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
  scrollContent: { flex: 1 },
  balanceCard: { width: 140, backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border },
  balTitle: { color: Colors.textPrimary, fontWeight: '600', fontSize: 13, marginBottom: 8 },
  balValue: { color: Colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  balMax: { fontSize: 12, color: Colors.textMuted, fontWeight: 'normal' },
  progressBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  balUsed: { color: Colors.textMuted, fontSize: 11 },
  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border },
  activeFilterChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' },
  activeFilterText: { color: Colors.white },
  historyCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyType: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  datesText: { color: Colors.textMuted, fontSize: 13, marginBottom: 6 },
  reasonText: { color: Colors.textPrimary, fontSize: 13, lineHeight: 20 },
  rejectComment: { marginTop: 8, padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: Radius.sm },
  label: { color: Colors.textPrimary, fontWeight: 'bold', marginBottom: 8, fontSize: FontSize.body },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.button, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  typeText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  dateInput: { height: 48, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, paddingHorizontal: 12, color: Colors.textPrimary },
  calcText: { color: Colors.accent, fontWeight: 'bold', fontSize: 12, marginBottom: 20 },
  reasonInput: { height: 100, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, padding: 12, color: Colors.textPrimary, textAlignVertical: 'top' },
});
