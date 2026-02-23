import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupplierData } from '../../hooks/useSupplierData';
import { Colors, FontSize, Radius, MIN_TOUCH_TARGET, Spacing } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PhotoCapture } from '../../components/shared/PhotoCapture';

export function BillScreen() {
  const { bills, activePOs, isLoading, refetchBills, submitBill } = useSupplierData();
  const [showNewBill, setShowNewBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);

  // Form State
  const [selectedPoId, setSelectedPoId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [billUrl, setBillUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pendingCount = bills?.filter((b: any) => b.payment_status === 'pending').length || 0;
  const eligiblePOs = activePOs?.flatMap((r: any) => r.purchase_orders || []) || [];

  const handleSubmitBill = async () => {
    if (!selectedPoId || !billNumber || !billDate || !amountStr || !billUrl) {
      Alert.alert('Incomplete', 'All fields and document upload are required.');
      return;
    }

    setSubmitting(true);
    try {
      const amtPaise = Math.round(parseFloat(amountStr) * 100);
      await submitBill({
        po_id: selectedPoId,
        bill_number: billNumber,
        bill_date: billDate,
        total_amount: amtPaise,
        bill_document_url: billUrl,
      });

      Alert.alert('Success', 'Bill submitted. Awaiting reconciliation.');
      setShowNewBill(false);
      
      // Reset
      setSelectedPoId(''); setBillNumber(''); setBillDate(''); setAmountStr(''); setBillUrl(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit bill.');
    }
    setSubmitting(false);
  };

  const getMatchColor = (status: string) => {
    if (status === 'matched') return 'success';
    if (status === 'unmatched') return 'danger';
    return 'warning';
  };

  const renderBillCard = ({ item }: { item: any }) => (
    <Card style={styles.card} onPress={() => setSelectedBill(item)}>
      <View style={styles.headerRow}>
        <Text style={styles.billNumber}>{item.bill_number}</Text>
        <Text style={styles.amount}>₹{(item.total_amount / 100).toFixed(2)}</Text>
      </View>
      <Text style={styles.poNumber}>PO: {item.purchase_orders?.po_number}</Text>
      
      <View style={styles.badgeRow}>
        <Badge label={`Match: ${item.match_status.replace('_', ' ').toUpperCase()}`} variant={getMatchColor(item.match_status)} />
        <Badge label={`Pay: ${item.payment_status.toUpperCase()}`} variant={item.payment_status === 'paid' ? 'success' : 'warning'} />
      </View>
      <Text style={styles.dateText}>Submitted: {new Date(item.submitted_at).toLocaleDateString()}</Text>
    </Card>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Billing</Text>
        {pendingCount > 0 && <Badge label={`${pendingCount} Pending`} variant="warning" />}
      </View>

      <FlatList
        data={bills}
        renderItem={renderBillCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetchBills}
        ListEmptyComponent={<Text style={styles.emptyText}>No bills submitted.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowNewBill(true)}>
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      {/* New Bill Bottom Sheet */}
      <Modal visible={showNewBill} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submit New Bill</Text>
                <TouchableOpacity onPress={() => setShowNewBill(false)}>
                   <Ionicons name="close" size={24} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Select Purchase Order *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {eligiblePOs.map((po: any) => (
                  <TouchableOpacity
                    key={po.id || po.po_number}
                    style={[styles.pill, selectedPoId === po.id && styles.pillActive]}
                    onPress={() => setSelectedPoId(po.id)}
                  >
                    <Text style={[styles.pillText, selectedPoId === po.id && styles.pillTextActive]}>{po.po_number}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {eligiblePOs.length === 0 && <Text style={{ color: Colors.danger, fontSize: 12 }}>No active POs available</Text>}

              <Text style={styles.label}>Bill Number *</Text>
              <TextInput style={styles.input} value={billNumber} onChangeText={setBillNumber} placeholder="INV-2026-..." placeholderTextColor={Colors.border} />

              <Text style={styles.label}>Bill Date *</Text>
              <TextInput style={styles.input} value={billDate} onChangeText={setBillDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.border} />

              <Text style={styles.label}>Total Amount (₹) *</Text>
              <TextInput style={styles.input} value={amountStr} onChangeText={setAmountStr} keyboardType="numeric" placeholder="0.00" placeholderTextColor={Colors.border} />

              <Text style={styles.label}>Upload Bill Document *</Text>
              <PhotoCapture 
                bucket="supplier-bills" 
                pathPrefix="bills" 
                onUploadComplete={setBillUrl} 
              />

              <Button title="SUBMIT BILL" onPress={handleSubmitBill} loading={submitting} disabled={!billUrl} style={{ marginTop: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bill Detail Full Screen Modal */}
      <Modal visible={!!selectedBill} animationType="fade">
        <ScreenWrapper>
          {selectedBill && (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedBill(null)}>
                 <Text style={styles.backText}>← Back to bills</Text>
              </TouchableOpacity>
              
              <Text style={styles.detailTitle}>Bill: {selectedBill.bill_number}</Text>
              <Text style={styles.poNumberLarge}>PO: {selectedBill.purchase_orders?.po_number}</Text>

              <View style={[styles.badgeRow, { marginTop: 16, marginBottom: 24 }]}>
                <Badge label={`Match: ${selectedBill.match_status.replace('_', ' ').toUpperCase()}`} variant={getMatchColor(selectedBill.match_status)} />
                <Badge label={`Pay: ${selectedBill.payment_status.toUpperCase()}`} variant={selectedBill.payment_status === 'paid' ? 'success' : 'warning'} />
              </View>

              <Card style={{ marginBottom: 20 }}>
                <Text style={styles.amountLarge}>₹{(selectedBill.total_amount / 100).toFixed(2)}</Text>
                <Text style={styles.label}>Match Explanation:</Text>
                {selectedBill.match_status === 'matched' && <Text style={{ color: Colors.success }}>Bill amount matches PO. Eligible for payment.</Text>}
                {selectedBill.match_status === 'pending' && <Text style={{ color: Colors.textMuted }}>Under review by finance team.</Text>}
                {selectedBill.match_status === 'unmatched' && <Text style={{ color: Colors.danger }}>Amount discrepancy detected. Contact admin.</Text>}
                {selectedBill.match_status === 'force_matched' && <Text style={{ color: Colors.accent }}>Admin approved override.</Text>}
              </Card>

              {selectedBill.bill_document_url && (
                <Button title="View Document" variant="secondary" onPress={() => Alert.alert('File', selectedBill.bill_document_url)} />
              )}
            </ScrollView>
          )}
        </ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.screenTitle, fontWeight: 'bold', color: Colors.textPrimary },
  listContent: { paddingBottom: 80 },
  card: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  billNumber: { fontSize: FontSize.cardTitle, fontWeight: 'bold', color: Colors.textPrimary },
  amount: { fontSize: FontSize.sectionTitle, fontWeight: 'bold', color: Colors.primaryLight },
  poNumber: { color: Colors.textMuted, fontSize: FontSize.body, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dateText: { color: Colors.textMuted, fontSize: FontSize.caption },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 24, fontStyle: 'italic' },
  
  fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, height: '85%', padding: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: FontSize.screenTitle, fontWeight: 'bold', color: Colors.textPrimary },
  label: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, paddingHorizontal: 16, height: MIN_TOUCH_TARGET, color: Colors.textPrimary },
  pillScroll: { flexGrow: 0, marginBottom: 8 },
  pill: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryDark },
  pillText: { color: Colors.textMuted, fontWeight: '600' },
  pillTextActive: { color: Colors.white },
  
  backBtn: { marginBottom: 24 },
  backText: { color: Colors.textMuted, fontSize: FontSize.body, fontWeight: 'bold' },
  detailTitle: { fontSize: FontSize.screenTitle, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  poNumberLarge: { color: Colors.textMuted, fontSize: FontSize.cardTitle },
  amountLarge: { fontSize: 32, fontWeight: 'bold', color: Colors.primaryLight, marginBottom: 16 },
});
