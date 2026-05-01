import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../constants/theme';

interface OfflineBannerProps {
  unsyncedCount: number;
  onSync: () => void;
  isSyncing?: boolean;
}

export default function OfflineBanner({ unsyncedCount, onSync, isSyncing = false }: OfflineBannerProps) {
  if (unsyncedCount === 0) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.status.warning} />
      <Text style={styles.text}>
        {unsyncedCount} task chờ đồng bộ
      </Text>
      <TouchableOpacity onPress={onSync} disabled={isSyncing} style={styles.syncBtn}>
        {isSyncing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.syncBtnText}>Đồng bộ</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 152, 0, 0.3)',
    paddingVertical: 8, paddingHorizontal: Spacing.md,
  },
  text: { flex: 1, fontSize: FontSize.xs, color: Colors.status.warning, fontWeight: '600' },
  syncBtn: {
    backgroundColor: Colors.status.warning, borderRadius: 4,
    paddingVertical: 4, paddingHorizontal: 10, minWidth: 72, alignItems: 'center',
  },
  syncBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
});
