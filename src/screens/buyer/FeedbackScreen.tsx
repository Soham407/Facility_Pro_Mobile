import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useBuyerOrders } from '../../hooks/useBuyerOrders';
import { Colors, FontSize, Radius, MIN_TOUCH_TARGET } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StarRating } from '../../components/shared/StarRating';

export function FeedbackScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const initialOrderId = route.params?.orderId;

  const { orders, submitFeedback } = useBuyerOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const pendingFeedbackOrders = orders?.filter(o => o.status === 'feedback_pending' || (o.status === 'completed' && !o.feedback_rating)) || [];

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    setRating(0);
    setComment('');
  };

  const selectedOrder = pendingFeedbackOrders.find(o => o.id === selectedOrderId) || orders?.find(o => o.id === selectedOrderId);

  const handleSubmit = async () => {
    if (!selectedOrder || rating === 0) return;
    setSubmitting(true);

    try {
      await submitFeedback({
        requestId: selectedOrder.id,
        rating,
        comment,
        currentStatus: selectedOrder.status,
      });
      
      setShowThankYou(true);
      setTimeout(() => {
        setShowThankYou(false);
        setSelectedOrderId(null);
        if (route.params?.orderId) {
          navigation.goBack();
        }
      }, 2000);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit feedback');
    }
    
    setSubmitting(false);
  };

  if (showThankYou) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={styles.thankYouText}>Thank you!</Text>
          <Text style={styles.thankYouSub}>Your feedback helps us improve.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!selectedOrderId || !selectedOrder) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <Text style={styles.title}>Pending Feedback</Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContent}>
          {pendingFeedbackOrders.length === 0 ? (
            <Text style={styles.emptyText}>No requests need feedback right now.</Text>
          ) : (
            pendingFeedbackOrders.map(item => (
              <Card key={item.id} style={styles.card} onPress={() => handleSelectOrder(item.id)}>
                <Text style={styles.reqNumber}>{item.request_number}</Text>
                <Text style={styles.serviceName}>{item.services?.service_name}</Text>
                <Text style={styles.tapText}>Provide Feedback →</Text>
              </Card>
            ))
          )}
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.detailContent}>
        {!route.params?.orderId && (
          <TouchableOpacity onPress={() => setSelectedOrderId(null)} style={{ marginBottom: 16 }}>
             <Text style={styles.backText}>← Back to list</Text>
          </TouchableOpacity>
        )}

        <View style={styles.headerBox}>
          <Text style={styles.reqNumberLarge}>{selectedOrder.request_number}</Text>
          <Text style={styles.serviceNameLarge}>{selectedOrder.services?.service_name}</Text>
        </View>

        <Card style={styles.feedbackCard}>
          <Text style={styles.question}>How was the service?</Text>
          
          <StarRating value={rating} onChange={setRating} />
          
          <Text style={styles.label}>Tell us more (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            maxLength={500}
            value={comment}
            onChangeText={setComment}
            placeholder="What went well? What could be better?"
            placeholderTextColor={Colors.border}
          />
          <Text style={styles.counter}>{comment.length}/500</Text>

          <Button 
            title="SUBMIT FEEDBACK" 
            onPress={handleSubmit} 
            disabled={rating === 0}
            loading={submitting}
            style={{ marginTop: 24 }} 
          />
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thankYouText: { fontSize: FontSize.screenTitle, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  thankYouSub: { fontSize: FontSize.body, color: Colors.textMuted },
  header: { paddingVertical: 16 },
  title: { fontSize: FontSize.screenTitle, fontWeight: 'bold', color: Colors.textPrimary },
  listContent: { paddingBottom: 24 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 24, fontStyle: 'italic' },
  card: { marginBottom: 12 },
  reqNumber: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: 'bold', marginBottom: 4 },
  serviceName: { color: Colors.textPrimary, fontSize: FontSize.cardTitle, fontWeight: 'bold', marginBottom: 8 },
  tapText: { color: Colors.primaryLight, fontSize: FontSize.caption, fontWeight: 'bold' },
  detailContent: { paddingTop: 16, paddingBottom: 40 },
  backText: { color: Colors.textMuted, fontSize: FontSize.body, fontWeight: 'bold' },
  headerBox: { marginBottom: 24, alignItems: 'center' },
  reqNumberLarge: { color: Colors.textMuted, fontWeight: 'bold', marginBottom: 8 },
  serviceNameLarge: { fontSize: FontSize.screenTitle, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center' },
  feedbackCard: { padding: 20 },
  question: { fontSize: FontSize.sectionTitle, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', marginBottom: 16 },
  label: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, paddingHorizontal: 16, height: MIN_TOUCH_TARGET, color: Colors.textPrimary },
  textArea: { height: 120, paddingTop: 12, textAlignVertical: 'top' },
  counter: { color: Colors.textMuted, fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
});
