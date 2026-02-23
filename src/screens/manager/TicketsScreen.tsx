import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';
import { Button } from '../../components/ui/Button';

const CATEGORIES = [
  { id: 'sleeping_on_duty', label: 'Sleeping on Duty' },
  { id: 'rudeness', label: 'Rudeness' },
  { id: 'absence_from_post', label: 'Absence from Post' },
  { id: 'grooming_uniform', label: 'Grooming / Uniform' },
  { id: 'unauthorized_entry', label: 'Unauthorized Entry' }
];

export function TicketsScreen() {
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'raise' | 'history'>('raise');

  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [description, setDescription] = useState('');

  // Fetch staff for dropdown
  const { data: staff } = useQuery({
    queryKey: ['staffList'],
    queryFn: async () => {
      const { data } = await supabase.from('employees').select('id, first_name, last_name, employee_code').order('first_name');
      return data || [];
    }
  });

  // Fetch ticket history
  const { data: history } = useQuery({
    queryKey: ['ticketHistory', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('behaviour_tickets')
        .select('*, employees (first_name, last_name, employee_code)')
        .eq('raised_by', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const raiseTicket = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!employeeId || description.length < 20) {
        throw new Error('Please select an employee and provide a detailed description (min 20 chars)');
      }

      const { data, error } = await supabase.from('behaviour_tickets').insert({
        employee_id: employeeId,
        raised_by: user.id,
        category,
        severity,
        description,
        incident_date: new Date().toISOString().split('T')[0]
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      Alert.alert('Success', `Ticket #${data.id.split('-')[0]} raised successfully`);
      setEmployeeId('');
      setDescription('');
      setCategory(CATEGORIES[0].id);
      setSeverity('low');
      setActiveTab('history');
      queryClient.invalidateQueries({ queryKey: ['ticketHistory'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message);
    }
  });

  const getSeverityColor = (sev: string) => {
    if (sev === 'high') return Colors.danger;
    if (sev === 'medium') return '#EA580C'; // orange
    return Colors.accent; // yellow-ish amber
  };

  const getCategoryLabel = (cat: string) => {
    return CATEGORIES.find(c => c.id === cat)?.label || cat;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Behaviour Tickets</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'raise' && styles.activeTab]} onPress={() => setActiveTab('raise')}>
          <Text style={[styles.tabText, activeTab === 'raise' && styles.activeTabText]}>Raise Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => setActiveTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'raise' ? (
        <ScrollView style={styles.formContent}>
          <Text style={styles.label}>Select Staff Member</Text>
          <View style={styles.pickerSim}>
            <TextInput 
              placeholder="Select employee ID..." 
              value={employeeId}
              onChangeText={setEmployeeId}
              style={{ color: Colors.textPrimary }}
              placeholderTextColor={Colors.border}
            />
          </View>
          <Text style={styles.hint}>* Enter employee UUID for now (Select UI pending)</Text>

          <Text style={[styles.label, { marginTop: 16 }]}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {CATEGORIES.map(c => (
              <TouchableOpacity 
                key={c.id} 
                style={[styles.chip, category === c.id && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                onPress={() => setCategory(c.id)}
              >
                <Text style={[styles.chipText, category === c.id && { color: Colors.white }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Severity</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {['low', 'medium', 'high'].map((sev) => (
              <TouchableOpacity 
                key={sev}
                style={[styles.severityBtn, severity === sev && { backgroundColor: getSeverityColor(sev), borderColor: getSeverityColor(sev) }]}
                onPress={() => setSeverity(sev as any)}
              >
                <Text style={[styles.severityText, severity === sev && { color: Colors.white }]}>
                  {sev.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Describe the incident in detail (min 20 characters)"
            placeholderTextColor={Colors.border}
            value={description}
            onChangeText={setDescription}
          />

          <Button 
            title="Submit Ticket" 
            onPress={() => raiseTicket.mutate()} 
            loading={raiseTicket.isPending} 
            style={{ marginTop: 24, marginBottom: 40 }}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: getSeverityColor(item.severity) }]}>
                  <Text style={styles.badgeText}>{item.severity.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>{item.incident_date}</Text>
              </View>
              <Text style={styles.employeeName}>
                {item.employees?.first_name} {item.employees?.last_name} ({item.employees?.employee_code})
              </Text>
              <Text style={styles.categoryLabel}>{getCategoryLabel(item.category)}</Text>
              <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
            </View>
          )}
        />
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
  formContent: { paddingHorizontal: 16 },
  label: { color: Colors.textPrimary, fontWeight: 'bold', marginBottom: 8, fontSize: FontSize.body },
  hint: { color: Colors.textMuted, fontSize: 11, marginBottom: 8, fontStyle: 'italic' },
  pickerSim: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, paddingHorizontal: 16, paddingVertical: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  severityBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.button, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  severityText: { color: Colors.textMuted, fontWeight: 'bold', fontSize: 12 },
  textArea: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, padding: 16, minHeight: 120, textAlignVertical: 'top', color: Colors.textPrimary },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  dateText: { color: Colors.textMuted, fontSize: 12 },
  employeeName: { color: Colors.textPrimary, fontSize: FontSize.cardTitle, fontWeight: 'bold', marginBottom: 4 },
  categoryLabel: { color: Colors.primaryLight, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  descriptionText: { color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
});
