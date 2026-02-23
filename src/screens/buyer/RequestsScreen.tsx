import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useBuyerOrders } from '../../hooks/useBuyerOrders';
import { useCurrentEmployee } from '../../hooks/useCurrentEmployee';
import { Colors, FontSize, Radius, MIN_TOUCH_TARGET } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

type Tab = 'my_orders' | 'new_request';

export function RequestsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('my_orders');
  const navigation = useNavigation<any>();
  const { orders, isLoading, refetch, submitOrder } = useBuyerOrders();
  const { data: employee } = useCurrentEmployee();

  // New Request Form State
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedDate, setSelectedDate] = useState(''); // Just using text for now, ideally DatePicker
  const [selectedFlat, setSelectedFlat] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    const { data: svcs } = await supabase.from('services').select('*').eq('is_active', true);
    const { data: flts } = await supabase.from('flats').select('*');
    if (svcs) {
      setServices(svcs);
      const cats = Array.from(new Set(svcs.map(s => s.service_category)));
      setCategories(cats);
    }
    if (flts) setFlats(flts);
  };

  const handleCreateRequest = async () => {
    if (!selectedService || !description || !selectedDate) {
      Alert.alert('Incomplete Form', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      // Need a request number like REQ-2026-0042
      const reqNo = `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      await submitOrder({
        request_number: reqNo,
        service_id: selectedService,
        description,
        quantity: parseInt(quantity) || null,
        scheduled_date: selectedDate,
        flat_id: selectedFlat || null,
        location_id: (employee as any)?.company_location_id, // assuming location is linked to employee or user
        priority: 'normal',
      });
      
      Alert.alert('Success', 'Request submitted successfully');
      
      // Reset form
      setSelectedService('');
      setDescription('');
      setQuantity('1');
      setSelectedDate('');
      setSelectedFlat('');
      
      setActiveTab('my_orders');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit request');
    }
    setSubmitting(false);
  };

  const renderOrderCard = ({ item }: { item: any }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('Track', { orderId: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.reqNumber}>{item.request_number}</Text>
        <Badge label={item.status.replace('_', ' ').toUpperCase()} variant={item.status === 'completed' ? 'success' : 'info'} />
      </View>
      <Text style={styles.serviceName}>{item.services?.service_name}</Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        {item.estimated_amount != null && (
          <Text style={styles.amountText}>₹{(item.estimated_amount / 100).toFixed(2)}</Text>
        )}
      </View>
    </Card>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Service Requests</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'my_orders' && styles.activeTab]} onPress={() => setActiveTab('my_orders')}>
          <Text style={[styles.tabText, activeTab === 'my_orders' && styles.activeTabText]}>My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'new_request' && styles.activeTab]} onPress={() => setActiveTab('new_request')}>
          <Text style={[styles.tabText, activeTab === 'new_request' && styles.activeTabText]}>New Request</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'my_orders' ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.emptyText}>No service requests found.</Text>}
        />
      ) : (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            {categories.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.pill, selectedCategory === c && styles.pillActive]}
                onPress={() => { setSelectedCategory(c); setSelectedService(''); }}
              >
                <Text style={[styles.pillText, selectedCategory === c && styles.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedCategory ? (
            <>
              <Text style={styles.label}>Service *</Text>
              <View style={styles.serviceGrid}>
                {services.filter(s => s.service_category === selectedCategory).map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.serviceOption, selectedService === s.id && styles.serviceActive]}
                    onPress={() => setSelectedService(s.id)}
                  >
                    <Text style={[styles.serviceText, selectedService === s.id && styles.serviceTextActive]}>{s.service_name}</Text>
                    {s.base_price ? <Text style={styles.priceText}>Base: ₹{(s.base_price / 100).toFixed(0)}</Text> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue or requirement..."
            placeholderTextColor={Colors.border}
          />

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor={Colors.border}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Preferred Date *</Text>
              <TextInput
                style={styles.input}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.border}
              />
            </View>
          </View>

          <Text style={styles.label}>Flat (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            {flats.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.pill, selectedFlat === f.id && styles.pillActive]}
                onPress={() => setSelectedFlat(f.id)}
              >
                <Text style={[styles.pillText, selectedFlat === f.id && styles.pillTextActive]}>{f.flat_number}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.hint}>Location is autofilled based on your assigned company location.</Text>

          <Button 
            title="SUBMIT REQUEST" 
            onPress={handleCreateRequest} 
            loading={submitting} 
            style={{ marginTop: 32 }}
          />
        </ScrollView>
      )}
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
  reqNumber: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: 'bold' },
  serviceName: { color: Colors.textPrimary, fontSize: FontSize.cardTitle, fontWeight: 'bold', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  dateText: { color: Colors.textMuted, fontSize: FontSize.caption },
  amountText: { color: Colors.primaryLight, fontWeight: 'bold', fontSize: FontSize.body },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 24 },
  formContainer: { flex: 1 },
  label: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, paddingHorizontal: 16, height: MIN_TOUCH_TARGET, color: Colors.textPrimary },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  pillScroll: { flexGrow: 0, marginBottom: 8 },
  pill: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryDark },
  pillText: { color: Colors.textMuted, fontWeight: '600' },
  pillTextActive: { color: Colors.white },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceOption: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.card, padding: 12, width: '48%' },
  serviceActive: { borderColor: Colors.primaryLight, backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  serviceText: { color: Colors.textPrimary, fontWeight: 'bold', marginBottom: 4 },
  serviceTextActive: { color: Colors.primaryLight },
  priceText: { color: Colors.textMuted, fontSize: FontSize.caption },
  hint: { color: Colors.textMuted, fontSize: FontSize.caption, fontStyle: 'italic', marginTop: 16 },
});
