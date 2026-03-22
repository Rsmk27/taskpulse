import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import dayjs from 'dayjs';

import { saveTask }                           from '../services/storageService';
import { scheduleTaskReminder, scheduleDeadlineWarnings } from '../services/notificationService';
import { useSettings }                        from '../context/SettingsContext';
import { getTodayStr, isInFuture, formatDisplayDate, formatDisplayTime } from '../utils/dateUtils';
import { colors, radius } from '../constants/theme';

const INTERVALS    = [5, 10, 15, 30];
const MAX_REPEATS  = [3, 5, 10];

export default function AddTaskScreen({ navigation }) {
  const { settings } = useSettings();

  const defaultTime = dayjs().add(30, 'minute').format('HH:mm');

  const [title,            setTitle]            = useState('');
  const [type,             setType]             = useState('once');
  const [date,             setDate]             = useState(getTodayStr());
  const [time,             setTime]             = useState(defaultTime);
  const [intervalIndex,    setIntervalIndex]    = useState(1);
  const [maxRepeatsIndex,  setMaxRepeatsIndex]  = useState(1);
  const [titleError,       setTitleError]       = useState(false);
  const [timeError,        setTimeError]        = useState('');
  const [showDatePicker,   setShowDatePicker]   = useState(false);
  const [showTimePicker,   setShowTimePicker]   = useState(false);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const showToast = () => {
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    if (type !== 'routine' && !isInFuture(date, time)) {
      setTimeError('Time must be in the future');
      return;
    }

    setTitleError(false);
    setTimeError('');

    const task = {
      id:             Crypto.randomUUID(),
      title:          title.trim(),
      type,
      date,
      time,
      repeat:         type === 'routine',
      repeatInterval: INTERVALS[intervalIndex],
      maxRepeats:     MAX_REPEATS[maxRepeatsIndex],
      repeatCount:    0,
      status:         'pending',
      lastActionTime: null,
      lastReminderAt: null,
      notifIds:       [],
      createdAt:      new Date().toISOString(),
    };

    await saveTask(task);
    await scheduleTaskReminder(task);
    if (type === 'deadline' && settings) {
      await scheduleDeadlineWarnings(task, settings);
    }

    showToast();
    setTimeout(() => navigation.goBack(), 300);
  };

  const typeOptions = [
    { value: 'once',     label: '🎯 One-time', color: colors.accent },
    { value: 'routine',  label: '🔁 Routine',  color: colors.routine },
    { value: 'deadline', label: '⏳ Deadline',  color: colors.deadline },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Task</Text>
          </View>

          {/* Title */}
          <Text style={styles.label}>TASK TITLE</Text>
          <TextInput
            style={[styles.input, titleError && styles.inputError]}
            value={title}
            onChangeText={v => { setTitle(v); setTitleError(false); }}
            placeholder="Enter task title…"
            placeholderTextColor={colors.textDim}
          />
          {titleError && <Text style={styles.errorText}>Title is required</Text>}

          {/* Type */}
          <Text style={styles.label}>TASK TYPE</Text>
          <View style={styles.chipRow}>
            {typeOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  type === opt.value
                    ? { borderColor: opt.color, backgroundColor: opt.color + '18' }
                    : styles.chipInactive,
                ]}
                onPress={() => setType(opt.value)}
              >
                <Text style={[styles.chipText, type === opt.value && { color: opt.color }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date */}
          <Text style={styles.label}>DATE</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.pickerText}>{formatDisplayDate(date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dayjs(date).toDate()}
              mode="date"
              display="default"
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) setDate(dayjs(d).format('YYYY-MM-DD'));
              }}
            />
          )}

          {/* Time */}
          <Text style={styles.label}>TIME</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.pickerText}>{formatDisplayTime(time)}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={dayjs(`2000-01-01 ${time}`).toDate()}
              mode="time"
              display="default"
              onChange={(_, d) => {
                setShowTimePicker(false);
                if (d) setTime(dayjs(d).format('HH:mm'));
              }}
            />
          )}
          {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

          {/* Repeat interval */}
          <Text style={styles.label}>REPEAT INTERVAL</Text>
          <Text style={styles.subLabel}>if no action taken</Text>
          <View style={styles.chipRow}>
            {INTERVALS.map((val, i) => (
              <TouchableOpacity
                key={val}
                style={[styles.chip, intervalIndex === i ? styles.chipActive : styles.chipInactive]}
                onPress={() => setIntervalIndex(i)}
              >
                <Text style={[styles.chipText, intervalIndex === i && styles.chipTextActive]}>
                  {val} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Max reminders */}
          <Text style={styles.label}>MAX REMINDERS</Text>
          <View style={styles.chipRow}>
            {MAX_REPEATS.map((val, i) => (
              <TouchableOpacity
                key={val}
                style={[styles.chip, maxRepeatsIndex === i ? styles.chipActive : styles.chipInactive]}
                onPress={() => setMaxRepeatsIndex(i)}
              >
                <Text style={[styles.chipText, maxRepeatsIndex === i && styles.chipTextActive]}>
                  {val}×
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Task</Text>
          </TouchableOpacity>

          {/* Toast */}
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>✓ Task saved!</Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding:       18,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  24,
    gap:           14,
  },
  backBtn: {
    width:           34,
    height:          34,
    backgroundColor: colors.surface2,
    borderWidth:     1,
    borderColor:     colors.border1,
    borderRadius:    10,
    alignItems:      'center',
    justifyContent:  'center',
  },
  backIcon: {
    fontSize:   22,
    color:      colors.text,
    fontWeight: '600',
    lineHeight: 26,
  },
  headerTitle: {
    fontSize:   20,
    fontWeight: '800',
    color:      colors.text,
  },
  label: {
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 1.2,
    color:         colors.textDim,
    textTransform: 'uppercase',
    marginBottom:  7,
    marginTop:     16,
  },
  subLabel: {
    fontSize:     10,
    color:        colors.textSub,
    marginBottom: 7,
    marginTop:    -4,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth:     1,
    borderColor:     colors.border1,
    borderRadius:    10,
    paddingHorizontal: 14,
    paddingVertical:   13,
    color:           colors.text,
    fontSize:        14,
  },
  inputError: {
    borderColor: colors.skip,
  },
  errorText: {
    fontSize:   11,
    color:      colors.skip,
    marginTop:  4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      8,
    borderWidth:       1,
  },
  chipActive: {
    borderColor:     colors.accent,
    backgroundColor: colors.accent + '18',
  },
  chipInactive: {
    borderColor:     colors.border1,
    backgroundColor: colors.surface2,
  },
  chipText: {
    fontSize:   13,
    fontWeight: '600',
    color:      colors.textSub,
  },
  chipTextActive: {
    color: colors.accent,
  },
  pickerRow: {
    backgroundColor: colors.surface2,
    borderWidth:     1,
    borderColor:     colors.border1,
    borderRadius:    10,
    padding:         13,
  },
  pickerText: {
    fontSize:   14,
    color:      colors.text,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius:    10,
    padding:         15,
    alignItems:      'center',
    marginTop:       28,
  },
  saveBtnText: {
    color:      '#0d0d10',
    fontSize:   15,
    fontWeight: '800',
  },
  toast: {
    position:        'absolute',
    bottom:          20,
    alignSelf:       'center',
    backgroundColor: colors.surface3,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:    10,
  },
  toastText: {
    color:      colors.accent,
    fontWeight: '700',
    fontSize:   13,
  },
});
