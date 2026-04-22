import { useState, useEffect, useRef } from 'react';
import useGameSettings from '@/hooks/useGameSettings';
import cursorDefaultImg from '@/assets/cursor-default.png';
import cursorPointerImg from '@/assets/cursor-pointer.png';
import cursorClickImg  from '@/assets/cursor-click.png';
import { motion } from 'framer-motion';
import StarTrailBurst from '@/components/StarTrailBurst';
import { useModalTempSettings } from '@/context/SettingsModalContext';

const CURSOR_SIZE = 64;

export default function useCustomCursor() {
  const { settings: savedSettings } = useGameSettings();
  const { tempSettingsOverride } = useModalTempSettings();
  const effectiveSettings = tempSettingsOverride?.global ?? savedSettings;
  const cursorEnabled = effectiveSettings.cursor;

  const [cursorX, setCursorX] = useState(-100);
  const [cursorY, setCursorY] = useState(-100);
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const rafId = useRef(null);

  // -----------------------------------------------------------------
  // 1. Mouse move – requestAnimationFrame for buttery smooth follow
  // -----------------------------------------------------------------
  const handleMouseMove = (e) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setCursorX(e.clientX);
      setCursorY(e.clientY);

      const target = e.target;
      const shouldBePointer = target instanceof Element ? !!target.closest(
        'a, button, [role="button"], [role="link"], [data-cursor="pointer"]'
      ) : false;
      if (shouldBePointer !== isPointer) setIsPointer(shouldBePointer);
    });
  };

  // -----------------------------------------------------------------
  // 2. Click handling
  // -----------------------------------------------------------------
  const handleMouseDown = () => setIsClicking(true);
  const handleMouseUp   = () => setIsClicking(false);

  // -----------------------------------------------------------------
  // 3. Attach / detach listeners + hide native cursor when enabled
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!cursorEnabled) {
      document.body.classList.remove('hide-os-cursor');             // Restore native cursor if disabled
      return;
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup',   handleMouseUp);
    document.body.classList.add('hide-os-cursor');                  // hide native cursor

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup',   handleMouseUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      document.body.classList.remove('hide-os-cursor');             // restore native cursor
    };
  }, [cursorEnabled, isPointer]);

  // -----------------------------------------------------------------
  // 4. Rendered JSX (only when enabled)
  // -----------------------------------------------------------------
  if (!cursorEnabled) return null;

  const imgSrc = isClicking
    ? cursorClickImg
    : isPointer
      ? cursorPointerImg
      : cursorDefaultImg;

  // ---- star trail (3 layers) ----
  const trail = [0, 1, 2].map((i) => {
    const scale   = 1 - i * 0.3;
    const damping = 20 + i * 10;
    const centerX = cursorX + CURSOR_SIZE / 5;
    const centerY = cursorY + CURSOR_SIZE / 7;

    return (
      <motion.div
        key={i}
        animate={{ left: centerX, top: centerY }}
        transition={{
          type: 'spring',
          damping,
          stiffness: 400 - i * 100,
          mass: 0.5 + i * 0.2,
        }}
        style={{
          position: 'fixed',
          fontSize: `${36 * scale}px`,
          opacity: 1 - i * 0.25,
          pointerEvents: 'none',
          zIndex: 9998,
          color: '#fbbf24',
          filter: 'drop-shadow(0 0 4px #fbbf24)',
        }}
      >
        ✰
      </motion.div>
    );
  });

  return (
    <>
      {/* main cursor image */}
      <img
        src={imgSrc}
        alt="cursor"
        style={{
          position: 'fixed',
          left: cursorX,
          top: cursorY,
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          pointerEvents: 'none',
          zIndex: 99999,
          imageRendering: 'pixelated',
          animation: isClicking ? 'pulse 0.2s ease' : 'none',
        }}
      />

      {/* star trail */}
      {trail}

      {/* burst on click */}
      <StarTrailBurst
        cursorSize={CURSOR_SIZE}
        cursorX={cursorX}
        cursorY={cursorY}
        isClicking={isClicking}
      />
    </>
  );
}