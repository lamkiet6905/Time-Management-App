import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../constants/theme';

interface EXPBarProps {
  current: number;
  max: number;
  level: number;
  showLabel?: boolean;
}

export default function EXPBar({ current, max, level, showLabel = false }: EXPBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(current / max, 1)) : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct, duration: 800, useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <Text style={styles.labelIcon}>⭐</Text>
          <Text style={styles.labelText}>EXP  •  Lv.{level}</Text>
        </View>
        <Text style={styles.valueText}>{current}/{max}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
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
  valueText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.rpg.exp },
  track: {
    height: 8, backgroundColor: Colors.rpg.expBg,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  fill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.rpg.exp,
    shadowColor: Colors.rpg.exp, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6,
  },
});
