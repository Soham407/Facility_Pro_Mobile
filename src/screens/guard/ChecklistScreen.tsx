import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';

import { useAuthStore } from '../../stores/authStore';
import { useGuardData } from '../../hooks/useGuardData';
import { useNetworkStore } from '../../stores/networkStore';
import { Colors, FontSize, Radius } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type ChecklistItem = {
  id: string;
  checklist_id: string;
  task_name: string;
  category: string;
  priority: number;
  requires_photo: boolean;
  requires_signature: boolean;
};

type ItemResponse = {
  completed: boolean;
  completed_at: string;
  photo_url?: string;
};

export function ChecklistScreen() {
  const { user } = useAuthStore();
  const { data: guardData } = useGuardData();
  const isOnline = useNetworkStore(s => s.isOnline);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  
  // Camera
  const [cameraPerm, requestCameraPerm] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [activePhotoItem, setActivePhotoItem] = useState<string | null>(null);
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  useEffect(() => {
    fetchChecklist();
  }, [guardData?.currentShift?.id]);

  const fetchChecklist = async () => {
    if (!guardData?.currentShift?.id) return;
    setIsLoading(true);
    try {
      // 1. Fetch items via RPC
      const { data: itemData, error: itemErr } = await supabase.rpc('get_shift_checklist_items', {
        p_shift_id: guardData.currentShift.id
      });
      if (!itemErr && itemData) {
        setItems(itemData);
      }

      // 2. Fetch today's responses
      const today = new Date().toISOString().split('T')[0];
      const { data: respData } = await supabase
        .from('checklist_responses')
        .select('*')
        .eq('employee_id', user?.employee_id)
        .eq('response_date', today)
        .limit(1)
        .maybeSingle();

      if (respData) {
        setResponseId(respData.id);
        const savedResponses = typeof respData.responses === 'string' ? JSON.parse(respData.responses) : respData.responses;
        if (savedResponses) {
           const mapped: Record<string, ItemResponse> = {};
           savedResponses.forEach((r: any) => {
              if (r.item_id) mapped[r.item_id] = r;
           });
           setResponses(mapped);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const completedCount = Object.values(responses).filter(r => r.completed).length;
  const totalCount = items.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllComplete = totalCount > 0 && completedCount === totalCount;

  const handleTaskPress = (id: string) => {
    setExpandedItemId(prev => prev === id ? null : id);
  };

  const takePhoto = async () => {
    if (cameraRef && !isProcessingPhoto) {
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.75 });
        setTempPhotoUri(photo?.uri || null);
        setShowCamera(false);
      } catch (e) { console.error(e); }
    }
  };

  const markComplete = async (item: ChecklistItem) => {
    if (item.requires_photo && !tempPhotoUri && !responses[item.id]?.photo_url) {
       Alert.alert('Photo Required', 'Please take a photo to complete this task.');
       return;
    }

    let photoPath = responses[item.id]?.photo_url;
    
    if (tempPhotoUri) {
       if (!isOnline) {
           Alert.alert('Offline', 'Photo uploads require an internet connection.');
       } else {
         setIsProcessingPhoto(true);
         try {
           const manip = await ImageManipulator.manipulateAsync(tempPhotoUri, [{resize:{width:1080,height:1080}}], {compress:0.75, format:ImageManipulator.SaveFormat.JPEG});
           const dateStr = new Date().toISOString().split('T')[0];
           const path = `${user?.employee_id}/${dateStr}/${Date.now()}.jpg`;
           
           const fd = new FormData() as any;
           fd.append('file', {uri: manip.uri, name: 'evidence.jpg', type:'image/jpeg'});
           
           const { data: uploadData } = await supabase.storage.from('checklist-evidence').upload(path, fd, {contentType:'image/jpeg'});
           if (uploadData) photoPath = uploadData.path;
         } catch (e) {
            console.error(e);
            Alert.alert('Upload Failed', 'Failed to save photo.');
            setIsProcessingPhoto(false);
            return;
         }
         setIsProcessingPhoto(false);
       }
    }

    const newResponse: ItemResponse & { item_id: string } = {
       item_id: item.id,
       completed: true,
       completed_at: new Date().toISOString(),
       photo_url: photoPath,
    };

    const newResponses = { ...responses, [item.id]: newResponse };
    setResponses(newResponses);
    setExpandedItemId(null);
    setTempPhotoUri(null);
    setActivePhotoItem(null);

    // Save progressively
    saveResponses(newResponses, Object.keys(newResponses).length === totalCount, item.checklist_id);
  };

  const saveResponses = async (updatedResponses: Record<string, any>, complete: boolean, checklistId: string) => {
    const arr = Object.values(updatedResponses);
    const today = new Date().toISOString().split('T')[0];
    
    const payload = {
      checklist_id: checklistId,
      employee_id: user?.employee_id,
      response_date: today,
      responses: arr,
      is_complete: complete,
      submitted_at: complete ? new Date().toISOString() : null,
    };

    try {
      let currentServerId = responseId;
      if (isOnline) {
         // Upsert based on unique constraint (checklist_id, employee_id, response_date)
         // Supabase allows upsert if you define onConflict.
         // Let's assume we fetch ID first or simply update if we have ID.
         if (currentServerId) {
            await supabase.from('checklist_responses').update(payload).eq('id', currentServerId);
         } else {
            const { data } = await supabase.from('checklist_responses').insert(payload).select('id').single();
            if (data?.id) {
               currentServerId = data.id;
               setResponseId(data.id);
            }
         }
      }


      
      if (complete) Alert.alert('Checklist Complete', 'All tasks finished.');
    } catch (e) {
      console.error(e);
    }
  };

  const renderPriorityBorder = (prio: number) => {
    if (prio === 1) return Colors.danger;
    if (prio === 2) return Colors.accent;
    return Colors.border;
  };

  if (showCamera) {
     return (
        <View style={{flex:1, backgroundColor:'black'}}>
           <CameraView style={{flex:1}} facing="back" ref={r => setCameraRef(r)}>
              <View style={styles.cameraOverlay}>
                 <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                    <View style={styles.captureInner}/>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => { setShowCamera(false); setTempPhotoUri(null); setActivePhotoItem(null);}} style={{marginTop:24}}>
                    <Text style={{color:'white', fontWeight:'800'}}>Close</Text>
                 </TouchableOpacity>
              </View>
           </CameraView>
        </View>
     );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Checklist</Text>
        <Text style={styles.progText}>{completedCount} of {totalCount} complete ({percent}%)</Text>
        <View style={styles.progBarBg}>
          <View style={[styles.progBarFill, { width: `${percent}%`, backgroundColor: isAllComplete ? Colors.success : Colors.primary }]} />
        </View>
      </View>

      {isLoading ? (
         <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }}/>
      ) : items.length === 0 ? (
         <Text style={styles.emptyMsg}>No checklist assigned to your current shift.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const isCompleted = responses[item.id]?.completed;
            const isExpanded = expandedItemId === item.id;
            
            return (
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleTaskPress(item.id)}>
                <Card style={[styles.itemCard, { borderLeftColor: renderPriorityBorder(item.priority), borderLeftWidth: 4 }]}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemTitle, isCompleted && styles.itemTitleDone]}>{item.task_name}</Text>
                      <View style={styles.badgeRow}>
                        <View style={styles.catBadge}><Text style={styles.catBadgeText}>{item.category}</Text></View>
                        {item.requires_photo && <Ionicons name="camera" size={16} color={Colors.textMuted} style={{marginLeft:8}}/>}
                        {item.requires_signature && <Ionicons name="pencil" size={16} color={Colors.textMuted} style={{marginLeft:8}}/>}
                      </View>
                    </View>
                    <Ionicons name={isCompleted ? "checkmark-circle" : "ellipse-outline"} size={28} color={isCompleted ? Colors.success : Colors.border} />
                  </View>

                  {isExpanded && !isCompleted && (
                     <View style={styles.expandArea}>
                        {item.requires_photo && !tempPhotoUri && (
                           <Button title="Take Photo Evidence" variant="secondary" icon={<Ionicons name="camera" color="white" size={20}/>} onPress={async () => {
                              const p = cameraPerm?.granted ? cameraPerm : await requestCameraPerm();
                              if (p?.granted) { setActivePhotoItem(item.id); setShowCamera(true); }
                           }} style={{ marginBottom: 16 }} />
                        )}
                        {tempPhotoUri && activePhotoItem === item.id && (
                           <View style={styles.tempPhotoBox}>
                              <Image source={{ uri: tempPhotoUri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                              <TouchableOpacity onPress={() => setTempPhotoUri(null)}><Text style={{color:Colors.danger, marginLeft:16}}>Discard</Text></TouchableOpacity>
                           </View>
                        )}
                        
                        <Button 
                          title="Mark Complete" 
                          onPress={() => markComplete(item)}
                          disabled={isProcessingPhoto || (item.requires_photo && !tempPhotoUri)}
                          loading={isProcessingPhoto}
                          style={{ backgroundColor: isProcessingPhoto ? Colors.border : Colors.success, borderColor: isProcessingPhoto ? Colors.border : Colors.success }}
                        />
                     </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 24, paddingVertical: 16 },
  title: { fontSize: FontSize.screenTitle, fontWeight: '700', color: Colors.textPrimary },
  progText: { color: Colors.textMuted, fontSize: FontSize.body, marginVertical: 8 },
  progBarBg: { height: 8, backgroundColor: Colors.surface, borderRadius: 4, overflow: 'hidden' },
  progBarFill: { height: '100%', borderRadius: 4 },
  emptyMsg: { color: Colors.textMuted, textAlign: 'center', marginTop: 40 },
  itemCard: { marginBottom: 12, paddingVertical: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1, paddingRight: 16 },
  itemTitle: { fontSize: FontSize.sectionTitle, color: Colors.textPrimary, fontWeight: '600' },
  itemTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  catBadge: { backgroundColor: Colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  catBadgeText: { color: Colors.textPrimary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  expandArea: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  cameraOverlay: {flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end', alignItems:'center', paddingBottom:60},
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
  tempPhotoBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: Colors.surface, padding: 8, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border }
});
