import React, { useState } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

import { useSettings }        from '../context/SettingsContext';
import { formatDisplayTime }  from '../utils/dateUtils';
import BrandLogo              from '../components/BrandLogo';
import BrandFooter            from '../components/BrandFooter';
import { colors, radius }     from '../constants/theme';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();

  const [showTimePicker, setShowTimePicker] = useState(null);

  if (!settings) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openTimePicker = (key) => setShowTimePicker(key);

  const handleTimeChange = (key, date) => {
    setShowTimePicker(null);
    if (!date) return;
    const str = dayjs(date).format('HH:mm');
    if (key === 'briefingTime') {
      updateSettings({ briefingTime: str });
    } else if (key === 'dayBeforeTime') {
      updateSettings({ deadlineWarnings: { ...settings.deadlineWarnings, dayBeforeTime: str } });
    } else if (key === 'hardStopTime') {
      updateSettings({ repeatReminders: { ...settings.repeatReminders, hardStopTime: str } });
    } else if (key === 'quietStart') {
      updateSettings({ quietHours: { ...settings.quietHours, start: str } });
    } else if (key === 'quietEnd') {
      updateSettings({ quietHours: { ...settings.quietHours, end: str } });
    }
  };

  const timePickerValue = (key) => {
    let str = '07:00';
    if (key === 'briefingTime')   str = settings.briefingTime;
    if (key === 'dayBeforeTime')  str = settings.deadlineWarnings.dayBeforeTime;
    if (key === 'hardStopTime')   str = settings.repeatReminders.hardStopTime;
    if (key === 'quietStart')     str = settings.quietHours.start;
    if (key === 'quietEnd')       str = settings.quietHours.end;
    return dayjs(`2000-01-01 ${str}`).toDate();
  };

  const INTERVALS   = [5, 10, 15, 30];
  const MAX_REPEATS_OPTS = [3, 5, 10, 0];
  const MAX_LABELS  = ['3×', '5×', '10×', 'Unlimited'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <BrandLogo compact />
        <Text style={styles.pageTitle}>Notification Settings</Text>

        {/* MORNING BRIEFING */}
        <Text style={styles.sectionLabel}>☀️ MORNING BRIEFING</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Morning Briefing</Text>
              <Text style={styles.rowSub}>Daily task summary at wake-up</Text>
            </View>
            <Switch
              value={settings.briefingEnabled}
              onValueChange={v => updateSettings({ briefingEnabled: v })}
              trackColor={{ false: colors.border2, true: colors.accent }}
              thumbColor="white"
            />
          </View>
          <View style={[styles.row, styles.rowNoBorder]}>
            <Text style={styles.rowLabel}>Briefing Time</Text>
            <TouchableOpacity style={styles.timeChip} onPress={() => openTimePicker('briefingTime')}>
              <Text style={styles.timeChipText}>{formatDisplayTime(settings.briefingTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.row, styles.rowNoBorder]}>
            <Text style={styles.rowLabel}>Include in Briefing</Text>
          </View>
          <View style={styles.chipRowPad}>
            {[
              { key: 'allTasks',  label: 'All Tasks'  },
              { key: 'deadlines', label: 'Deadlines'  },
              { key: 'routines',  label: 'Routines'   },
            ].map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  settings.briefingIncludes[opt.key] ? styles.chipActive : styles.chipInactive,
                ]}
                onPress={() => updateSettings({
                  briefingIncludes: {
                    ...settings.briefingIncludes,
                    [opt.key]: !settings.briefingIncludes[opt.key],
                  },
                })}
              >
                <Text style={[styles.chipText, settings.briefingIncludes[opt.key] && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* DEADLINE WARNINGS */}
        <Text style={styles.sectionLabel}>⚠️ DEADLINE WARNINGS</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Day-Before Alert</Text>
              <Text style={styles.rowSub}>Evening before deadline</Text>
            </View>
            <Switch
              value={settings.deadlineWarnings.dayBefore}
              onValueChange={v => updateSettings({ deadlineWarnings: { ...settings.deadlineWarnings, dayBefore: v } })}
              trackColor={{ false: colors.border2, true: colors.accent }}
              thumbColor="white"
            />
          </View>
          {settings.deadlineWarnings.dayBefore && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Alert Time</Text>
              <TouchableOpacity style={styles.timeChip} onPress={() => openTimePicker('dayBeforeTime')}>
                <Text style={styles.timeChipText}>{formatDisplayTime(settings.deadlineWarnings.dayBeforeTime)}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>1-Hour Warning</Text>
            <Switch
              value={settings.deadlineWarnings.oneHour}
              onValueChange={v => updateSettings({ deadlineWarnings: { ...settings.deadlineWarnings, oneHour: v } })}
              trackColor={{ false: colors.border2, true: colors.accent }}
              thumbColor="white"
            />
          </View>
          <View style={[styles.row, styles.rowNoBorder]}>
            <Text style={styles.rowLabel}>30-Minute Warning</Text>
            <Switch
              value={settings.deadlineWarnings.thirtyMin}
              onValueChange={v => updateSettings({ deadlineWarnings: { ...settings.deadlineWarnings, thirtyMin: v } })}
              trackColor={{ false: colors.border2, true: colors.accent }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* REPEAT REMINDERS */}
        <Text style={styles.sectionLabel}>🔁 REPEAT REMINDERS</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Repeat Reminders</Text>
              <Text style={styles.rowSub}>Re-notify until action taken</Text>
            </View>
            <Switch
              value={settings.repeatReminders.enabled}
              onValueChange={v => updateSettings({ repeatReminders: { ...settings.repeatReminders, enabled: v } })}
              trackColor={{ false: colors.border2, true: colors.accent }}
              thumbColor="white"
            />
          </View>
          <View style={[styles.row, styles.rowNoBorder]}>
            <Text style={styles.rowLabel}>Repeat Interval</Text>
          </View>
          <View style={styles.chipRowPad}>
            {INTERVALS.map(val => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.chip,
                  settings.repeatReminders.interval === val ? styles.chipActive : styles.chipInactive,
                ]}
                onPress={() => updateSettings({ repeatReminders: { ...settings.repeatReminders, interval: val } })}
              >
                <Text style={[styles.chipText, settings.repeatReminders.interval === val && styles.chipTextActive]}>
                  {val} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.row, styles.rowNoBorder]}>
            <Text style={styles.rowLabel}>Max Reminders</Text>
          </View>
          <View style={styles.chipRowPad}>
            {MAX_REPEATS_OPTS.map((val, i) => (
              <TouchableOpacity
                key={String(val)}
                style={[
                  styles.chip,
                  settings.repeatReminders.maxRepeats === val ? styles.chipActive : styles.chipInactive,
                ]}
                onPress={() => updateSettings({ repeatReminders: { ...settings.repeatReminders, maxRepeats: val } })}
              >
                <Text style={[styles.chipText, settings.repeatReminders.maxRepeats === val && styles.chipTextActive]}>
                  {MAX_LABELS[i]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.row, styles.rowNoBorder]}>
            <Text style={styles.rowLabel}>Hard Stop Time</Text>
            <TouchableOpacity style={styles.timeChip} onPress={() => openTimePicker('hardStopTime')}>
              <Text style={styles.timeChipText}>{formatDisplayTime(settings.repeatReminders.hardStopTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QUIET HOURS */}
        <Text style={styles.sectionLabel}>🌙 QUIET HOURS</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Quiet Hours</Text>
              <Text style={styles.rowSub}>No notifications during sleep</Text>
            </View>
            <Switch
              value={settings.quietHours.enabled}
              onValueChange={v => updateSettings({ quietHours: { ...settings.quietHours, enabled: v } })}
              trackColor={{ false: colors.border2, true: colors.accent }}
              thumbColor="white"
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Start Time</Text>
            <TouchableOpacity style={styles.timeChip} onPress={() => openTimePicker('quietStart')}>
              <Text style={styles.timeChipText}>{formatDisplayTime(settings.quietHours.start)}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.row, styles.rowNoBorder]}>
            <Text style={styles.rowLabel}>End Time</Text>
            <TouchableOpacity style={styles.timeChip} onPress={() => openTimePicker('quietEnd')}>
              <Text style={styles.timeChipText}>{formatDisplayTime(settings.quietHours.end)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BrandFooter />

      </ScrollView>

      {showTimePicker && (
        <DateTimePicker
          value={timePickerValue(showTimePicker)}
          mode="time"
          display="default"
          onChange={(_, date) => handleTimeChange(showTimePicker, date)}
        />
      )}
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
  pageTitle: {
    fontSize:     20,
    fontWeight:   '800',
    color:        colors.text,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize:      9,
    fontWeight:    '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color:         colors.textDim,
    marginTop:     14,
    marginBottom:  6,
  },
  group: {
    backgroundColor: colors.surface2,
    borderWidth:     1,
    borderColor:     colors.border1,
    borderRadius:    radius.md,
    overflow:        'hidden',
    marginBottom:    12,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 15,
    paddingVertical:   13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border1,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontSize:   13,
    fontWeight: '600',
    color:      colors.text,
  },
  rowSub: {
    fontSize:  11,
    color:     colors.textSub,
    marginTop: 2,
  },
  timeChip: {
    backgroundColor: colors.surface3,
    borderWidth:     1,
    borderColor:     colors.border2,
    borderRadius:    7,
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  timeChipText: {
    fontSize:   11,
    fontWeight: '700',
    color:      colors.accent,
  },
  chipRowPad: {
    flexDirection:   'row',
    flexWrap:        'wrap',
    gap:             8,
    paddingHorizontal: 15,
    paddingVertical:   10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      7,
    borderWidth:       1,
  },
  chipActive: {
    borderColor:     colors.accent,
    backgroundColor: colors.accent + '18',
  },
  chipInactive: {
    borderColor:     colors.border1,
    backgroundColor: colors.surface3,
  },
  chipText: {
    fontSize:   11,
    fontWeight: '600',
    color:      colors.textSub,
  },
  chipTextActive: {
    color: colors.accent,
  },
  loading: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSub,
  },
});
