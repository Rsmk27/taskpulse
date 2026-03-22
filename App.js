import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { SettingsProvider }      from './src/context/SettingsContext';
import AppNavigator              from './src/navigation/AppNavigator';
import {
  requestPermissions,
  setupNotificationHandler,
  setupNotificationCategories,
  registerBackgroundTask,
  handleNotificationResponse,
} from './src/services/notificationService';
import { colors } from './src/constants/theme';

export default function App() {
  const [permGranted, setPermGranted] = useState(true);
  const listenerRef = useRef(null);

  useEffect(() => {
    setupNotificationHandler();

    (async () => {
      const granted = await requestPermissions();
      setPermGranted(granted);
      if (granted) {
        await setupNotificationCategories();
        await registerBackgroundTask();
      }
    })();

    listenerRef.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
      }
    };
  }, []);

  if (!permGranted) {
    return (
      <SafeAreaProvider>
        <View style={styles.permDenied}>
          <Text style={styles.permText}>
            ⚠️ Notification permissions are required for TaskPulse to function.
            {'\n\n'}Please enable notifications in your device settings.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SettingsProvider>
        <AppNavigator />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  permDenied: {
    flex:            1,
    backgroundColor: colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         32,
  },
  permText: {
    color:     colors.textSub,
    textAlign: 'center',
    fontSize:  14,
    lineHeight: 22,
  },
});
