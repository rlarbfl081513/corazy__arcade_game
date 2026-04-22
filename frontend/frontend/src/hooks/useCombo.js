// src/hooks/useCombo.js
import { useEffect, useRef } from 'react';

/**
 * Combo system for Power Mode.
 *
 * @param {React.MutableRefObject} editorRef
 * @param {React.MutableRefObject} monacoRef
 * @param {Object} options
 *   enabled          – true/false (global toggle)
 *   mode             – 'normal' | 'volcano' (volcano resets on error)
 *   requireCorrect   – only count green chars (dictation)
 *   onStatsUpdate    – (stats) => void  { maxCombo, incorrectCount }
 *   comboTimeoutMs   – reset after inactivity
 */
export default function useCombo(
  editorRef,
  monacoRef,
  {
    enabled = true,
    mode = 'normal',           // 'normal' | 'volcano'
    requireCorrect = false,
    onStatsUpdate = null,
    comboTimeoutMs = 1500,
  } = {}
) {
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const timeoutRef = useRef(null);

  // Helper: get rendered color of a character
  const getColorAtPosition = (lineNumber, column) => {
    const editor = editorRef.current;
    if (!editor) return '#ffffff';

    const container = editor.getDomNode();
    const lineElem = container.querySelector(
      `.view-lines > .view-line:nth-child(${lineNumber})`
    );
    if (!lineElem) return '#ffffff';

    const tokens = lineElem.querySelectorAll('span');
    let curCol = 1;
    for (const span of tokens) {
      const len = span.textContent.length;
      if (column >= curCol && column < curCol + len) {
        return getComputedStyle(span).color || '#ffffff';
      }
      curCol += len;
    }
    return '#ffffff';
  };

  // Reset combo (update max)
  const resetCombo = () => {
    if (comboRef.current > maxComboRef.current) {
      maxComboRef.current = comboRef.current;
    }
    comboRef.current = 0;
  };

  // Increment or handle error
  const handleChar = (isCorrect) => {
    if (!enabled) return;

    if (isCorrect) {
      comboRef.current += 1;
      if (comboRef.current > maxComboRef.current) {
        maxComboRef.current = comboRef.current;
      }
    } else {
      incorrectCountRef.current += 1;
      if (mode === 'volcano') {
        resetCombo();
      }
    }

    // Reset inactivity timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(resetCombo, comboTimeoutMs);
  };

  // Main effect – runs when editor + monaco are ready
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !enabled) return;

    const model = editor.getModel();
    const disposables = [];

    // Listen to content changes (typing)
    const onChange = editor.onDidChangeModelContent((e) => {
      e.changes.forEach((change) => {
        // Only care about **insertions** (typing)
        if (change.text.length > 0 && change.rangeLength === 0) {
          const pos = {
            lineNumber: change.range.startLineNumber,
            column: change.range.startColumn,
          };

          // Wait for DOM to render the color
          setTimeout(() => {
            const color = getColorAtPosition(pos.lineNumber, pos.column);
            const isCorrect = color === 'rgb(0, 128, 0)'; // green

            if (!requireCorrect || isCorrect) {
              handleChar(isCorrect);
            } else {
              handleChar(false); // incorrect
            }
          }, 0);
        }
      });
    });
    disposables.push(onChange);

    // Cleanup
    return () => {
      disposables.forEach((d) => d.dispose());
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Final stats on unmount
      if (onStatsUpdate) {
        onStatsUpdate({
          maxCombo: maxComboRef.current,
          incorrectCount: incorrectCountRef.current,
        });
      }
    };
  }, [
    editorRef,
    monacoRef,
    enabled,
    mode,
    requireCorrect,
    comboTimeoutMs,
    onStatsUpdate,
  ]);

  // Optional: return current combo for UI
  return {
    currentCombo: comboRef.current,
    maxCombo: maxComboRef.current,
  };
}