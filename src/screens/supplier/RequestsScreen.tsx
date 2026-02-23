import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSupplierData } from '../../hooks/useSupplierData';
import { Colors, FontSize, Radius, MIN_TOUCH_TARGET, Spacing } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

type Tab = 'inbox' | 'active' | 'history';

export function RequestsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const { 
    indents, activePOs, isLoading, 
    acceptIndent, declineIndent, confirmPOReceived, markDispatched 
  } = useSupplierData();

  // Modals state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleDecline = async () => {
    if (!rejectingId || !rejectReason) return;
    try {
      await declineIndent(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDispatch = async () => {
    if (!dispatchingId || !vehicleNo || !driverName || !etaDate) {
      Alert.alert('Missing Fields', 'Please fill all required dispatch details.');
      return;
    }
    try {
      await markDispatched(dispatchingId, {
        vehicle_number: vehicleNo,
        driver_name: driverName,
        estimated_arrival: etaDate,
        notes
      });
      setDispatchingId(null);
      setVehicleNo(''); setDriverName(''); setEtaDate(''); setNotes('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const renderInboxCard = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Text style={styles.reqNumber}>{item.request_number}</Text>
      <Text style={styles.serviceName}>{item.services?.service_name}</Text>
      <Text style={styles.detailText}>Qty: {item.quantity || 1} {item.unit || 'unit'}</Text>
      {item.scheduled_date && <Text style={styles.detailText}>Required: {new Date(item.scheduled_date).toLocaleDateString()}</Text>}
      <Text style={styles.detailText}>For: {item.company_locations?.location_name}</Text>
      
      <View style={styles.actionRow}>
        <Button title="DECLINE" variant="danger" onPress={() => setRejectingId(item.id)} style={{ flex: 1 }} />
        <Button title="ACCEPT" variant="primary" onPress={() => acceptIndent(item.id)} style={{ flex: 1, backgroundColor: Colors.success, borderColor: Colors.success }} />
      </View>
    </Card>
  );

  const renderActiveCard = ({ item }: { item: any }) => {
    const poNumber = item.purchase_orders?.[0]?.po_number;
    
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.reqNumber}>{item.request_number}</Text>
          <Badge label={item.status.replace('_', ' ').toUpperCase()} variant={item.status === 'po_dispatched' ? 'success' : 'info'} />
        </View>
        
        <Text style={styles.serviceName}>{item.services?.service_name}</Text>
        {poNumber && <Text style={styles.poNumber}>PO: {poNumber}</Text>}
        
        <View style={{ marginTop: 16 }}>
          {item.status === 'indent_accepted' && <Text style={styles.pendingText}>Awaiting PO generation from Admin</Text>}
          {item.status === 'po_issued' && <Button title="CONFIRM PO RECEIVED" onPress={() => confirmPOReceived(item.id)} />}
          {item.status === 'po_received' && <Button title="MARK DISPATCHED" onPress={() => setDispatchingId(item.id)} />}
          {item.status === 'po_dispatched' && <Text style={styles.pendingText}>In Transit. Awaiting delivery confirmation.</Text>}
        </View>
      </Card>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Supplier Dashboard</Text>
      </View>

      <View style={styles.tabContainer}>
        {['inbox', 'active', 'history'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.activeTab]} onPress={() => setActiveTab(t as Tab)}>
            <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />}

      {!isLoading && activeTab === 'inbox' && (
        <FlatList
          data={indents || []}
          renderItem={renderInboxCard}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending indents.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}

      {!isLoading && activeTab === 'active' && (
        <FlatList
          data={activePOs || []}
          renderItem={renderActiveCard}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No active orders.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}

      {!isLoading && activeTab === 'history' && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>History placeholder — showing past 60 days</Text>
        </View>
      )}

      {/* Decline Reason Modal */}
      <Modal visible={!!rejectingId} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline Indent</Text>
            <Text style={styles.label}>Reason for declining *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline value={rejectReason} onChangeText={setRejectReason}
              placeholder="Out of stock, invalid timeline, etc." placeholderTextColor={Colors.border}
            />
            <View style={styles.actionRow}>
              <Button title="Cancel" variant="ghost" onPress={() => setRejectingId(null)} style={{ flex: 1 }} />
              <Button title="Submit" onPress={handleDecline} disabled={!rejectReason} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Dispatch Modal */}
      <Modal visible={!!dispatchingId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%', padding: 0 }]}>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>Dispatch Details</Text>
                 <TouchableOpacity onPress={() => setDispatchingId(null)}>
                   <Ionicons name="close" size={24} color={Colors.textMuted} />
                 </TouchableOpacity>
              </View>

              <Text style={styles.label}>Vehicle Number *</Text>
              <TextInput style={styles.input} value={vehicleNo} onChangeText={setVehicleNo} placeholderTextColor={Colors.border} />

              <Text style={styles.label}>Driver Name *</Text>
              <TextInput style={styles.input} value={driverName} onChangeText={setDriverName} placeholderTextColor={Colors.border} />

              <Text style={styles.label}>Estimated Arrival Date *</Text>
              <TextInput style={styles.input} value={etaDate} onChangeText={setEtaDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.border} />

              <Text style={styles.label}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline value={notes} onChangeText={setNotes} placeholderTextColor={Colors.border} />

              <Button title="MARK AS DISPATCHED" onPress={handleDispatch} style={{ marginTop: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: 16 },
  title: { fontSize: FontSize.screenTitle, fontWeight: 'bold', color: Colors.textPrimary },
  tabContainer: { flexDirection: 'row', marginBottom: 16, backgroundColor: Colors.surface, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { backgroundColor: Colors.border },
  tabText: { color: Colors.textMuted, fontSize: FontSize.body, fontWeight: '600' },
  activeTabText: { color: Colors.textPrimary },
  listContent: { paddingBottom: 24 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reqNumber: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: 'bold', marginBottom: 4 },
  poNumber: { color: Colors.primaryLight, fontSize: FontSize.body, fontWeight: 'bold', marginTop: 4 },
  serviceName: { color: Colors.textPrimary, fontSize: FontSize.cardTitle, fontWeight: 'bold', marginBottom: 8 },
  detailText: { color: Colors.textMuted, fontSize: FontSize.body, marginBottom: 4 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 24, fontStyle: 'italic' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pendingText: { color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: FontSize.sectionTitle, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 16 },
  label: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, paddingHorizontal: 16, height: MIN_TOUCH_TARGET, color: Colors.textPrimary },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
});
