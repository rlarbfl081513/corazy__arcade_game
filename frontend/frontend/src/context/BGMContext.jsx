import { createContext, useContext, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_BGM_BY_MODE, FALLBACK_BGM } from '@/config/bgm';
import useGameSettings from '@/hooks/useGameSettings';
import { useModalTempSettings } from '@/context/SettingsModalContext';

const BGMContext = createContext();

export const useBGM = () => useContext(BGMContext);

export function BGMProvider({ children }) {
  const audioRef = useRef(null);
  const location = useLocation();
  const { allSettings } = useGameSettings();
  const { tempSettingsOverride } = useModalTempSettings();

  const effectiveSettings = tempSettingsOverride ?? allSettings;

  // Helper to get user selected track
  const getTrack = (mode, defaultTrack) => {
    const userSelection = effectiveSettings[mode]?.selectedBGM;
    if (userSelection === 'none') return ''; 
    if (userSelection && userSelection !== 'default') return userSelection;
    return defaultTrack;
  };

  const getBgmUrl = () => {
    const path = location.pathname;

    // 1. Main Page (Fixed)
    if (path === '/main') return '/bgm/ingame/Main.mp3';

    // 2. Room Page (⭐ NEW: Fixed BGM)
    // This ensures the Room always plays a specific track, ignoring the dropdown setting.
    // You can change this file path to whatever you want for the waiting room.
    if (path.startsWith('/room')) return '/bgm/ingame/WaitingRoom.mp3'; 

    // 3. Relay Game Page (⭐ NEW: Configurable)
    // This uses the 'relay' settings.
    if (path.startsWith('/game')) {
      return getTrack('relay', DEFAULT_BGM_BY_MODE.relay);
    }

    // 4. Other Modes
    if (path.startsWith('/dictation')) return getTrack('dictation', DEFAULT_BGM_BY_MODE.dictation);
    if (path.startsWith('/challenge')) return getTrack('challenge', DEFAULT_BGM_BY_MODE.challenge);

    return FALLBACK_BGM;
  };

  // --- Volume/Mute Sync (No changes needed) ---
  useEffect(() => {
    if (audioRef.current) {
      const globalSettings = effectiveSettings.global || {};
      const vol = globalSettings.bgm ? globalSettings.bgmVolume / 100 : 0;
      audioRef.current.volume = vol;

      if (globalSettings.bgm && audioRef.current.paused && audioRef.current.src) {
        audioRef.current.play().catch(() => {});
      } else if (!globalSettings.bgm && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [effectiveSettings.global?.bgm, effectiveSettings.global?.bgmVolume]);

  // --- Track Change Sync ---
  useEffect(() => {
    if (!audioRef.current) return;

    const url = getBgmUrl();

    // Handle 'None' selection
    if (!url) {
      audioRef.current.pause();
      audioRef.current.src = "";
      return;
    }

    const fullUrl = url.startsWith('http') ? url : window.location.origin + (url.startsWith('/') ? url : '/' + url);

    // Only change track if the URL is different
    if (audioRef.current.src !== fullUrl) {
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      
      // Check global mute setting before playing
      if (effectiveSettings.global?.bgm) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [
    location.pathname, 
    effectiveSettings.dictation?.selectedBGM, 
    effectiveSettings.challenge?.selectedBGM, 
    effectiveSettings.relay?.selectedBGM 
    // ^ Note: Even if this changes while in '/room', getBgmUrl() returns the fixed path, 
    // so the song won't change. This is the desired behavior!
  ]);

  return (
    <BGMContext.Provider value={{ audioRef }}>
      {children}
      <audio ref={audioRef} loop preload="auto" style={{ display: 'none' }} />
    </BGMContext.Provider>
  );
}