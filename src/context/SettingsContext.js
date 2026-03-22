import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../services/storageService';
import { scheduleMorningBriefing } from '../services/notificationService';
import { getTasks } from '../services/storageService';

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

function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
