import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// ImagePicker loaded lazily to avoid crash when native module not available
import { useAuthStore } from '../stores/authStore';
import { Colors, Spacing, BorderRadius, FontSize, DoodleStyle } from '../constants/theme';
import api from '../services/api';

export default function AvatarSetupScreen() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    let ImagePicker;
    try {
      ImagePicker = require('expo-image-picker');
    } catch {
      Alert.alert('Lỗi', 'Tính năng chọn ảnh chưa được hỗ trợ trên bản build này. Hãy build lại app.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cấp quyền', 'Bạn cần cho phép truy cập thư viện ảnh để tiếp tục!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Mở camera chụp ảnh
  const takePhoto = async () => {
    let ImagePicker;
    try {
      ImagePicker = require('expo-image-picker');
    } catch {
      Alert.alert('Lỗi', 'Tính năng chụp ảnh chưa được hỗ trợ trên bản build này. Hãy build lại app.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cấp quyền', 'Bạn cần cho phép sử dụng Camera để tiếp tục!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Upload lên Backend
  const handleGenerate = async () => {
    if (!imageUri) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // @ts-ignore (React Native fetch FormData hỗ trợ format này)
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      });

      const response = await api.post('/images/generate-sprites', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        await refreshUser(); // Lấy lại profile mới nhất (chứa sprite_status)
        
        // Polling loop
        let isPolling = true;
        while (isPolling) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          try {
            const statusRes = await api.get('/images/status');
            const newStatus = statusRes.data?.data?.sprite_status;
            
            if (newStatus === 'ready' || newStatus === 'failed') {
              isPolling = false;
              await refreshUser();
              setIsProcessing(false);
              if (newStatus === 'ready') {
                router.replace('/(tabs)');
              } else {
                Alert.alert('Lỗi', 'Quá trình vẽ bằng AI thất bại!');
              }
            }
          } catch (e) {
            console.log('Lỗi check status:', e);
          }
        }
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể tạo Avatar');
      }
    } catch (err: any) {
      console.log('Error upload:', err);
      Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra khi tạo Avatar AI');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.brand.violet} style={{ transform: [{ scale: 1.5 }] }} />
          <Text style={styles.loadingTitle}>AI Đang Vẽ Avatar...</Text>
          <Text style={styles.loadingDesc}>Quá trình này có thể mất 5-10 giây. Hãy thư giãn nhé!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Tạo Avatar Sinh Tồn!</Text>
        <Text style={styles.subtitle}>Chụp ảnh Selfie để AI vẽ cho bạn một Avatar đậm chất Doodle!</Text>

        <View style={styles.previewBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={48} color={Colors.text.muted} />
              <Text style={styles.placeholderText}>Chưa có ảnh</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color={Colors.brand.violet} />
            <Text style={[styles.btnText, { color: Colors.brand.violet }]}>Chụp Ảnh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={pickImage}>
            <Ionicons name="image" size={24} color={Colors.brand.emerald} />
            <Text style={[styles.btnText, { color: Colors.brand.emerald }]}>Thư Viện</Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleGenerate}>
            <Ionicons name="color-wand" size={24} color="#FFF" />
            <Text style={[styles.btnText, { color: '#FFF' }]}>Tạo Avatar Bằng AI</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Bỏ qua, tôi sẽ tạo sau</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text.primary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing.xl, fontWeight: 'bold' },
  
  previewBox: {
    width: 220, height: 220,
    backgroundColor: Colors.bg.secondary,
    borderWidth: DoodleStyle.borderWidth, borderColor: DoodleStyle.borderColor,
    borderRadius: DoodleStyle.borderRadius,
    overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
    ...DoodleStyle,
  },
  placeholder: { alignItems: 'center' },
  placeholderText: { color: Colors.text.muted, marginTop: 8, fontWeight: 'bold' },
  image: { width: '100%', height: '100%' },

  actionRow: { flexDirection: 'row', gap: Spacing.md, width: '100%', marginBottom: Spacing.lg },
  btn: {
    flex: 1, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: DoodleStyle.borderRadius,
    borderWidth: DoodleStyle.borderWidth, borderColor: DoodleStyle.borderColor,
    ...DoodleStyle,
  },
  btnOutline: { backgroundColor: '#FFF' },
  btnPrimary: { backgroundColor: Colors.brand.violet, width: '100%', marginBottom: Spacing.lg },
  btnText: { fontSize: FontSize.lg, fontWeight: '900' },

  skipBtn: { padding: Spacing.md },
  skipText: { color: Colors.text.muted, fontWeight: 'bold', textDecorationLine: 'underline' },

  loadingBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xl, backgroundColor: Colors.bg.primary,
  },
  loadingTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text.primary, marginTop: Spacing.xl, marginBottom: 8 },
  loadingDesc: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: 'center', fontWeight: 'bold' },
});
