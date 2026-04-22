import { useEffect, useRef, useImperativeHandle } from 'react';
import { PARTICLES } from '@/config/particles';

export default function usePowerMode(
  editorRef,
  monacoRef,
  {
    enableParticles = true,
    enableShake = false,
    requireCorrectColor = false,
    currentLineRef = null,
    problemLines = null,
    onParticleAdd = null,
  } = {}
) {
  const overlayRef = useRef(null);
  const pendingEraseColorRef = useRef(null);
  const pendingErasePosRef = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const disposablesRef = useRef([]);
  const charWidthRef = useRef(0);
  const defaultColorRef = useRef('#00ff00'); // Will be updated from .mtk1
  const linesContentRef = useRef(null);

  // -----------------------------------------------------------------
  // DOM explosion – only after image loads
  // -----------------------------------------------------------------
  const emitDomExplosion = (overlay, x, y, color, imgSrc) => {
    if (!overlay) return;
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = `${x - 40}px`;
    el.style.top = `${y - 40}px`;
    el.style.width = '80px';
    el.style.height = '80px';
    el.style.backgroundColor = color;
    el.style.maskImage = `url(${imgSrc})`;
    el.style.webkitMaskImage = `url(${imgSrc})`;
    el.style.maskSize = 'cover';
    el.style.webkitMaskSize = 'cover';
    el.style.pointerEvents = 'none';
    el.style.transform = `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px)`;
    el.style.opacity = '0.9';
    overlay.appendChild(el);
    setTimeout(() => el.remove(), 600);
  };

  // -----------------------------------------------------------------
  // Canvas + DOM particle
  // -----------------------------------------------------------------
  const addCanvasParticle = (x, y, color) => {
    if (!enableParticles) return;

    const imgSrc = PARTICLES[Math.floor(Math.random() * PARTICLES.length)];
    const img = new Image();
    img.src = imgSrc;

    img.onload = () => {
      const particle = {
        img,
        x: x - 40,
        y: y - 40,
        vx: Math.random() * 16 - 8,
        vy: Math.random() * 16 - 8,
        life: 60,
        color,
      };
      onParticleAdd?.(particle);
      emitDomExplosion(overlayRef.current, x, y, color, imgSrc);
    };
  };

  const apiRef = useRef({ addCanvasParticle });
  useImperativeHandle(apiRef, () => ({ addCanvasParticle }), []);

  // -----------------------------------------------------------------
  // Get pixel coordinates safely
  // -----------------------------------------------------------------
  const getElementAtPosition = (lineNumber, column) => {
    const editor = editorRef.current;
    if (!editor) return null;

    const coord = editor.getScrolledVisiblePosition({ lineNumber, column });
    if (!coord || !isFinite(coord.left) || !isFinite(coord.top) || !isFinite(coord.height)) {
      return null;
    }

    const editorDomNode = editor.getDomNode();
    const editorRect = editorDomNode?.getBoundingClientRect();
    if (!editorRect || !isFinite(editorRect.left) || !isFinite(editorRect.top)) {
      return null;
    }

    const x = editorRect.left + coord.left + (charWidthRef.current / 2);
    const y = editorRect.top + coord.top + (coord.height / 2);

    if (!isFinite(x) || !isFinite(y)) return null;

    return document.elementFromPoint(x, y);
  };

  // -----------------------------------------------------------------
  // NEW: Robust color detection – walks up DOM to find real .mtk* color
  // -----------------------------------------------------------------
  const getColorFromPosition = (lineNumber, column) => {
    const element = getElementAtPosition(lineNumber, column);
    if (!element) return defaultColorRef.current;

    let current = element;
    let depth = 0;
    const maxDepth = 12;

    while (current && depth < maxDepth) {
      // FIX: Ensure 'current' is an Element (not document or text node)
      // before calling getComputedStyle.
      if (!(current instanceof Element)) {
        current = current.parentNode;
        depth++;
        continue;
      }

      // Skip cursor and invisible elements
      if (current.classList?.contains('cursor') || current.offsetParent === null) {
        current = current.parentNode;
        depth++;
        continue;
      }

      const style = window.getComputedStyle(current);
      const color = style.color;

      // If it has a real color and belongs to a token class (mtk1, mtk5, etc.)
      if (color &&
          color !== 'rgb(255, 255, 255)' &&
          color !== 'rgba(0, 0, 0, 0)' &&
          color !== 'transparent') {
        if (current.classList && /mtk\d+/.test(current.classList.value)) {
          return color;
        }
      }

      current = current.parentNode;
      depth++;
    }

    // Final fallback: use the real default .mtk1 color we detected
    return defaultColorRef.current;
  };

  // -----------------------------------------------------------------
  // Shake effect
  // -----------------------------------------------------------------
  const triggerShake = () => {
    if (!enableShake || !linesContentRef.current) return;
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);

    const intensity = 4;
    const dx = (Math.random() > 0.5 ? 1 : -1) * intensity;
    const dy = (Math.random() > 0.5 ? 1 : -1) * intensity;

    linesContentRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    shakeTimeoutRef.current = setTimeout(() => {
      if (linesContentRef.current) {
        linesContentRef.current.style.transform = '';
      }
    }, 800);
  };

  // -----------------------------------------------------------------
  // Detect real .mtk1 color from current theme
  // -----------------------------------------------------------------
  const detectDefaultColorFromTheme = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const container = editor.getDomNode();
    if (!container) return;

    const tempSpan = document.createElement('span');
    tempSpan.className = 'mtk1';
    tempSpan.textContent = 'x';
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.pointerEvents = 'none';

    container.appendChild(tempSpan);

    try {
      const color = window.getComputedStyle(tempSpan).color;
      if (color && color !== 'rgb(255, 255, 255)') {
        defaultColorRef.current = color;
        console.log('Power Mode: Detected default token color (.mtk1) →', color);
      }
    } catch (e) {
      console.warn('Power Mode: Failed to detect .mtk1 color', e);
    } finally {
      container.removeChild(tempSpan);
    }
  };

  // -----------------------------------------------------------------
  // Main useEffect – setup everything
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const container = editor.getDomNode();

    // Setup refs
    charWidthRef.current = editor.getOption(monaco.editor.EditorOption.fontInfo).typicalHalfwidthCharacterWidth;
    linesContentRef.current = container.querySelector('.lines-content');

    // Detect real default color (do it twice: now + after layout)
    detectDefaultColorFromTheme();
    const layoutHandler = editor.onDidLayoutChange(() => {
      detectDefaultColorFromTheme();
      layoutHandler.dispose();
    });
    disposablesRef.current.push(layoutHandler);

    // Create overlay for DOM particles
    if (enableParticles && !overlayRef.current) {
      const overlay = document.createElement('div');
      overlay.className = 'power-mode-overlay';
      overlay.style.position = 'absolute';
      overlay.style.inset = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '10';
      container.appendChild(overlay);
      overlayRef.current = overlay;
    }

    // KeyDown – predict color before insertion (for backspace)
    const onKeyDown = editor.onKeyDown((e) => {
      const pos = editor.getPosition();

      if (e.keyCode === monaco.KeyCode.Backspace && pos.column > 1) {
        const erasePos = { lineNumber: pos.lineNumber, column: pos.column - 1 };
        pendingEraseColorRef.current = getColorFromPosition(erasePos.lineNumber, erasePos.column);
        pendingErasePosRef.current = erasePos;
      }
    });
    disposablesRef.current.push(onKeyDown);

    // Main content change handler
    const onDidChange = editor.onDidChangeModelContent((e) => {
      e.changes.forEach((change) => {
        // === Typing a character ===
        if (change.text.length > 0 && change.rangeLength === 0) {
          triggerShake();

          const insertedPos = {
            lineNumber: change.range.startLineNumber,
            column: change.range.startColumn + change.text.length // point *after* inserted text
          };

          requestAnimationFrame(() => {
            const color = getColorFromPosition(insertedPos.lineNumber, insertedPos.column - 1); // actual char
            const isCorrect = color === 'rgb(0, 128, 0)'; // adjust if needed

            if (!requireCorrectColor || isCorrect) {
              const coord = editor.getScrolledVisiblePosition(insertedPos);
              if (coord && isFinite(coord.left) && isFinite(coord.top)) {
                addCanvasParticle(
                  coord.left + editor.getLayoutInfo().glyphMarginWidth,
                  coord.top + coord.height / 2,
                  color
                );
              }
            }
          });
        }

        // === Deletion (Backspace/Delete) ===
        else if (change.text === '' && change.rangeLength > 0) {
          triggerShake();

          if (pendingEraseColorRef.current && pendingErasePosRef.current) {
            const coord = editor.getScrolledVisiblePosition(pendingErasePosRef.current);
            if (coord && isFinite(coord.left) && isFinite(coord.top)) {
              addCanvasParticle(
                coord.left + editor.getLayoutInfo().glyphMarginWidth,
                coord.top + coord.height / 2,
                pendingEraseColorRef.current
              );
            }
            pendingEraseColorRef.current = null;
            pendingErasePosRef.current = null;
          }
        }
      });
    });

    disposablesRef.current.push(onDidChange);

    // Cleanup
    return () => {
      disposablesRef.current.forEach(d => d.dispose());
      disposablesRef.current = [];
      overlayRef.current?.remove();
      overlayRef.current = null;
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (linesContentRef.current) linesContentRef.current.style.transform = '';
    };
  }, [
    editorRef.current,
    monacoRef.current,
    enableParticles,
    enableShake,
    requireCorrectColor,
    currentLineRef,
    problemLines,
    onParticleAdd,
  ]);

  // Reset shake when disabled
  useEffect(() => {
    if (!enableShake && linesContentRef.current) {
      linesContentRef.current.style.transform = '';
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    }
  }, [enableShake]);

  return { addCanvasParticle };
}