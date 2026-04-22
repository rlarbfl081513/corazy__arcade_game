// src/components/BGMPlayer.jsx
import { useEffect, useRef } from 'react';
import useGameSettings from '@/hooks/useGameSettings';
import { useModalTempSettings } from '@/context/SettingsModalContext'; // ⭐ 1. Import

// Helper
Math.clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export function BGMPlayer({ src }) {
  // ⭐ 2. Get both saved settings AND temp override
  const { settings: savedSettings } = useGameSettings();
  const { tempSettingsOverride } = useModalTempSettings();
  
  // ⭐ 3. Determine the effective settings
  const effectiveSettings = tempSettingsOverride?.global ?? savedSettings;

  const audioRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audioRef.current = audio;

    const update = () => {
      // ⭐ 4. Use effectiveSettings
      const vol = effectiveSettings.bgm ? Math.clamp(effectiveSettings.bgmVolume / 100, 0, 1) : 0;
      audio.volume = vol;
      if (effectiveSettings.bgm && audio.paused) audio.play().catch(() => {});
      else if (!effectiveSettings.bgm && !audio.paused) audio.pause();
    };

    update();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]); // This hook should only run when src changes

  // React to changes
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    
    // ⭐ 5. Use effectiveSettings
    const vol = effectiveSettings.bgm ? Math.clamp(effectiveSettings.bgmVolume / 100, 0, 1) : 0;
    audio.volume = vol;
    if (effectiveSettings.bgm && audio.paused) audio.play().catch(() => {});
    else if (!effectiveSettings.bgm && !audio.paused) audio.pause();

  }, [effectiveSettings.bgm, effectiveSettings.bgmVolume]); // ⭐ 6. Update dependencies

  return null;
}