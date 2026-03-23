import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import dayjs from 'dayjs';

import {
  getTasksForDate, getDaySummary, saveTask, updateTaskStatus, getNotifLog,
} from '../services/storageService';
import {
  cancelAllTaskNotifications, scheduleTaskReminder,
} from '../services/notificationService';
import {
  getTodayStr, getYesterdayStr, getGreeting, formatDisplayDate,
  minutesUntil, isToday,
} from '../utils/dateUtils';
import TaskCard     from '../components/TaskCard';
import ProgressRing from '../components/ProgressRing';
import NotifBanner  from '../components/NotifBanner';
import SectionLabel from '../components/SectionLabel';
import BrandLogo    from '../components/BrandLogo';
import BrandFooter  from '../components/BrandFooter';
import { colors, radius } from '../constants/theme';

function sortTasks(tasks) {
  const order = { deadline: 0, routine: 1, once: 2 };
  return [...tasks].sort((a, b) => {
    const typeDiff = (order[a.type] || 2) - (order[b.type] || 2);
    if (typeDiff !== 0) return typeDiff;
    return a.time.localeCompare(b.time);
  });
}

export default function HomeScreen({ navigation }) {
  const [todayTasks,      setTodayTasks]      = useState([]);
  const [missedYesterday, setMissedYesterday] = useState([]);
  const [summary,         setSummary]         = useState({ total: 0, done: 0, pending: 0 });
  const [notifLog,        setNotifLog]        = useState([]);

  const loadData = useCallback(async () => {
    const today     = await getTasksForDate(getTodayStr());
    const yesterday = await getTasksForDate(getYesterdayStr());
    const missed    = yesterday.filter(t => t.status === 'pending' || t.status === 'snoozed');
    const sum       = await getDaySummary(getTodayStr());
    const log       = await getNotifLog();

    setTodayTasks(sortTasks(today));
    setMissedYesterday(missed);
    setSummary(sum);
    setNotifLog(log);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleCheckToggle = async (task) => {
    await updateTaskStatus(task.id, 'done');
    await cancelAllTaskNotifications(task.id);
    if (task.type === 'routine') {
      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
      const newTask = {
        ...task,
        id:          Crypto.randomUUID(),
        date:        tomorrow,
        status:      'pending',
        repeatCount: 0,
        notifIds:    [],
      };
      await saveTask(newTask);
      await scheduleTaskReminder(newTask);
    }
    loadData();
  };

  const handleRetryMissed = async (task) => {
    const newTask = {
      ...task,
      id:          Crypto.randomUUID(),
      date:        getTodayStr(),
      status:      'pending',
      repeatCount: 0,
      notifIds:    [],
    };
    await saveTask(newTask);
    await scheduleTaskReminder(newTask);
    loadData();
  };

  const today = dayjs();
  const dateLabel = today.format('dddd, MMM D');
  const sortedDate = dateLabel.split(', ');

  const focusTasks = todayTasks.filter(t => t.status !== 'done').slice(0, 3);

  const todayBriefing = notifLog.find(e =>
    e.type === 'briefing' && isToday(dayjs(e.firedAt).format('YYYY-MM-DD'))
  );

  const urgentDeadline = todayTasks.find(t =>
    t.type === 'deadline' && t.status === 'pending' && minutesUntil(t.date, t.time) <= 60 && minutesUntil(t.date, t.time) > 0
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Branding + Greeting */}
        <BrandLogo />
        <Text style={styles.greetingSub}>{getGreeting()}, RSMK</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateDay}>{sortedDate[0]}, </Text>
          <Text style={styles.dateAccent}>{sortedDate[1]}</Text>
        </View>

        {/* Progress ring */}
        <View style={styles.progressRow}>
          <ProgressRing done={summary.done} total={summary.total} size={72} />
          <View style={styles.progressText}>
            <Text style={styles.progressMain}>{summary.done} done · {summary.pending} remaining</Text>
          </View>
        </View>

        {/* Banners */}
        {todayBriefing && (
          <NotifBanner
            type="briefing"
            title="Morning Briefing"
            subtitle={`${summary.total} tasks today`}
          />
        )}
        {urgentDeadline && (
          <NotifBanner
            type="warning"
            title="Deadline soon!"
            subtitle={`"${urgentDeadline.title}" is due in ${minutesUntil(urgentDeadline.date, urgentDeadline.time)} min`}
            urgent
          />
        )}

        {/* Focus tasks */}
        <SectionLabel label="Focus Tasks" rightBadge="TOP 3" />
        {focusTasks.map(t => (
          <TaskCard key={t.id} task={t} onCheckToggle={handleCheckToggle} />
        ))}

        <View style={styles.divider} />

        {/* All tasks */}
        <SectionLabel label="All Tasks" />
        {todayTasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No tasks today</Text>
            <Text style={styles.emptySub}>Tap + to add your first task</Text>
          </View>
        ) : (
          todayTasks.map(t => (
            <TaskCard key={t.id} task={t} onCheckToggle={handleCheckToggle} />
          ))
        )}

        {/* Missed yesterday */}
        {missedYesterday.length > 0 && (
          <>
            <View style={styles.divider} />
            <SectionLabel label="Missed Yesterday" />
            {missedYesterday.map(t => (
              <View key={t.id} style={styles.missedRow}>
                <Text style={styles.missedTitle} numberOfLines={1}>{t.title}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetryMissed(t)}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        <BrandFooter />

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTask')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  greetingSub: {
    fontSize:      11,
    textTransform: 'uppercase',
    color:         colors.textSub,
    letterSpacing: 0.8,
    marginBottom:  4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    marginBottom:  20,
  },
  dateDay: {
    fontSize:   24,
    fontWeight: '800',
    color:      colors.text,
  },
  dateAccent: {
    fontSize:   24,
    fontWeight: '800',
    color:      colors.accent,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  18,
    gap:           16,
  },
  progressText: {
    flex: 1,
  },
  progressMain: {
    fontSize:   13,
    color:      colors.textSub,
    fontWeight: '600',
  },
  divider: {
    height:          1,
    backgroundColor: colors.border1,
    marginVertical:  14,
  },
  missedRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: colors.surface2,
    borderWidth:     1,
    borderColor:     colors.border1,
    borderRadius:    radius.md,
    padding:         13,
    marginBottom:    7,
  },
  missedTitle: {
    flex:       1,
    fontSize:   13,
    color:      colors.skip,
    opacity:    0.85,
    fontWeight: '600',
    marginRight: 10,
  },
  retryBtn: {
    backgroundColor: colors.accent + '22',
    borderWidth:     1,
    borderColor:     colors.accent + '55',
    borderRadius:    8,
    paddingHorizontal: 12,
    paddingVertical:   5,
  },
  retryText: {
    fontSize:   11,
    fontWeight: '700',
    color:      colors.accent,
  },
  empty: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize:     36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize:   16,
    fontWeight: '700',
    color:      colors.textSub,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color:    colors.textDim,
  },
  fab: {
    position:        'absolute',
    bottom:          88,
    right:           18,
    width:           50,
    height:          50,
    borderRadius:    15,
    backgroundColor: colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  fabIcon: {
    fontSize:   24,
    color:      '#0d0d10',
    fontWeight: '800',
    lineHeight: 28,
  },
});
