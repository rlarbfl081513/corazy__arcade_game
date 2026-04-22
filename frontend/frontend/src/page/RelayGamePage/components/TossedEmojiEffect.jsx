// src/components/TossedEmojiEffect.jsx (최종 완성판)

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';

import emojiQuestion from '@/page/RelayGamePage/assests/emoji/questoinEmoji.png';
import emojiSad from '@/page/RelayGamePage/assests/emoji/sadEmoji.png';
import emojiThumb from '@/page/RelayGamePage/assests/emoji/thumbEmoji.png';

const emojiMap = {
  question: emojiQuestion,
  sad: emojiSad,
  thumb: emojiThumb,
};

const TossedEmojiEffect = forwardRef(({ isEnabled = true }, ref) => {
  const [emojis, setEmojis] = useState([]);
  const safeZonesRef = useRef({ left: { min: 50, max: 300 }, right: { min: 900, max: 1200 } });

  // 실시간으로 안전 구역 계산 (패널 크기 변경 대응)
  const updateSafeZones = useCallback(() => {
    const leftPanel = document.querySelector('.problem-panel')?.parentElement;
    const centerPanel = document.querySelector('.monaco-editor')?.closest('.react-resizable') || 
                       document.querySelector('.col-section');
    const rightPanel = document.querySelector('.chat-section')?.parentElement;

    const width = window.innerWidth;

    const leftEnd = leftPanel ? leftPanel.getBoundingClientRect().right : width * 0.25;
    const centerStart = centerPanel ? centerPanel.getBoundingClientRect().left : width * 0.25;
    const centerEnd = centerPanel ? centerPanel.getBoundingClientRect().right : width * 0.75;

    safeZonesRef.current = {
      left: {
        min: 50,
        max: Math.max(leftEnd - 60, 100),                    // 왼쪽 패널 오른쪽 끝까지
      },
      right: {
        min: Math.min(centerEnd + 60, width - 300),          // 오른쪽 패널 시작부터
        max: width - 50,
      },
    };
  }, []);

  useEffect(() => {
    updateSafeZones();
    const handleResize = () => updateSafeZones();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSafeZones]);

  const triggerToss = useCallback((emojiId) => {
    if (!isEnabled || !emojiMap[emojiId]) return;

    updateSafeZones(); // 최신 위치 보장

    const count = Math.floor(Math.random() * 3) + 3; // 3~5개
    const newEmojis = [];

    const { left, right } = safeZonesRef.current;

    for (let i = 0; i < count; i++) {
      const goLeftSide = Math.random() < 0.5;
      const zone = goLeftSide ? left : right;

      let x = zone.min + Math.random() * (zone.max - zone.min);
      x = Math.max(70, Math.min(x, window.innerWidth - 70));

      newEmojis.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        src: emojiMap[emojiId],
        x,
        peak: -(180 + Math.random() * 120),
        spread: goLeftSide 
          ? -(Math.random() * 150 + 100)   // 왼쪽은 왼쪽으로 퍼지게
          : Math.random() * 150 + 100,     // 오른쪽은 오른쪽으로 퍼지게
        rotation: Math.random() * 720 + 360,
        duration: 2.8 + Math.random() * 0.7,
        delay: Math.random() * 0.3,
      });
    }

    setEmojis(prev => [...prev, ...newEmojis]);
  }, [isEnabled, updateSafeZones]);

  useImperativeHandle(ref, () => ({
    triggerToss,
  }));

  const handleComplete = (id) => {
    setEmojis(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      {emojis.map((emoji) => (
        <motion.img
          key={emoji.id}
          src={emoji.src}
          alt="toss emoji"
          initial={{ x: emoji.x, y: 0, opacity: 0, scale: 0.8, rotate: 0 }}
          animate={{
            y: [0, emoji.peak, 20],
            x: emoji.x + emoji.spread,
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1.2, 1, 0.9],
            rotate: emoji.rotation,
          }}
          transition={{
            duration: emoji.duration,
            delay: emoji.delay,
            ease: "easeOut",
            times: [0, 0.3, 0.8, 1],
          }}
          onAnimationComplete={() => handleComplete(emoji.id)}
          style={{
            position: 'fixed',
            left: 0,
            bottom: 20,
            width: '70px',
            height: '70px',
            pointerEvents: 'none',
            zIndex: 9999,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            userSelect: 'none',
          }}
        />
      ))}
    </>
  );
});

TossedEmojiEffect.displayName = 'TossedEmojiEffect';
export default TossedEmojiEffect;