import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, FontSize } from '../../lib/constants';

interface PhotoCaptureProps {
  bucket: string;
  pathPrefix: string;
  onUploadComplete: (url: string) => void;
}

type PhotoState = 'idle' | 'camera' | 'preview' | 'uploading' | 'error' | 'success';

export function PhotoCapture({ bucket, pathPrefix, onUploadComplete }: PhotoCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<PhotoState>('idle');
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleStart = async () => {
    if (!permission?.granted) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }
    }
    setState('camera');
  };

  const takePhoto = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.7 });
        if (photo?.uri) {
          setPhotoUri(photo.uri);
          setState('preview');
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const uploadPhoto = async () => {
    if (!photoUri) return;
    setState('uploading');

    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        photoUri,
        [{ resize: { width: 1080, height: 1080 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );

      const filename = `photo_${Date.now()}.jpg`;
      const filePath = `${pathPrefix.replace(/\/$/, '')}/${filename}`;

      const formData = new FormData() as any;
      formData.append('file', {
        uri: manipResult.uri,
        name: filename,
        type: 'image/jpeg',
      });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, formData, { contentType: 'image/jpeg' });

      if (error) throw error;

      // Extract public URL or just pass the path
      // If bucket is public, we can get public URL:
      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      const finalUrl = publicUrlData.publicUrl || data.path;

      setUploadedUrl(finalUrl);
      setState('success');
      onUploadComplete(finalUrl);
    } catch (e: any) {
      console.error(e);
      setState('error');
    }
  };

  if (state === 'camera') {
    return (
      <Modal visible transparent animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing="back" ref={ref => setCameraRef(ref)}>
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.captureBtnOuter} onPress={takePhoto}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setState('idle')}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      {state === 'idle' && (
        <TouchableOpacity style={styles.box} onPress={handleStart}>
          <Ionicons name="camera" size={32} color={Colors.textMuted} />
          <Text style={styles.hintText}>Tap to capture</Text>
        </TouchableOpacity>
      )}

      {state === 'preview' && photoUri && (
        <View style={styles.previewBox}>
          <Image source={{ uri: photoUri }} style={styles.image} />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setState('camera')}>
              <Text style={styles.actionText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={uploadPhoto}>
              <Text style={styles.primaryBtnText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {state === 'uploading' && photoUri && (
        <View style={styles.previewBox}>
          <Image source={{ uri: photoUri }} style={styles.image} blurRadius={10} />
          <View style={styles.uploadOverlay}>
            <Text style={styles.uploadText}>Uploading...</Text>
            <View style={styles.progressBarOuter}>
              {/* Fake indeterminate progress bar since native upload progress with fetch is complex */}
              <View style={[styles.progressBarInner, { width: '50%' }]} />
            </View>
          </View>
        </View>
      )}

      {state === 'error' && photoUri && (
        <View style={styles.previewBox}>
          <Image source={{ uri: photoUri }} style={[styles.image, { opacity: 0.5 }]} />
          <View style={styles.uploadOverlay}>
            <Ionicons name="alert-circle" size={32} color={Colors.danger} />
            <Text style={styles.errorText}>Upload Failed</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={uploadPhoto}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {state === 'success' && uploadedUrl && (
        <View style={styles.previewBox}>
          <Image source={{ uri: photoUri || uploadedUrl }} style={styles.image} />
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  box: {
    backgroundColor: Colors.surface,
    height: 120,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    color: Colors.textMuted,
    marginTop: 8,
    fontSize: FontSize.caption,
  },
  previewBox: {
    height: 200,
    borderRadius: Radius.card,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.button,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  actionText: {
    color: Colors.white,
    fontWeight: '600',
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  uploadText: {
    color: Colors.white,
    marginBottom: 16,
    fontWeight: '600',
  },
  progressBarOuter: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: Colors.primaryLight,
  },
  errorText: {
    color: Colors.danger,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.button,
  },
  retryText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  successBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  cancelBtn: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
