import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { colors, radius } from '../constants/theme';

const TYPE_CONFIG = {
  briefing: {
    bg:         'rgba(56,189,248,0.07)',
    border:     'rgba(56,189,248,0.18)',
    icon:       '☀️',
    titleColor: colors.briefing,
  },
  warning: {
    bg:         'rgba(251,146,60,0.06)',
    border:     'rgba(251,146,60,0.22)',
    icon:       '⚡',
    titleColor: colors.warning,
  },
  repeat: {
    bg:         'rgba(248,113,113,0.06)',
    border:     'rgba(248,113,113,0.18)',
    icon:       '🔁',
    titleColor: colors.repeat,
  },
};

export default function NotifBanner({ type, title, subtitle, timeAgo, onPress, urgent = false }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.warning;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (urgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 750, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,   duration: 750, useNativeDriver: true }),
        ])
      ).start();
    }
    return () => opacity.stopAnimation();
  }, [urgent, opacity]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.banner,
          { backgroundColor: config.bg, borderColor: config.border },
          urgent && { opacity },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: config.titleColor }]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {timeAgo ? <Text style={styles.timeAgo}>{timeAgo}</Text> : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1,
    borderRadius:   radius.md,
    padding:        12,
    marginBottom:   8,
  },
  iconContainer: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    10,
  },
  icon: {
    fontSize: 18,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize:   13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize:   11,
    color:      colors.textSub,
    marginTop:  2,
  },
  timeAgo: {
    fontSize:  10,
    color:     colors.textDim,
    marginLeft: 8,
  },
});
