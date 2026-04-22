import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gameSettings';
const EVENT_NAME = 'gameSettingsChanged';

// You need to have DEFAULT_SETTINGS defined somewhere, e.g.:
const DEFAULT_SETTINGS = {
  global: { bgm: true, bgmVolume: 80, sfx: true, sfxVolume: 100, cursor: true },
  dictation: { particles: true, shake: false },
  challenge: { particles: true, shake: false },
  relay: { particles: true, shake: false },
};

export default function useGameSettings(gameMode = null) {
  const [settings, setSettings] = useState(() => {
    // Using sessionStorage as requested
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  // This effect listens for our custom event
  useEffect(() => {
    const handler = () => {
      // When notified, re-read settings from storage and update state
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    };

    // Listen for the custom event to sync all hook instances
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []); // Runs only once on mount

  // Single function to save the entire settings object
  const saveAllSettings = (newSettings) => {
    setSettings(newSettings); // 1. Update this hook's local state
    // 2. Save to session storage
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    // 3. Notify all other hook instances
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  const updateGlobal = (key, value) => {
    saveAllSettings({ ...settings, global: { ...settings.global, [key]: value } });
  };

  const updateMode = (mode, key, value) => {
    if (!settings[mode]) return;
    saveAllSettings({ ...settings, [mode]: { ...settings[mode], [key]: value } });
  };

  const current = gameMode ? { ...settings.global, ...settings[gameMode] } : settings.global;

  return {
    settings: current,
    allSettings: settings,
    updateGlobal,
    updateMode,
    saveAllSettings, // <-- Export the new function
  };
}