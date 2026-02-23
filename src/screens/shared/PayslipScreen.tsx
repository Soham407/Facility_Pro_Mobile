import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { usePayslips } from '../../hooks/usePayslips';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, Radius } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

export function PayslipScreen() {
  const { payslips, selectedMonth, selectedPayslip, isLoading, selectMonth } = usePayslips();
  const user = useAuthStore(s => s.user);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Generate last 12 months array for the slider
  const getMonths = () => {
    const list = [];
    let d = new Date();
    for (let i = 0; i < 12; i++) {
      list.push({ m: d.getMonth() + 1, y: d.getFullYear(), id: `${d.getFullYear()}-${d.getMonth()+1}` });
      d.setMonth(d.getMonth() - 1);
    }
    return list;
  };
  const monthList = getMonths();

  const getMonthName = (m: number) => {
    const d = new Date();
    d.setMonth(m - 1);
    return d.toLocaleString('en-US', { month: 'short' });
  };

  const formatRupee = (paise: number) => {
    const rupees = Math.floor(paise / 100);
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  const loadPdf = async () => {
    if (!selectedPayslip?.payslip_pdf_url) {
      Alert.alert('Not Available', 'Payslip PDF not generated yet — contact HR');
      return;
    }

    try {
      setPdfLoading(true);
      setShowPdf(true);
      const { data } = await supabase.storage
        .from('payslips') // Assuming 'payslips' bucket
        .createSignedUrl(selectedPayslip.payslip_pdf_url, 60 * 60);

      if (data?.signedUrl) {
        setPdfUrl(data.signedUrl);
      } else {
        throw new Error('Could not get signed URL');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setShowPdf(false);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Payslips</Text>

      {/* Month Selector */}
      <View style={{ height: 60, marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
          {monthList.map((item) => {
            const isSelected = selectedMonth.month === item.m && selectedMonth.year === item.y;
            return (
              <TouchableOpacity 
                key={item.id}
                style={[styles.monthPill, isSelected && styles.monthPillSelected]}
                onPress={() => selectMonth(item.m, item.y)}
              >
                <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>
                  {getMonthName(item.m)} {item.y.toString().slice(-2)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : !selectedPayslip ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyText}>No payslip data for {getMonthName(selectedMonth.month)} {selectedMonth.year}</Text>
        </View>
      ) : (
        <ScrollView style={styles.cardContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.payslipCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmpName}>{user?.full_name}</Text>
              <Text style={styles.cardMonth}>{getMonthName(selectedMonth.month)} {selectedMonth.year}</Text>
            </View>

            {/* Earnings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EARNINGS</Text>
              <View style={styles.row}><Text style={styles.rowLabel}>Basic Salary</Text><Text style={styles.rowVal}>{formatRupee(selectedPayslip.basic_salary)}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>HRA</Text><Text style={styles.rowVal}>{formatRupee(selectedPayslip.hra)}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Special Allowance</Text><Text style={styles.rowVal}>{formatRupee(selectedPayslip.special_allowance)}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Overtime</Text><Text style={styles.rowVal}>{formatRupee(selectedPayslip.overtime_amount)}</Text></View>
              <View style={styles.divider} />
              <View style={styles.row}><Text style={styles.grossLabel}>Gross Earnings</Text><Text style={styles.grossVal}>{formatRupee(selectedPayslip.gross_earnings)}</Text></View>
            </View>

            {/* Deductions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DEDUCTIONS</Text>
              <View style={styles.row}><Text style={styles.rowLabel}>PF</Text><Text style={styles.rowVal}>{formatRupee(selectedPayslip.pf_deduction)}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>PT</Text><Text style={styles.rowVal}>{formatRupee(selectedPayslip.pt_deduction)}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>ESIC</Text><Text style={styles.rowVal}>{formatRupee(selectedPayslip.esic_deduction)}</Text></View>
              <View style={styles.divider} />
              <View style={styles.row}><Text style={styles.grossLabel}>Total Deductions</Text><Text style={styles.grossVal}>{formatRupee(selectedPayslip.total_deductions)}</Text></View>
            </View>

            {/* Net Salary */}
            <View style={styles.netBox}>
              <Text style={styles.netLabel}>NET PAY</Text>
              <Text style={styles.netVal}>{formatRupee(selectedPayslip.net_salary)}</Text>
            </View>

            <View style={styles.attendanceBox}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.attText}>Present {selectedPayslip.days_present} / {selectedPayslip.total_working_days} working days</Text>
            </View>
          </View>

          <Button 
            title="Download PDF" 
            onPress={loadPdf} 
            loading={pdfLoading} 
            icon={<Ionicons name="download-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      )}

      {/* PDF Modal */}
      <Modal visible={showPdf} animationType="slide" onRequestClose={() => setShowPdf(false)}>
        <View style={styles.pdfContainer}>
          <View style={styles.pdfHeader}>
            <TouchableOpacity onPress={() => setShowPdf(false)} style={{ padding: 8 }}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: 'bold' }}>Payslip Viewer</Text>
            <View style={{ width: 44 }} />
          </View>
          
          {pdfUrl ? (
            <Pdf
              source={{ uri: pdfUrl, cache: true }}
              style={styles.pdf}
              trustAllCerts={false}
              renderActivityIndicator={(progress) => <ActivityIndicator size="large" color={Colors.primary} />}
              onError={(error) => {
                console.error(error);
                Alert.alert('Error', 'Failed to load PDF');
                setShowPdf(false);
              }}
            />
          ) : (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerTitle: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  monthScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  monthPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  monthPillSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  monthTextSelected: { color: Colors.white },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.6 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body, marginTop: 16 },
  cardContainer: { paddingHorizontal: 16 },
  payslipCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 24, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 16, marginBottom: 16, alignItems: 'center' },
  cardEmpName: { color: Colors.textPrimary, fontSize: FontSize.sectionTitle, fontWeight: 'bold', marginBottom: 4 },
  cardMonth: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: Colors.textPrimary, fontSize: 13 },
  rowVal: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  grossLabel: { color: Colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
  grossVal: { color: Colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
  netBox: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: Radius.button, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.success },
  netLabel: { color: Colors.success, fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  netVal: { color: Colors.success, fontSize: 32, fontWeight: '800' },
  attendanceBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  attText: { color: Colors.textMuted, fontSize: 12 },
  pdfContainer: { flex: 1, backgroundColor: '#000' },
  pdfHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: Colors.surface },
  pdf: { flex: 1, width: '100%' },
});
