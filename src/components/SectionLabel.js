import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function SectionLabel({ label, rightBadge }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {rightBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{rightBadge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   8,
    marginTop:      6,
  },
  label: {
    fontSize:      10,
    letterSpacing: 1.2,
    color:         colors.textDim,
    fontWeight:    '700',
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius:    6,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  badgeText: {
    fontSize:   8,
    fontWeight: '800',
    color:      '#0d0d10',
  },
});
