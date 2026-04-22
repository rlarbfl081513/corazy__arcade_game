// src/hooks/useTypingSFX.js (FIXED)
import { useRef, useEffect, useCallback } from 'react';
import TypingSFX from '@/assets/sfx/typing.mp3';
import EnterSFX from '@/assets/sfx/enter.mp3';
// Make sure Math.clamp is defined globally or imported!

const POOL_SIZE = 8;

export default function useTypingSFX(options = {}) {
    const { volume = 100, enabled = true } = options;
    const typingPoolRef = useRef([]);
    const enterPoolRef = useRef([]);

    // Convert 0–100 → 0–1
    const normalizedVolume = Math.max(0, Math.min(1, volume / 100));
    
    // Store latest volume/enabled state in a ref for safe access in playSound
    const currentSettingsRef = useRef({ enabled: enabled, normalizedVolume: normalizedVolume });
    currentSettingsRef.current = { enabled, normalizedVolume };


    // 1. ⭐ INITIALIZATION EFFECT (Runs only ONCE)
    useEffect(() => {
        if (!TypingSFX || !EnterSFX) return;

        const createAudio = (src) => {
            const audio = new Audio(src);
            audio.volume = currentSettingsRef.current.normalizedVolume; // Use initial volume
            audio.preload = 'auto';
            return audio;
        };

        // Initialize pools
        typingPoolRef.current = Array.from({ length: POOL_SIZE }, () => createAudio(TypingSFX));
        enterPoolRef.current = Array.from({ length: POOL_SIZE }, () => createAudio(EnterSFX));
        
        // Cleanup: Pause and clear source
        return () => {
            [...typingPoolRef.current, ...enterPoolRef.current].forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            typingPoolRef.current = [];
            enterPoolRef.current = [];
        };
    }, []); // ⭐ Empty dependency array: runs only ONCE!


    // 2. ⭐ VOLUME UPDATE EFFECT (Runs when volume/enabled changes)
    useEffect(() => {
        const { enabled: isEnabled, normalizedVolume: newVolume } = currentSettingsRef.current;
        
        // Update volume on all existing audio elements
        [...typingPoolRef.current, ...enterPoolRef.current].forEach(audio => {
            audio.volume = newVolume;
        });
        
        // Pause/play based on enabled state
        if (!isEnabled) {
             [...typingPoolRef.current, ...enterPoolRef.current].forEach(audio => audio.pause());
        }
    }, [enabled, normalizedVolume]); // ⭐ Reruns when volume/enabled changes

    
    const playSound = useCallback((pool) => {
        // Use the ref for the latest enabled state, ensuring the closure is up-to-date
        if (!currentSettingsRef.current.enabled || pool.length === 0) return; 
        
        const sound = pool.find(s => s.paused || s.ended) || pool[0];
        sound.currentTime = 0;
        sound.play().catch(() => {}); // Ignore autoplay errors
    }, []); // playSound only needs to be memoized once

    return {
        playTyping: () => playSound(typingPoolRef.current),
        playEnter: () => playSound(enterPoolRef.current),
    };
}