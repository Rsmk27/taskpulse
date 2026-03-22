import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen        from '../screens/HomeScreen';
import AddTaskScreen     from '../screens/AddTaskScreen';
import NotifCentreScreen from '../screens/NotifCentreScreen';
import TimelineScreen    from '../screens/TimelineScreen';
import SettingsScreen    from '../screens/SettingsScreen';
import HistoryScreen     from '../screens/HistoryScreen';
import { colors }        from '../constants/theme';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"  component={HomeScreen} />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor:   colors.accent,
          tabBarInactiveTintColor: colors.textDim,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Home:     focused ? 'home'          : 'home-outline',
              Notifs:   focused ? 'notifications' : 'notifications-outline',
              Timeline: focused ? 'calendar'      : 'calendar-outline',
              Settings: focused ? 'settings'      : 'settings-outline',
              History:  focused ? 'document-text' : 'document-text-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={({ navigation, route }) => ({
            tabBarStyle: getTabBarStyle(route),
          })}
        />
        <Tab.Screen name="Notifs"   component={NotifCentreScreen} />
        <Tab.Screen name="Timeline" component={TimelineScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
        <Tab.Screen name="History"  component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function getTabBarStyle(route) {
  const routeName = getFocusedRouteName(route);
  if (routeName === 'AddTask') {
    return { display: 'none' };
  }
  return styles.tabBar;
}

function getFocusedRouteName(route) {
  const state = route.state;
  if (!state) return route.params?.screen || 'HomeMain';
  const routes = state.routes;
  const index  = state.index ?? routes.length - 1;
  return routes[index].name;
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(20,20,24,0.97)',
    borderTopColor:  colors.border1,
    height:          76,
    paddingBottom:   12,
  },
});
