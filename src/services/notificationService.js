import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import dayjs from 'dayjs';

import {
  getTasks,
  getSettings,
  saveTask,
  updateTaskStatus,
  incrementRepeatCount,
  appendNotifLog,
  getNotifLog,
  markNotifRead,
} from './storageService';
import {
  isInFuture,
  isInQuietWindow,
  minutesFromNow,
  formatDisplayTime,
  getTodayStr,
  combineDatetime,
} from '../utils/dateUtils';

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });
};

export const setupNotificationCategories = async () => {
  await Notifications.setNotificationCategoryAsync('TASK_ACTION', [
    { identifier: 'DONE',   buttonTitle: '✅ Done'   },
    { identifier: 'SNOOZE', buttonTitle: '⏰ Snooze' },
    { identifier: 'SKIP',   buttonTitle: '❌ Skip'   },
  ]);
};

export const scheduleMorningBriefing = async (settings, tasks) => {
  if (!settings.briefingEnabled) return;

  try {
    const existingId = await AsyncStorage.getItem('BRIEFING_NOTIF_ID');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }
  } catch {}

  const todayTasks = tasks.filter(t => t.date === getTodayStr());
  const total = todayTasks.length;
  const deadlines = todayTasks.filter(t => t.type === 'deadline').length;

  const [hourStr, minStr] = settings.briefingTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '☀️ Good Morning!',
      body:  `You have ${total} tasks today, ${deadlines} deadlines.`,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });

  await AsyncStorage.setItem('BRIEFING_NOTIF_ID', id);
  await appendNotifLog({
    id:      id,
    taskId:  null,
    type:    'briefing',
    title:   '☀️ Good Morning!',
    message: `You have ${total} tasks today, ${deadlines} deadlines.`,
    firedAt: new Date().toISOString(),
    read:    false,
  });
};

export const scheduleDeadlineWarnings = async (task, settings) => {
  if (task.type !== 'deadline') return;

  const deadline = combineDatetime(task.date, task.time);
  const notifIds = [...(task.notifIds || [])];

  if (settings.deadlineWarnings.dayBefore) {
    const [h, m] = settings.deadlineWarnings.dayBeforeTime.split(':');
    const triggerDate = deadline.subtract(1, 'day').hour(parseInt(h, 10)).minute(parseInt(m, 10)).second(0).toDate();
    if (triggerDate > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Deadline Tomorrow',
          body:  `"${task.title}" is due tomorrow at ${formatDisplayTime(task.time)}`,
          data:  { taskId: task.id, type: 'day_before' },
        },
        trigger: triggerDate,
      });
      notifIds.push(id);
      await appendNotifLog({ id, taskId: task.id, type: 'day_before', title: '📅 Deadline Tomorrow', message: `"${task.title}" is due tomorrow at ${formatDisplayTime(task.time)}`, firedAt: triggerDate.toISOString(), read: false });
    }
  }

  if (settings.deadlineWarnings.oneHour) {
    const triggerDate = deadline.subtract(60, 'minute').toDate();
    if (triggerDate > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏳ Due in 1 Hour',
          body:  `"${task.title}" is due at ${formatDisplayTime(task.time)}`,
          data:  { taskId: task.id, type: '1hr_warning' },
        },
        trigger: triggerDate,
      });
      notifIds.push(id);
      await appendNotifLog({ id, taskId: task.id, type: '1hr_warning', title: '⏳ Due in 1 Hour', message: `"${task.title}" is due at ${formatDisplayTime(task.time)}`, firedAt: triggerDate.toISOString(), read: false });
    }
  }

  if (settings.deadlineWarnings.thirtyMin) {
    const triggerDate = deadline.subtract(30, 'minute').toDate();
    if (triggerDate > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚡ Due in 30 Minutes!',
          body:  `Act now — "${task.title}" is due soon`,
          data:  { taskId: task.id, type: '30min_warning' },
        },
        trigger: triggerDate,
      });
      notifIds.push(id);
      await appendNotifLog({ id, taskId: task.id, type: '30min_warning', title: '⚡ Due in 30 Minutes!', message: `Act now — "${task.title}" is due soon`, firedAt: triggerDate.toISOString(), read: false });
    }
  }

  task.notifIds = notifIds;
  await saveTask(task);
};

