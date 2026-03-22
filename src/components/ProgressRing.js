import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/theme';

export default function ProgressRing({ done, total, size = 68 }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? done / total : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={size}
        style={styles.svg}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surface3}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.label}>{done}/{total}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  center: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    color:      colors.accent,
    fontWeight: '800',
    fontSize:   17,
  },
});
