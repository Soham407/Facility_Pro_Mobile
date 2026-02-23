import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useBuyerOrders } from '../../hooks/useBuyerOrders';
import { Colors, FontSize, Radius } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatusTimeline } from '../../components/shared/StatusTimeline';

export function TrackScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const initialOrderId = route.params?.orderId;

  const { orders, isLoading, refetch } = useBuyerOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
  const [billUrl, setBillUrl] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.orderId) {
      setSelectedOrderId(route.params.orderId);
      navigation.setParams({ orderId: null }); // clear params so we can go back to list if needed
    }
  }, [route.params?.orderId]);

  const selectedOrder = orders?.find(o => o.id === selectedOrderId);

  useEffect(() => {
    if (selectedOrder && ['material_received', 'completed'].includes(selectedOrder.status)) {
      fetchBill();
    }
  }, [selectedOrder]);

  const fetchBill = async () => {
    if (!selectedOrder) return;
    const { data } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('request_id', selectedOrder.id)
      .single();

    if (data?.id) {
      const { data: bill } = await supabase
        .from('purchase_bills')
        .select('bill_document_url')
        .eq('po_id', data.id)
        .single();
      if (bill?.bill_document_url) {
        setBillUrl(bill.bill_document_url);
      }
    }
  };

  const handleDownloadInvoice = () => {
    if (billUrl) {
      // Dummy action, usually use expo-linking or react-native-pdf in modal
      Linking.openURL(billUrl).catch(() => Alert.alert('Error', 'Cannot open invoice link'));
    }
  };

  const getTimestamps = (order: any) => {
    // Rough mock of timestamps based on single date fields or updated_at
    // Ideally from a request_status_logs table, but based on PRD:
    return {
      requested: order.created_at,
      accepted: ['accepted', 'indent_forwarded', 'po_issued', 'po_dispatched', 'delivered', 'material_received', 'completed'].includes(order.status) ? order.updated_at : null,
      indent_forwarded: ['indent_forwarded', 'po_issued', 'po_dispatched', 'delivered', 'material_received', 'completed'].includes(order.status) ? order.updated_at : null,
      po_issued: ['po_issued', 'po_dispatched', 'delivered', 'material_received', 'completed'].includes(order.status) ? order.updated_at : null,
      po_dispatched: ['po_dispatched', 'delivered', 'material_received', 'completed'].includes(order.status) ? order.updated_at : null,
      delivered: ['delivered', 'material_received', 'completed'].includes(order.status) ? order.completed_at || order.updated_at : null,
      completed: order.status === 'completed' ? order.feedback_submitted_at || order.updated_at : null,
    };
  };

  if (!selectedOrderId || !selectedOrder) {
    // List View
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <Text style={styles.title}>Track Orders</Text>
        </View>
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders to track.</Text>}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => setSelectedOrderId(item.id)}>
              <View style={styles.cardHeader}>
                <Text style={styles.reqNumber}>{item.request_number}</Text>
                <Badge label={item.status.replace('_', ' ').toUpperCase()} variant={item.status === 'completed' ? 'success' : 'info'} />
              </View>
              <Text style={styles.serviceName}>{item.services?.service_name}</Text>
              <Text style={styles.tapText}>Tap to view timeline <Text style={{ fontSize: 18 }}>→</Text></Text>
            </Card>
          )}
        />
      </ScreenWrapper>
    );
  }

  // Detail View
  const isPending = selectedOrder.status === 'pending';
  const showDownload = ['material_received', 'completed'].includes(selectedOrder.status);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.detailContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedOrderId(null)}>
          <Text style={styles.backText}>← Back to list</Text>
        </TouchableOpacity>

        <Card style={styles.topCard}>
          <Text style={styles.reqNumber}>{selectedOrder.request_number}</Text>
          <Text style={styles.serviceName}>{selectedOrder.services?.service_name}</Text>
          <View style={{ marginTop: 12 }}>
            <Badge label={selectedOrder.status.replace('_', ' ').toUpperCase()} variant={selectedOrder.status === 'completed' ? 'success' : 'info'} />
          </View>
        </Card>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          <StatusTimeline 
            currentStatus={selectedOrder.status} 
            timestamps={getTimestamps(selectedOrder)} 
          />
        </View>

        <View style={styles.bottomSection}>
          {selectedOrder.estimated_amount != null && (
            <Text style={styles.amountInfo}>Estimated: ₹{(selectedOrder.estimated_amount / 100).toFixed(2)}</Text>
          )}
          {selectedOrder.supplier_id && (
             <Text style={styles.supplierInfo}>Supplier assigned.</Text>
          )}

          {isPending && (
            <View style={styles.actionRow}>
              <Button title="REJECT" variant="danger" onPress={() => Alert.alert('Cancel', 'Order cancelled')} style={{ flex: 1 }} />
              <Button title="ACCEPT" variant="primary" onPress={() => Alert.alert('Accept', 'Order accepted')} style={{ flex: 1 }} />
            </View>
          )}

          {showDownload && billUrl && (
            <Button 
              title="Download Invoice" 
              variant="secondary" 
              onPress={handleDownloadInvoice} 
              style={{ marginTop: 24 }} 
            />
          )}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: 16 },
  title: { fontSize: FontSize.screenTitle, fontWeight: 'bold', color: Colors.textPrimary },
  listContent: { paddingBottom: 24 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 24 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reqNumber: { color: Colors.textMuted, fontWeight: 'bold' },
  serviceName: { color: Colors.textPrimary, fontSize: FontSize.cardTitle, fontWeight: 'bold', marginBottom: 12 },
  tapText: { color: Colors.primaryLight, fontSize: FontSize.caption, fontWeight: 'bold', alignSelf: 'flex-end' },
  
  detailContent: { paddingBottom: 40, paddingTop: 16 },
  backBtn: { marginBottom: 16 },
  backText: { color: Colors.textMuted, fontSize: FontSize.body, fontWeight: 'bold' },
  topCard: { backgroundColor: Colors.surface, padding: 20, marginBottom: 24, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border },
  timelineSection: { backgroundColor: Colors.surface, padding: 20, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  sectionTitle: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 16 },
  bottomSection: { paddingHorizontal: 8 },
  amountInfo: { color: Colors.textPrimary, fontSize: FontSize.sectionTitle, fontWeight: 'bold', marginBottom: 8 },
  supplierInfo: { color: Colors.textMuted, fontSize: FontSize.body, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
});
