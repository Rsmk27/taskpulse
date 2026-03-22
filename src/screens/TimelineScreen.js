import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import { getTasksForDate }  from '../services/storageService';
import { useSettings }      from '../context/SettingsContext';
import {
  getTodayStr, getYesterdayStr, formatDisplayTime, formatDisplayDate, combineDatetime,
} from '../utils/dateUtils';
import { colors, radius } from '../constants/theme';

const TYPE_COLOR = {
  briefing:        colors.briefing,
  day_before:      colors.warning,
  '1hr_warning':   colors.warning,
  '30min_warning': colors.warning,
  task_reminder:   colors.accent,
  repeat_reminder: colors.repeat,
};

export default function TimelineScreen() {
  const { settings } = useSettings();
  const [items, setItems] = useState([]);

  const loadData = useCallback(async () => {
    if (!settings) return;

    const todayTasks     = await getTasksForDate(getTodayStr());
    const yesterdayTasks = await getTasksForDate(getYesterdayStr());
    const timeline = [];

    if (settings.deadlineWarnings.dayBefore) {
      for (const t of yesterdayTasks.filter(t => t.type === 'deadline')) {
        timeline.push({
          time:     settings.deadlineWarnings.dayBeforeTime,
          type:     'day_before',
          task:     t,
          dayLabel: 'prev',
        });
      }
    }

    if (settings.briefingEnabled) {
      timeline.push({ time: settings.briefingTime, type: 'briefing', task: null });
    }

    for (const t of todayTasks) {
      timeline.push({ time: t.time, type: 'task_reminder', task: t });

      if (t.type === 'deadline') {
        const dl = combineDatetime(t.date, t.time);
        if (settings.deadlineWarnings.oneHour) {
          timeline.push({
            time: dl.subtract(60, 'minute').format('HH:mm'),
            type: '1hr_warning',
            task: t,
          });
        }
        if (settings.deadlineWarnings.thirtyMin) {
          timeline.push({
            time: dl.subtract(30, 'minute').format('HH:mm'),
            type: '30min_warning',
            task: t,
          });
        }
      }
    }

    timeline.sort((a, b) => a.time.localeCompare(b.time));
    setItems(timeline);
  }, [settings]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const nowMinutes = dayjs().hour() * 60 + dayjs().minute();
  const closestIdx = items.reduce((best, item, i) => {
    if (best === -1) return i;
    const [bH, bM] = items[best].time.split(':').map(Number);
    const [iH, iM] = item.time.split(':').map(Number);
    const prevDiff = Math.abs(bH * 60 + bM - nowMinutes);
    const currDiff = Math.abs(iH * 60 + iM - nowMinutes);
    return currDiff < prevDiff ? i : best;
  }, -1);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Timeline</Text>
        <Text style={styles.headerDate}>{formatDisplayDate(getTodayStr())}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {items.map((item, i) => {
          const [itemH, itemM] = item.time.split(':').map(Number);
          const isPast    = (itemH * 60 + itemM) < nowMinutes;
          const isCurrent = i === closestIdx;
          const dotColor  = TYPE_COLOR[item.type] || colors.accent;

          return (
            <View
              key={String(i)}
              style={[
                styles.row,
                isPast && styles.rowPast,
                isCurrent && styles.rowCurrent,
              ]}
            >
              {/* Time col */}
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{formatDisplayTime(item.time)}</Text>
                {item.dayLabel === 'prev' && <Text style={styles.prevLabel}>prev</Text>}
                {isCurrent && (
                  <View style={styles.nowPill}>
                    <Text style={styles.nowPillText}>NOW</Text>
                  </View>
                )}
              </View>

              {/* Dot col */}
              <View style={styles.dotCol}>
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                {i < items.length - 1 && <View style={styles.connector} />}
              </View>

              {/* Content col */}
              <View style={styles.contentCol}>
                <View style={[styles.typeBadge, { borderColor: dotColor + '44', backgroundColor: dotColor + '18' }]}>
                  <Text style={[styles.typeBadgeText, { color: dotColor }]}>
                    {item.type.replace(/_/g, ' ')}
                  </Text>
                </View>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.task ? item.task.title : 'Morning Briefing'}
                </Text>
                {item.task && (
                  <Text style={styles.itemSub}>
                    {item.task.type} task
                  </Text>
                )}
                {item.type === 'task_reminder' && settings?.repeatReminders?.enabled && (
                  <Text style={styles.repeatNote}>
                    🔁 Repeats every {settings.repeatReminders.interval} min if no action
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {items.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No timeline items yet</Text>
            <Text style={styles.emptySubText}>Add tasks to see your notification schedule</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
    padding:        18,
    paddingBottom:  12,
  },
  headerTitle: {
    fontSize:   20,
    fontWeight: '800',
    color:      colors.text,
  },
  headerDate: {
    fontSize:  12,
    color:     colors.textSub,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom:     40,
  },
  row: {
    flexDirection: 'row',
    minHeight:     52,
    paddingVertical: 4,
  },
  rowPast: {
    opacity: 0.4,
  },
  rowCurrent: {
    backgroundColor: 'rgba(251,146,60,0.06)',
    borderWidth:     1,
    borderColor:     'rgba(251,146,60,0.15)',
    borderRadius:    radius.sm,
    paddingHorizontal: 6,
  },
  timeCol: {
    width:      44,
    alignItems: 'flex-end',
    paddingRight: 6,
    paddingTop:   4,
  },
  timeText: {
    fontSize:   10,
    fontWeight: '700',
    color:      colors.textSub,
  },
  prevLabel: {
    fontSize: 8,
    color:    colors.textDim,
    marginTop: 2,
  },
  nowPill: {
    backgroundColor: colors.warning,
    borderRadius:    4,
    paddingHorizontal: 4,
    paddingVertical:   1,
    marginTop:       3,
  },
  nowPillText: {
    fontSize:   8,
    fontWeight: '700',
    color:      '#0d0d10',
  },
  dotCol: {
    width:      20,
    alignItems: 'center',
  },
  dot: {
    width:        9,
    height:       9,
    borderRadius: 5,
    marginTop:    6,
  },
  connector: {
    flex:            1,
    width:           1,
    backgroundColor: colors.border1,
    marginTop:       2,
  },
  contentCol: {
    flex:        1,
    paddingLeft: 8,
    paddingBottom: 8,
  },
  typeBadge: {
    alignSelf:         'flex-start',
    borderRadius:      5,
    borderWidth:       1,
    paddingHorizontal: 7,
    paddingVertical:   2,
    marginBottom:      3,
  },
  typeBadgeText: {
    fontSize:      9,
    fontWeight:    '700',
    textTransform: 'capitalize',
  },
  itemTitle: {
    fontSize:   12,
    fontWeight: '600',
    color:      colors.text,
  },
  itemSub: {
    fontSize:  10,
    color:     colors.textSub,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  repeatNote: {
    fontSize:  9,
    color:     colors.textDim,
    marginTop: 3,
  },
  empty: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     80,
  },
  emptyText: {
    fontSize:   14,
    color:      colors.textDim,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 12,
    color:    colors.textDim,
  },
});
