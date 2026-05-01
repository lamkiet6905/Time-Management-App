import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../constants/theme';

interface HPBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
}

export default function HPBar({ current, max, showLabel = false }: HPBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(current / max, 1)) : 0;
  const widthAnim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct, duration: 600, useNativeDriver: false,
    }).start();
  }, [pct]);

  const color = pct > 0.5 ? Colors.rpg.hp
    : pct > 0.25 ? '#FF8C00'
    : '#FF2D55';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <Text style={styles.labelIcon}>❤️</Text>
          <Text style={styles.labelText}>HP</Text>
        </View>
        <Text style={[styles.valueText, { color }]}>{current}/{max}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
        {/* HP glow segments */}
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={[styles.segment, { left: `${(i + 1) * 25}%` as any }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelIcon: { fontSize: 12 },
  labelText: { fontSize: FontSize.xs, color: Colors.text.secondary, fontWeight: '700' },
  valueText: { fontSize: FontSize.xs, fontWeight: '800' },
  track: {
    height: 8, backgroundColor: Colors.rpg.hpBg,
    borderRadius: BorderRadius.full, overflow: 'hidden', position: 'relative',
  },
  fill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    borderRadius: BorderRadius.full,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
  },
  segment: {
    position: 'absolute', top: 0, bottom: 0, width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
