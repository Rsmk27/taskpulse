import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSettings, saveSettings, getTasks } from '../services/storageService';
import { scheduleMorningBriefing } from '../services/notificationService';
import { deepMerge } from '../utils/dateUtils';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings().then(s => setSettings(s));
  }, []);

  const updateSettings = async (partial) => {
    const current = settings || (await getSettings());
    const merged = deepMerge(current, partial);
    await saveSettings(merged);
    if (partial.briefingTime || partial.briefingEnabled !== undefined) {
      const tasks = await getTasks();
      await scheduleMorningBriefing(merged, tasks);
    }
    setSettings(merged);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
