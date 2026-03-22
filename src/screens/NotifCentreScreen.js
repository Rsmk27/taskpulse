import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import { getNotifLog, markNotifRead, clearNotifLog } from '../services/storageService';
import { isToday, isYesterday, formatDisplayTime }   from '../utils/dateUtils';
import { colors, radius } from '../constants/theme';

const TYPE_CONFIG = {
  briefing:       { icon: '☀️', color: colors.briefing  },
  day_before:     { icon: '⚠️', color: colors.warning   },
  '1hr_warning':  { icon: '⏳', color: colors.warning   },
  '30min_warning':{ icon: '⚡', color: colors.warning   },
  task_reminder:  { icon: '⏰', color: colors.accent    },
  repeat_reminder:{ icon: '🔁', color: colors.repeat    },
};

function buildSections(log) {
  const today     = log.filter(e => isToday(dayjs(e.firedAt).format('YYYY-MM-DD')));
  const yesterday = log.filter(e => isYesterday(dayjs(e.firedAt).format('YYYY-MM-DD')));
  const sections  = [];
  if (today.length)     sections.push({ title: 'TODAY',     data: today });
  if (yesterday.length) sections.push({ title: 'YESTERDAY', data: yesterday });
  return sections;
}

export default function NotifCentreScreen() {
  const [sections, setSections] = useState([]);

  const loadData = useCallback(async () => {
    const log  = await getNotifLog();
    const reversed = [...log].reverse();
    setSections(buildSections(reversed));
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleClear = async () => {
    await clearNotifLog();
    loadData();
  };

  const handleTap = async (entry) => {
    await markNotifRead(entry.id);
    loadData();
  };

  const renderEntry = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task_reminder;
    const timeStr = formatDisplayTime(dayjs(item.firedAt).format('HH:mm'));
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleTap(item)} activeOpacity={0.8}>
        <View style={[styles.iconBox, { backgroundColor: cfg.color + '18' }]}>
          <Text style={styles.iconText}>{cfg.icon}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.typePill, { borderColor: cfg.color + '44', backgroundColor: cfg.color + '18' }]}>
              <Text style={[styles.typePillText, { color: cfg.color }]}>{item.type.replace(/_/g, ' ')}</Text>
            </View>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMsg}   numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const allItems = sections.flatMap(s =>
    [{ isSectionHeader: true, title: s.title, id: 'hdr_' + s.title }, ...s.data]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={allItems}
        keyExtractor={(item, i) => item.id || String(i)}
        renderItem={({ item }) => {
          if (item.isSectionHeader) {
            return <Text style={styles.sectionHeader}>{item.title}</Text>;
          }
          return renderEntry({ item });
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
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
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        18,
    paddingBottom:  10,
  },
  headerTitle: {
    fontSize:   20,
    fontWeight: '800',
    color:      colors.text,
  },
  clearText: {
    fontSize:   10,
    color:      colors.accent,
  },
  listContent: {
    padding:       14,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize:      9,
    fontWeight:    '800',
    letterSpacing: 1.2,
    color:         colors.textDim,
    textTransform: 'uppercase',
    marginTop:     12,
    marginBottom:  6,
  },
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.surface2,
    borderWidth:     1,
    borderColor:     colors.border1,
    borderRadius:    radius.md,
    padding:         12,
    marginBottom:    7,
  },
  iconBox: {
    width:          35,
    height:         35,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    10,
  },
  iconText: {
    fontSize: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  3,
  },
  typePill: {
    borderRadius:      5,
    borderWidth:       1,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  typePillText: {
    fontSize:   9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 10,
    color:    colors.textDim,
  },
  cardTitle: {
    fontSize:   12,
    fontWeight: '700',
    color:      colors.text,
  },
  cardMsg: {
    fontSize:  10,
    color:     colors.textSub,
    marginTop: 2,
  },
  unreadDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: colors.accent,
    marginLeft:      8,
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
