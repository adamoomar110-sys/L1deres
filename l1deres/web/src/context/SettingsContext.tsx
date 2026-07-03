'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSystemSettings, SystemSettings } from '@/lib/settings';

const SettingsContext = createContext<{
  settings: SystemSettings | null;
  loading: boolean;
}>({
  settings: null,
  loading: true,
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