export const scheduleTaskReminder = async (task) => {
  if (!isInFuture(task.date, task.time)) return;

  const body = task.type === 'routine'
    ? 'Daily routine — time to act!'
    : task.type === 'deadline'
      ? 'Deadline task — complete it now!'
      : 'One-time task reminder';

  const triggerDate = combineDatetime(task.date, task.time).toDate();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title:            task.title,
      body,
      categoryIdentifier: 'TASK_ACTION',
      data:             { taskId: task.id, type: 'task_reminder' },
    },
    trigger: triggerDate,
  });

  const notifIds = [...(task.notifIds || []), id];
  task.notifIds = notifIds;
  await saveTask(task);
};

export const scheduleRepeatReminder = async (task, settings, overrideMinutes = null) => {
  if ((task.repeatCount || 0) >= (task.maxRepeats || 5)) return;
  if (settings.quietHours.enabled && isInQuietWindow(settings.quietHours.start, settings.quietHours.end)) return;

  const nowStr = dayjs().format('HH:mm');
  if (nowStr >= settings.repeatReminders.hardStopTime) return;

  const minutes = overrideMinutes !== null ? overrideMinutes : settings.repeatReminders.interval;
  const triggerDate = minutesFromNow(minutes);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title:            task.title,
      body:             `Still pending. Reminder ${(task.repeatCount || 0) + 1} of ${task.maxRepeats}`,
      categoryIdentifier: 'TASK_ACTION',
      data:             { taskId: task.id, type: 'repeat_reminder' },
    },
    trigger: triggerDate,
  });

  const notifIds = [...(task.notifIds || []), id];
  task.notifIds = notifIds;
  await incrementRepeatCount(task.id);
  await saveTask(task);
};

export const cancelAllTaskNotifications = async (taskId) => {
  const tasks = await getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  for (const nid of (task.notifIds || [])) {
    try {
      await Notifications.cancelScheduledNotificationAsync(nid);
    } catch {}
  }

  task.notifIds = [];
  await saveTask(task);
};

export const handleNotificationResponse = async (response) => {
  const taskId = response.notification.request.content.data?.taskId;
  if (!taskId) return;

  const settings = await getSettings();
  const tasks = await getTasks();
  const task = tasks.find(t => t.id === taskId);

  switch (response.actionIdentifier) {
    case 'DONE':
      await updateTaskStatus(taskId, 'done');
      await cancelAllTaskNotifications(taskId);
      if (task && task.type === 'routine') {
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
      break;
    case 'SNOOZE':
      await updateTaskStatus(taskId, 'snoozed');
      if (task) {
        await scheduleRepeatReminder(task, settings, 10);
      }
      break;
    case 'SKIP':
      await updateTaskStatus(taskId, 'skipped');
      await cancelAllTaskNotifications(taskId);
      break;
    case 'DEFAULT':
    default: {
      const log = await getNotifLog();
      const entry = log.find(e => e.taskId === taskId);
      if (entry) {
        await markNotifRead(entry.id);
      }
      break;
    }
  }
};

export const BG_TASK = 'TASKPULSE_BG_CHECK';

TaskManager.defineTask(BG_TASK, async () => {
  try {
    const tasks    = await getTasks();
    const settings = await getSettings();
    const now      = dayjs();

    const pending = tasks.filter(t =>
      t.status === 'pending' &&
      (t.repeatCount || 0) < t.maxRepeats &&
      t.lastActionTime &&
      now.diff(dayjs(t.lastActionTime), 'minute') >= settings.repeatReminders.interval
    );

    for (const task of pending) {
      await scheduleRepeatReminder(task, settings);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BG_TASK, {
      minimumInterval: 60,
      stopOnTerminate:  false,
      startOnBoot:      true,
    });
  } catch (e) {
    console.log('BG task registration failed:', e);
  }
};
