import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useCurrentEmployee } from '../../hooks/useCurrentEmployee';
import { Colors, FontSize, Radius, Spacing } from '../../lib/constants';

const DOC_TYPES = [
  { id: 'aadhar', label: 'Aadhaar Card' },
  { id: 'pan', label: 'PAN Card' },
  { id: 'voter_id', label: 'Voter ID' },
  { id: 'psara', label: 'PSARA Certificate', securityOnly: true },
  { id: 'police_verification', label: 'Police Verification', securityOnly: true }
];

export function DocumentsScreen() {
  const { data: currentEmployee } = useCurrentEmployee();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const queryClient = useQueryClient();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const isSecurityStaff = role?.role_name.includes('security') || (role?.role_name as string) === 'guard';

  const visibleDocs = DOC_TYPES.filter(d => !d.securityOnly || isSecurityStaff);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['employeeDocs', currentEmployee?.id],
    enabled: !!currentEmployee?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', currentEmployee!.id);
      return data || [];
    }
  });

  const uploadDoc = useMutation({
    mutationFn: async ({ docType, uri }: { docType: string, uri: string }) => {
      if (!currentEmployee) throw new Error('No employee context');

      const fileExt = 'jpg';
      const fileName = `${currentEmployee.id}/${docType}/${Date.now()}.${fileExt}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: `photo.${fileExt}`,
        type: `image/${fileExt}`
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('staff-compliance-docs')
        .upload(fileName, formData, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Check if doc exists to UPDATE or INSERT
      const existing = documents?.find(d => d.document_type === docType);
      
      if (existing) {
        const { error } = await supabase.from('employee_documents').update({
          document_url: uploadData.path,
          is_verified: false,
          uploaded_at: new Date().toISOString()
        }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('employee_documents').insert({
          employee_id: currentEmployee.id,
          document_type: docType,
          document_url: uploadData.path,
          is_verified: false
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeDocs'] });
      Alert.alert('Success', 'Document uploaded successfully');
      setUploadingDocType(null);
    },
    onError: (err: any) => {
      Alert.alert('Upload failed', err.message);
      setUploadingDocType(null);
    }
  });

  const handleUploadClick = async (docType: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingDocType(docType);
        
        // Compress
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        await uploadDoc.mutateAsync({ docType, uri: manipResult.uri });
      }
    } catch (err: any) {
      console.error(err);
      setUploadingDocType(null);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const showPreview = async (path: string) => {
    try {
      const { data } = await supabase.storage
        .from('staff-compliance-docs')
        .createSignedUrl(path, 60 * 60);

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not load preview');
    }
  };

  const renderCard = ({ item: docDef }: { item: typeof visibleDocs[0] }) => {
    const doc = documents?.find(d => d.document_type === docDef.id);
    const isUploading = uploadingDocType === docDef.id;

    let statusText = 'Not Uploaded';
    let statusColor: string = Colors.border;

    if (doc) {
      if (doc.is_verified) { statusText = 'Verified'; statusColor = Colors.success; }
      else { statusText = 'Uploaded (Pending)'; statusColor = Colors.accent; }
    }

    // Expiry check
    let expiryWarning = null;
    if (doc?.expiry_date) {
      const today = new Date();
      const expiry = new Date(doc.expiry_date);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        expiryWarning = <Text style={styles.expiredAlert}>EXPIRED — renew immediately</Text>;
      } else if (diffDays <= 30) {
        expiryWarning = <Text style={styles.expiresSoonAlert}>Expires in {diffDays} days</Text>;
      }
    }

    return (
      <View style={styles.docCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.docTitle}>{docDef.label}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor === Colors.border ? Colors.textMuted : statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {expiryWarning && <View style={styles.expiryBox}>{expiryWarning}</View>}

        <View style={styles.cardActions}>
          {doc && (
            <TouchableOpacity style={styles.viewBtn} onPress={() => showPreview(doc.document_url)}>
              <Ionicons name="eye-outline" size={16} color={Colors.primary} />
              <Text style={styles.viewBtnText}>VIEW</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.uploadBtn, doc && styles.uploadBtnSmall]} 
            onPress={() => handleUploadClick(docDef.id)}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name={doc ? "refresh-outline" : "push-outline"} size={16} color={Colors.white} />
                <Text style={styles.uploadBtnText}>{doc ? 'REPLACE' : 'UPLOAD DOCUMENT'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Document Vault</Text>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visibleDocs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderCard}
        />
      )}

      {/* Image Preview Modal */}
      <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
        <View style={styles.previewContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setPreviewUrl(null)}>
            <Ionicons name="close" size={32} color={Colors.white} />
          </TouchableOpacity>
          {previewUrl && (
            <Image source={{ uri: previewUrl }} style={styles.previewImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerTitle: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  docCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  docTitle: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  expiryBox: { marginBottom: 16 },
  expiredAlert: { color: Colors.danger, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  expiresSoonAlert: { color: Colors.accent, fontSize: 12, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', gap: 12 },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 10 },
  viewBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 12 },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 10 },
  uploadBtnSmall: { flex: 1 }, // takes equal space as viewBtn
  uploadBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
  previewContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 8 },
  previewImg: { width: '100%', height: '80%' },
});
