'use client';
import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_SETTINGS, SystemSettings } from '@/lib/settings';

const SettingsContext = createContext<{
  settings: SystemSettings;
  loading: boolean;
}>({
  settings: DEFAULT_SETTINGS,
  loading: false,
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  return (
    <SettingsContext.Provider value={{ settings, loading: false }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

