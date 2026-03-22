import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../constants/theme';
import { formatDisplayTime } from '../utils/dateUtils';

const TYPE_COLORS = {
  once:     colors.accent,
  routine:  colors.routine,
  deadline: colors.deadline,
};

export default function TaskCard({ task, onCheckToggle }) {
  const accentColor = TYPE_COLORS[task.type] || colors.accent;
  const isDone = task.status === 'done';

  return (
    <TouchableOpacity
      style={[styles.card, isDone && styles.cardDone]}
      onPress={() => onCheckToggle && onCheckToggle(task)}
      activeOpacity={0.8}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
        {isDone && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.typePill, { backgroundColor: accentColor + '22', borderColor: accentColor + '44' }]}>
            <Text style={[styles.typePillText, { color: accentColor }]}>{task.type}</Text>
          </View>
          <Text style={styles.time}>{formatDisplayTime(task.time)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: colors.surface2,
    borderWidth:    1,
    borderColor:    colors.border1,
    borderRadius:   radius.md,
    marginBottom:   7,
    overflow:       'hidden',
  },
  cardDone: {
    opacity: 0.42,
  },
  accentBar: {
    width:  3,
    alignSelf: 'stretch',
  },
  checkbox: {
    width:        22,
    height:       22,
    borderRadius: 7,
    borderWidth:  1.5,
    borderColor:  colors.border2,
    backgroundColor: 'transparent',
    alignItems:   'center',
    justifyContent: 'center',
    marginLeft:   12,
    marginRight:  10,
  },
  checkboxDone: {
    backgroundColor: colors.done,
    borderColor:     colors.done,
  },
  checkmark: {
    color:      '#0d0d10',
    fontSize:   13,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    paddingVertical: 13,
    paddingRight:    14,
  },
  title: {
    fontSize:   13,
    fontWeight: '600',
    color:      colors.text,
    marginBottom: 4,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  typePill: {
    borderRadius:    5,
    borderWidth:     1,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  typePillText: {
    fontSize:   9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  time: {
    fontSize:   11,
    color:      colors.textDim,
    fontWeight: '600',
  },
});
