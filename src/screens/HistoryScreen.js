import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import { getTaskHistory, getDaySummary } from '../services/storageService';
import { getTodayStr, formatDisplayDate, isToday, isYesterday, formatDisplayTime } from '../utils/dateUtils';
import SectionLabel from '../components/SectionLabel';
import BrandLogo from '../components/BrandLogo';
import BrandFooter from '../components/BrandFooter';
import { colors, radius } from '../constants/theme';

const STATUS_COLOR = {
  done:    colors.done,
  snoozed: colors.snooze,
  skipped: colors.skip,
  pending: colors.textDim,
};

const STATUS_LABEL = {
  done:    'Done',
  snoozed: 'Snoozed',
  skipped: 'Missed',
  pending: 'Pending',
};

export default function HistoryScreen() {
  const [history,      setHistory]      = useState([]);
  const [todaySummary, setTodaySummary] = useState({ total: 0, done: 0, snoozed: 0, skipped: 0, pending: 0 });

  const loadData = useCallback(async () => {
    const h   = await getTaskHistory(7);
    const sum = await getDaySummary(getTodayStr());
    setHistory(h);
    setTodaySummary(sum);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Group by date
  const groups = history.reduce((acc, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const pct = todaySummary.total > 0
    ? Math.round((todaySummary.done / todaySummary.total) * 100)
    : 0;

  const emoji = pct >= 80 ? '🎯' : pct >= 50 ? '👍' : '💪';

  const dateLabel = (dateStr) => {
    if (isToday(dateStr))     return 'Today';
    if (isYesterday(dateStr)) return 'Yesterday';
    return formatDisplayDate(dateStr);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <BrandLogo compact />

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>{emoji}</Text>
          <Text style={styles.summaryTitle}>
            You completed {todaySummary.done} out of {todaySummary.total} tasks today
          </Text>
          <Text style={styles.summarySub}>{pct}% completion rate</Text>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.done }]}>{todaySummary.done}</Text>
              <Text style={styles.statLabel}>DONE</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.snooze }]}>{todaySummary.snoozed}</Text>
              <Text style={styles.statLabel}>SNOOZED</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.skip }]}>{todaySummary.skipped}</Text>
              <Text style={styles.statLabel}>MISSED</Text>
            </View>
          </View>
        </View>

        {/* Task log */}
        {sortedDates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No task history yet</Text>
          </View>
        ) : (
          sortedDates.map(dateStr => (
            <View key={dateStr}>
              <SectionLabel label={dateLabel(dateStr)} />
              {groups[dateStr].map(task => {
                const dotColor    = STATUS_COLOR[task.status] || colors.textDim;
                const statusLabel = STATUS_LABEL[task.status] || 'Pending';
                return (
                  <View key={task.id} style={styles.taskRow}>
                    <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                      <Text style={styles.taskTime}>{formatDisplayTime(task.time)}</Text>
                    </View>
                    <View style={[styles.statusPill, { borderColor: dotColor + '44', backgroundColor: dotColor + '18' }]}>
                      <Text style={[styles.statusPillText, { color: dotColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}

        <BrandFooter />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.bg,
  },
  content: {
    padding:       16,
    paddingBottom: 60,
  },
  summaryCard: {
    backgroundColor: 'rgba(200,241,53,0.06)',
    borderWidth:     1,
    borderColor:     'rgba(200,241,53,0.12)',
    borderRadius:    radius.md,
    padding:         18,
    marginBottom:    20,
  },
  summaryEmoji: {
    fontSize:     28,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize:   16,
    fontWeight: '800',
    color:      colors.text,
    marginBottom: 4,
  },
  summarySub: {
    fontSize:     11,
    color:        colors.textSub,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap:           10,
  },
  statBox: {
    flex:           1,
    backgroundColor: colors.surface1,
    borderWidth:    1,
    borderColor:    colors.border1,
    borderRadius:   10,
    padding:        10,
    alignItems:     'center',
  },
  statNum: {
    fontSize:   20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize:      9,
    textTransform: 'uppercase',
    color:         colors.textDim,
    marginTop:     2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border1,
  },
  statusDot: {
    width:        7,
    height:       7,
    borderRadius: 3.5,
    marginRight:  10,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize:   12,
    fontWeight: '600',
    color:      colors.text,
  },
  taskTime: {
    fontSize:  10,
    color:     colors.textSub,
    marginTop: 1,
  },
  statusPill: {
    borderRadius:      5,
    borderWidth:       1,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  statusPillText: {
    fontSize:   9,
    fontWeight: '700',
  },
  empty: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     80,
  },
  emptyText: {
    fontSize: 14,
    color:    colors.textDim,
  },
});
