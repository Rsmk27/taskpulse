import AsyncStorage from '@react-native-async-storage/async-storage';
import { deepMerge } from '../utils/dateUtils';

const TASKS_KEY     = '@tp_tasks';
const SETTINGS_KEY  = '@tp_settings';
const NOTIF_LOG_KEY = '@tp_notif_log';

const DEFAULT_SETTINGS = {
  briefingEnabled:  true,
  briefingTime:     '07:00',
  briefingIncludes: { allTasks: true, deadlines: true, routines: true },
  deadlineWarnings: {
    dayBefore:     true,
    dayBeforeTime: '20:00',
    oneHour:       true,
    thirtyMin:     true,
  },
  repeatReminders: {
    enabled:      true,
    interval:     10,
    maxRepeats:   5,
    hardStopTime: '23:00',
  },
  quietHours: {
    enabled: true,
    start:   '23:00',
    end:     '07:00',
  },
};

export const getTasks = async () => {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getTasksForDate = async (dateStr) => {
  const tasks = await getTasks();
  return tasks.filter(t => t.date === dateStr);
};

export const saveTask = async (task) => {
  const tasks = await getTasks();
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = task;
  } else {
    tasks.push(task);
  }
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const deleteTask = async (id) => {
  const tasks = await getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(filtered));
};

export const updateTaskStatus = async (id, status) => {
  const tasks = await getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    tasks[idx].status = status;
    tasks[idx].lastActionTime = new Date().toISOString();
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }
};

export const incrementRepeatCount = async (id) => {
  const tasks = await getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    tasks[idx].repeatCount = (tasks[idx].repeatCount || 0) + 1;
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }
};

export const getSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const stored = JSON.parse(raw);
    return deepMerge(DEFAULT_SETTINGS, stored);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = async (settings) => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getTaskHistory = async (days = 7) => {
  const tasks = await getTasks();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return tasks
    .filter(t => new Date(t.date) >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date));
};

export const getDaySummary = async (dateStr) => {
  const tasks = await getTasksForDate(dateStr);
  return {
    total:   tasks.length,
    done:    tasks.filter(t => t.status === 'done').length,
    snoozed: tasks.filter(t => t.status === 'snoozed').length,
    skipped: tasks.filter(t => t.status === 'skipped').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  };
};

export const appendNotifLog = async (entry) => {
  const log = await getNotifLog();
  log.push(entry);
  await AsyncStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(log));
};

export const getNotifLog = async () => {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const markNotifRead = async (id) => {
  const log = await getNotifLog();
  const idx = log.findIndex(e => e.id === id);
  if (idx >= 0) {
    log[idx].read = true;
    await AsyncStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(log));
  }
};

export const clearNotifLog = async () => {
  await AsyncStorage.setItem(NOTIF_LOG_KEY, JSON.stringify([]));
};
