import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors } from '../constants/theme';

export default function BrandLogo({ compact = false }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <Text style={styles.markText}>TP</Text>
      </View>
      <View>
        <Text style={[styles.title, compact && styles.titleCompact]}>TaskPulse</Text>
        <Text style={styles.sub}>by RSMK</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  markCompact: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  markText: {
    color: '#0d0d10',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 18,
  },
  sub: {
    marginTop: 2,
    color: colors.textSub,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
