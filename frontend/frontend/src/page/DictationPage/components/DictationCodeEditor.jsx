import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Editor from '@monaco-editor/react';
import { constrainedEditor } from 'constrained-editor-plugin';
import useTypingSFX from '@/hooks/useTypingSFX';
import usePowerMode from '@/hooks/usePowerMode';
import useGameSettings from '@/hooks/useGameSettings';
import { useModalTempSettings } from '@/context/SettingsModalContext';

const DictationCodeEditor = forwardRef((
  {
    language,
    value,
    onChange,
    problemLines,
    onLineCompleted,
    onGameCompleted,
    onCurrentLineCorrect,
    onTypedCharsChange,
    enableParticles,
    enableShake,
  },
  ref
) => {

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const constrainedInstanceRef = useRef(null);
  const decorationsRef = useRef([]);
  const currentLineRef = useRef(2);
  const maxCorrectRef = useRef(0);
  const typedCharsRef = useRef(0);
  const gameCompletedRef = useRef(false);
  const { settings } = useGameSettings('dictation');
  const { settings: savedSettings } = useGameSettings();
  const { tempSettingsOverride } = useModalTempSettings();
  const effectiveSettings = tempSettingsOverride?.global ?? savedSettings;

  const numOfProblemCodeLines = problemLines.length;

  const { playTyping, playEnter } = useTypingSFX({
    volume: effectiveSettings.sfxVolume,
    enabled: effectiveSettings.sfx,
  });



  // ----------------------------------------------------
  // 1. Call the hook with the new STATE variables
  // ----------------------------------------------------
   // ----------------------------------------------------
   // usePowerMode
   // ----------------------------------------------------
 
  usePowerMode(editorRef, monacoRef, {
    enableParticles: enableParticles,
    enableShake: enableShake,
  });

  useImperativeHandle(ref, () => ({
    startTime: () => editorRef.current?.startTime,   // 없으면 null
  }));

  const lineCompleted = (correctCount) => {
    typedCharsRef.current += correctCount;
    onLineCompleted?.(correctCount);   // keep the parent UI (progress bar) happy
    onTypedCharsChange?.(typedCharsRef.current);
  };

  useEffect(() => {
  if (editorRef.current && monacoRef.current) {
    console.log('Editor ready - hook should run now');
  }
}, [editorRef.current, monacoRef.current]);

  const finishGame = (finalLineCorrect) => {
    if (gameCompletedRef.current)
      return;

    const start = editorRef.current?.startTime;
    const elapsedMs = start ? Date.now() - start : 0;

    // finalLineCorrect is the count of correct chars on the **last** line
    const totalTyped = typedCharsRef.current + finalLineCorrect;

    // Pass **only numbers** to the parent
    onGameCompleted?.(totalTyped, elapsedMs);
    gameCompletedRef.current = true;

    // Make editor read-only to prevent further changes
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: true });
    }
  };

  const reportCurrentCorrect = () => {
    if (gameCompletedRef.current)
      return;
    const model = editorRef.current.getModel();

    const user = model.getLineContent(currentLineRef.current);
    const prob = model.getLineContent(currentLineRef.current - 1);

    const userNoIndent = user.trimStart();
    const probNoIndent = prob.trimStart();

    let correct = 0;
    const limit = Math.min(userNoIndent.length, probNoIndent.length);
    for (let i = 0; i < limit; i++) {
      if (userNoIndent[i] === probNoIndent[i]) correct++;
      else break;
    }

    if (correct !== maxCorrectRef.current) {
      maxCorrectRef.current = correct;
      onCurrentLineCorrect?.(correct);
    }
    // Debug log: after updating maxCorrect
    // console.log('Total correct chars (after report):', typedCharsRef.current + maxCorrectRef.current);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    editor.updateOptions({
      smoothScrolling: true,
    });

    // --- 1. CAMERA CENTERING LOGIC ---
    const centerLayoutOnCursor = () => {
      const position = editor.getPosition();
      if (!position) return;

      // A. Vertical Center (Built-in)
      editor.revealPositionInCenter(position);

      // B. Horizontal Center (Manual Calculation)
      const currentScrollLeft = editor.getScrollLeft();
      const cursorOffset = editor.getOffsetForColumn(position.lineNumber, position.column);
      const layoutInfo = editor.getLayoutInfo();
      const editorWidth = layoutInfo.width;
      
      // Calculate where the scroll should be to put cursor in the middle
      const targetScrollLeft = cursorOffset - (editorWidth / 2);

      // Only scroll if the difference is significant to prevent jitter
      if (Math.abs(targetScrollLeft - currentScrollLeft) > 5) {
        editor.setScrollPosition({ scrollLeft: targetScrollLeft });
      }
    };
    // ---------------------------------

    const firstKeyListener = editor.onDidChangeModelContent(() => {
        if (!editor.startTime) {
          editor.startTime = Date.now();
        }
        firstKeyListener.dispose();   // run only once
      });

    // 에디터 초기 설정
    const model = editor.getModel();
    constrainedInstanceRef.current = constrainedEditor(monaco);
    constrainedInstanceRef.current.initializeIn(editor);
    constrainedInstanceRef.current.addRestrictionsTo(model, [
      {
        range: [currentLineRef.current, 1, currentLineRef.current, 1],
        allowMultiline: false,
        validate: (newValue, range) => {
          const problemLineNo = currentLineRef.current - 2;
          const characterLimitOfLine = problemLineNo >= 0 && problemLineNo < problemLines.length
                                     ? problemLines[problemLineNo].length
                                     : 0;
          return newValue.length <= characterLimitOfLine;
        },
      },
    ]);

    /*
     * 키 입력 이벤트 처리
     */
    editor.onKeyDown((e) => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyC;
      const isPaste = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV;
      const isCut = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyX;
      const isInsertCopy = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.Insert;
      const isInsertPaste = (e.shiftKey || e.metaKey) && e.keyCode === monaco.KeyCode.Insert;
      const isUndo = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyZ;
      const isFind = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyF;
      const isGoToDefinition = e.keyCode === monaco.KeyCode.F12;
      const isArrowKey = (e.keyCode === monaco.KeyCode.UpArrow || e.keyCode === monaco.KeyCode.DownArrow || e.keyCode === monaco.KeyCode.LeftArrow || e.keyCode === monaco.KeyCode.RightArrow);

      if (isCopy || isPaste || isCut || isInsertCopy || isInsertPaste || isUndo || isFind || isGoToDefinition || isArrowKey) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const model = editor.getModel();
      const currentUserLineNo = currentLineRef.current;
      const userCode = model.getLineContent(currentUserLineNo);

      // 엔터를 눌렀을 때
      if (e.keyCode === monaco.KeyCode.Enter) {
        e.preventDefault();
        e.stopPropagation();

        playEnter();

        if (gameCompletedRef.current) {
          return;
        }

        if (currentUserLineNo <= numOfProblemCodeLines + 1) {
          const prev = currentUserLineNo - 1;
          const next = currentUserLineNo + 1;
          const problemCodeLineToType = model.getLineContent(prev);

          if (userCode === problemCodeLineToType) {
            // Debug log: before completing line
            // console.log('Total correct chars (before line complete):', typedCharsRef.current + maxCorrectRef.current);

            if(next > numOfProblemCodeLines + 1){
              const finalCorrect = maxCorrectRef.current;
              lineCompleted(finalCorrect);
              finishGame(finalCorrect);
              // onGameCompleted?.(finalCorrect);
              return;
            }

            const finalCorrect = maxCorrectRef.current;
            lineCompleted(finalCorrect);

            maxCorrectRef.current = 0;

            const problemCodeNextLine = model.getLineContent(next);
            const leadingSpaceInTheNextProblemCodeLine = problemCodeNextLine.match(/^(\s*)/);
            const nextIndents = leadingSpaceInTheNextProblemCodeLine ? leadingSpaceInTheNextProblemCodeLine[0] : "";

            constrainedInstanceRef.current.removeRestrictionsIn(model);
            model.applyEdits([
              {
                range: new monaco.Range(currentUserLineNo, 1, currentUserLineNo, model.getLineMaxColumn(currentUserLineNo)),
                text: problemCodeNextLine,
              },
              {
                range: new monaco.Range(next, 1 + nextIndents.length, next, model.getLineMaxColumn(next)),
                text: '',
              },
            ]);

            onChange?.(model.getValue());
            
            currentLineRef.current = next;
            constrainedInstanceRef.current.addRestrictionsTo(model, [
              {
                range: [next, 1 + nextIndents.length, next, 1],
                allowMultiline: false,
                validate: (newValue) => {
                  const problemLineNo = currentLineRef.current - 2;
                  const characterLimitOfLine = problemLineNo >= 0 && problemLineNo < problemLines.length
                                            ? problemLines[problemLineNo].length
                                            : 0;
                  return newValue.length <= characterLimitOfLine;
                },
              },
            ]);
            editor.setPosition({ lineNumber: next, column: 1 });
            editor.focus();
            updateDecorations(editor, monaco);

            // Debug log: after completing line
            // console.log('Total correct chars (after line complete):', typedCharsRef.current + maxCorrectRef.current);
          }
          else {
            const editorDom = editor.getDomNode();
            if (editorDom) {
              editorDom.classList.add('shake-editor');
              setTimeout(() => {
                editorDom.classList.remove('shake-editor');
              }, 300);
            }
          }
        }
      }

      // CLOSING BRACKET HANDLING (only intercept if it's a closing char)
        let isClosing = false;
        let typedChar = '';
        if (e.keyCode === monaco.KeyCode.Digit0 && e.shiftKey) {
          typedChar = ')';
          isClosing = true;
        } else if (e.keyCode === monaco.KeyCode.BracketRight) {
          typedChar = e.shiftKey ? '}' : ']';
          isClosing = true;
        } else if (e.keyCode === monaco.KeyCode.Period && e.shiftKey) {
          typedChar = '>';
          isClosing = true;
        } else if (e.keyCode === monaco.KeyCode.Quote && e.shiftKey) {
          typedChar = '"';
          isClosing = true;
        }

        if (isClosing) {
          e.preventDefault();
          e.stopPropagation();

        const pos = editor.getPosition();
        const problemLineNo = currentLineRef.current - 2;
        const characterLimitOfLine = problemLineNo >= 0 && problemLineNo < problemLines.length ? problemLines[problemLineNo].length : 0;
        if(pos.column <= characterLimitOfLine){
            model.applyEdits([{
            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
            text: typedChar,
          }]);

          editor.setPosition({
            lineNumber: pos.lineNumber,
            column: pos.column + 1,
          });
        }
        updateDecorations(editor, monaco);
        reportCurrentCorrect();
      }
    });

    // Force cursor to END of current line on ANY change (mouse, arrows, etc.)
    editor.onDidChangeCursorPosition((e) => {
      const curLine = currentLineRef.current;
      const lineContent = model.getLineContent(curLine);
      const endColumn = lineContent.length + 1;  // After last char, before ghost

      // If not exactly at current line + end column → snap back
      if (e.position.lineNumber !== curLine || e.position.column !== endColumn) {
        editor.setPosition({ lineNumber: curLine, column: endColumn });
        return;
      }
      centerLayoutOnCursor();
    });

    // On content change: apply colors/decorations
    editor.onDidChangeModelContent(() => {
      playTyping();

      const fullValue = model.getValue();
      onChange?.(fullValue);
      updateDecorations(editor, monaco);
      reportCurrentCorrect();

      // Debug log: total correct chars so far
      // console.log('Total correct chars (on content change):', typedCharsRef.current + maxCorrectRef.current);
    });

    updateDecorations(editor, monaco);
  };

  /* 데코레이션
     - 사용자의 입력 코드 문자마다 정오답 클래스를 부여해서 CSS 스타일을 입힌다.
  */
  const updateDecorations = (editor, monaco) => {
    if (gameCompletedRef.current)
      return;

    const model = editor.getModel();

    // [ADD THIS SAFETY CHECK]

    const newDecorations = [];

    const userCode = model.getLineContent(currentLineRef.current);
    const problemCodeLine = currentLineRef.current <= numOfProblemCodeLines + 1 ? model.getLineContent(currentLineRef.current - 1) : '';

    const minLength = Math.min(userCode.length, problemCodeLine.length);
    for (let i = 0; i < minLength; i++) {
      const className = userCode[i] === problemCodeLine[i] ? 'correct-char' : 'incorrect-char';
      newDecorations.push({
        range: new monaco.Range(currentLineRef.current, i + 1, currentLineRef.current, i + 2),
        options: { inlineClassName: className },
      });
    }

    if (userCode.length > problemCodeLine.length) {
      newDecorations.push({
        range: new monaco.Range(currentLineRef.current, problemCodeLine.length + 1, currentLineRef.current, userCode.length + 1),
        options: { inlineClassName: 'incorrect-char' },
      });
    }
    else {
      const remaining = problemCodeLine.substring(userCode.length);
      newDecorations.push({
        range: new monaco.Range(currentLineRef.current, userCode.length + 1, currentLineRef.current, userCode.length + 1),
        options: {
          after: {
            contentText: remaining,
            inlineClassName: 'ghost-text',
          },
          isWholeLine: false,
        },
      });
    }

    newDecorations.push({
      range: new monaco.Range(currentLineRef.current, 1, currentLineRef.current, 1),
      options: {
        isWholeLine: true,
        className: 'current-line-background',
      }
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      value={value}
      onMount={handleEditorDidMount}
      onChange={onChange}
      theme="transparent-dark"
      options={{
        acceptSuggestionOnEnter: 'off',
        autoClosingBrackets: 'never',
        autoClosingComments: 'never',
        autoClosingDelete: 'never',
        autoClosingOvertype: 'never',
        autoClosingQuotes: 'never',
        autoIndent: 'none',
        autoIndentOnPaste: false,
        autoIndentOnPasteWithinString: false,
        autoSurround: 'never',
        bracketPairColorization: { enabled: true },
        codeLens: false,
        contextmenu: false,
        cursorBlinking: 'smooth',
        cursorHeight: 20,
        cursorStyle: 'line',
        disableLayerHinting: true,
        disableMonospaceOptimization: false,
        dragAndDrop: false,
        dropIntoEditor: false,
        effectiveEditContextEnabled: false,
        emptySelectionClipboard: false,
        folding: false,
        fontFamily: "'Consolas', 'Courier New', monospace",
        fontSize: 18,
        formatOnPaste: false,
        formatOnType: false,
        hideCursorInOverviewRuler: true,
        hover: { enabled: false, },
        glyphMargin: false,
        guides: { bracketPairs: false, bracketPairsHorizontal: false, indentation: false, },
        inlayHints: false,
        inlineCompletionsAccessibilityVerbose: false,
        inlineSuggest: { enabled: false, },
        insertSpaces: true,
        letterSpacing: 0,
        lightbulb: { enabled: false, },
        lineHeight: 24,
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        link: false,
        matchBrackets: 'never',
        minimap: { enabled: false, },
        occurrencesHighlight: false,
        overviewRulerBorder: false,
        overviewRulerLanes: 0,
        parameterHints: { enabled: false, },
        pasteAs: { enabled: false, },
        peekWidgetDefaultFocus: "editor",
        quickSuggestions: false,
        readOnly: false,
        renderLineHighlight: 'none',
        renderWhitespace: 'none',
        scrollbar: { vertical: 'hidden', horizontal: 'hidden', },
        scrollBeyondLastLine: false,
        selectionHighlight: false,
        showUnused: false,
        snippetSuggestions: "none",
        stickyScroll: { enabled: false, },
        suggest: { filterGraceful: false, localityBonus: false, preview: false, selectionMode: "never", shareSuggestSelections: false, showClasses: false, showColors: false, showConstants: false, showConstructors: false, showDeprecated: false, showEnumMembers: false, showEnums: false, showEvents: false, showFields: false, showFiles: false, showFolders: false, showFunctions: false, showIcons: false, showInlineDetails: false, showInterfaces: false, showIssues: false, showKeywords: false, showMethods: false, showModules: false, showOperators: false, showProperties: false, showReferences: false, showSnippets: false, showStatusBar: false, showStructs: false, showTypeParameters: false, showUnits: false, showUsers: false, showValues: false, showVariables: false, showWords: false, },
        suggestOnTriggerCharacters: false,
        tabCompletion: 'off',
        tabSize: 2,
        trimWhitespaceOnDelete: false,
        unicodeHighlight: { ambiguousCharacters: false, includeComments: false, includeStrings: false, invisibleCharacters: false, nonBasicASCII: false },
        validate: false,
        wordBasedSuggestions: false,
        wordHighlight: false,
        wordWrap: 'off',
      }}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme('transparent-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#00000000',
          },
        });

        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true,
        });

      }}
    />
  );
});

export default DictationCodeEditor;