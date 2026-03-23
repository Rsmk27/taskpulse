import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors } from '../constants/theme';

export default function BrandFooter() {
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
      <Text style={styles.text}>TaskPulse by RSMK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    marginBottom: 6,
    alignItems: 'center',
  },
  line: {
    width: 92,
    height: 1,
    backgroundColor: colors.border1,
    marginBottom: 8,
  },
  text: {
    color: colors.textDim,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
