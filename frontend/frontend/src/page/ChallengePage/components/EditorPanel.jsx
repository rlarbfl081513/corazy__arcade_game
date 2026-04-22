import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import BaseMonacoEditor from "@/components/BaseMonacoEditor";
import { useTheme } from "@/components/ThemeProvider";
import runIcon from "@/assets/icon/run.png";
import trashIcon from "@/assets/icon/trash.png";
import saveIcon from "@/assets/icon/save.png";
import "./EditorPanel.css";
import useTypingSFX from '@/hooks/useTypingSFX';
import usePowerMode from '@/hooks/usePowerMode';
import useGameSettings from '@/hooks/useGameSettings';
import { useModalTempSettings } from '@/context/SettingsModalContext';

// 에디터 상태값 받기
export const SAVE_STATUS = {
  UNSAVED: "unsaved",
  SAVING: "saving",
  SAVED: "saved",
};

// 언어별 기본 코드 템플릿
export const DEFAULT_CODE_TEMPLATES = {
  java: `class Solution {
    public static void main(String[] args) {

    }
}`,
  cpp: `#include <iostream>

int main() {

    return 0;
}`,
  c: `#include <stdio.h>

int main() {

    return 0;
}`,
  javascript: ``,
  python: ``
};

const LANGUAGE_LOADERS = {
  python: () =>
    import("monaco-editor/esm/vs/basic-languages/python/python.contribution"),
  java: () =>
    import("monaco-editor/esm/vs/basic-languages/java/java.contribution"),
  cpp: () =>
    import("monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution"),
};

const loadedLanguages = new Map();

async function ensureLanguageSupport(monacoInstance, languageId) {
  if (!languageId || !monacoInstance) {
    return;
  }

  const normalizedId = languageId.toLowerCase();
  const alreadyRegistered = monacoInstance.languages
    .getLanguages()
    .some(({ id }) => id === normalizedId);

  if (alreadyRegistered) {
    return;
  }

  const loader = LANGUAGE_LOADERS[normalizedId];

  if (!loader) {
    return;
  }

  if (!loadedLanguages.has(normalizedId)) {
    loadedLanguages.set(
      normalizedId,
      loader().catch((error) => {
        console.error(`모나코 언어 모듈 로딩 실패 (${normalizedId})`, error);
        loadedLanguages.delete(normalizedId);
        throw error;
      })
    );
  }

  await loadedLanguages.get(normalizedId);
}

function EditorPanel({
  language,
  onMount,
  onTestSubmit,
  handleResetEditor,
  onSaveCode,
  saveStatus,
  // ===== 릴레이 게임 전용 props =====
  isReadOnly = false, // 읽기 전용 모드 (내 턴 아닐 때)
  sharedCode = null, // 공유 코드 (릴레이 게임 시 동기화)
  onCodeChange = null, // 코드 변경 콜백 (릴레이 게임 시 WebSocket 동기화용)
  currentEditor = null, // 현재 작성 중인 사용자 닉네임
  isRelayMode = false, // 릴레이 게임 모드 여부
  onFinalSubmit = null, // 최종 제출 콜백 (릴레이 게임 전용)
  enableParticles,
  enableShake,
}) {
  // 언어 설정: 릴레이 모드에서는 fallback 없음, 일반 모드는 javascript fallback
  const editorLanguage = isRelayMode ? language : (language || "javascript");

  // console.log('[EditorPanel] 🎨 초기화 시작:', {
  //   isRelayMode,
  //   providedLanguage: language,
  //   editorLanguage,
  //   hasSharedCode: sharedCode !== null,
  //   sharedCodeLength: sharedCode?.length || 0,
  // });

  // 릴레이 모드에서 언어가 없으면 경고 (roomData 로딩 중)
  if (!editorLanguage && isRelayMode) {
    console.warn('[EditorPanel] Language not provided in relay mode, waiting for room data...');
  }

  // 테마
  const { theme } = useTheme();
  const monacoTheme = theme === "dark" ? "vs-dark" : "vs";

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isInitialMount = useRef(true);
  // State to force re-render after editor mounts (fixes timing bug)
  const [isEditorMounted, setIsEditorMounted] = useState(false);

    // Determine game mode for settings (challenge or relay)
  const gameMode = isRelayMode ? 'relay' : 'challenge';
  const { settings } = useGameSettings(gameMode);
  const { settings: savedSettings } = useGameSettings();
  const { tempSettingsOverride } = useModalTempSettings();
  const effectiveSettings = tempSettingsOverride?.global ?? savedSettings;

  const { playTyping, playEnter } = useTypingSFX({
    volume: effectiveSettings.sfxVolume,
    enabled: effectiveSettings.sfx,
  });

  // ----------------------------------------------------
  // usePowerMode
  // ----------------------------------------------------

  usePowerMode(editorRef, monacoRef, {
    enableParticles: enableParticles,
    enableShake: enableShake,
  });

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      console.log('PowerMode: Refs set! Particles:', enableParticles, 'Shake:', enableShake);
    }
  }, [editorRef.current, monacoRef.current, enableParticles, enableShake]);

  const applyLanguageToEditor = useCallback(async (targetLanguage) => {
    const editorInstance = editorRef.current;
    const monacoInstance = monacoRef.current;

    if (!editorInstance || !monacoInstance || !targetLanguage) {
      return;
    }

    await ensureLanguageSupport(monacoInstance, targetLanguage);

    const model = editorInstance.getModel();

    if (model) {
      monacoInstance.editor.setModelLanguage(
        model,
        targetLanguage.toLowerCase()
      );
    }
  }, []);

  const handleEditorMount = useCallback(
    (editorInstance, monacoInstance) => {
      console.log('[EditorPanel] 📦 에디터 마운트 시작:', {
        editorLanguage,
        isInitialMount: isInitialMount.current,
        hasEditorInstance: !!editorInstance,
      });

      editorRef.current = editorInstance;
      monacoRef.current = monacoInstance;

      applyLanguageToEditor(editorLanguage).catch((error) => {
        console.error("언어 적용 중 오류", error);
      });

      // 초기 마운트 시 기본 코드 설정
      if (isInitialMount.current) {
        const defaultCode = DEFAULT_CODE_TEMPLATES[editorLanguage] || "";
        console.log('[EditorPanel] 📝 기본 템플릿 설정:', {
          language: editorLanguage,
          hasTemplate: !!defaultCode,
          templateLength: defaultCode.length,
          template: defaultCode,
        });
        editorInstance.setValue(defaultCode);
        isInitialMount.current = false;
        console.log('[EditorPanel] ✅ 템플릿 설정 완료');
      } else {
        console.log('[EditorPanel] ⏭️ 초기 마운트 아님, 템플릿 스킵');
      }

      // Add SFX listeners
      editorInstance.onKeyDown((e) => {
        if (e.keyCode === monacoInstance.KeyCode.Enter) {
          playEnter();
        }
      });

      editorInstance.onDidChangeModelContent(() => {
        playTyping();
      });

      if (typeof onMount === "function") {
        onMount(editorInstance, monacoInstance);
      }
      setIsEditorMounted(true);
    },
    [applyLanguageToEditor, editorLanguage, onMount, playEnter, playTyping]
  );

  useEffect(() => {
    applyLanguageToEditor(editorLanguage).catch((error) => {
      console.error("언어 적용 중 오류", error);
    });
  }, [applyLanguageToEditor, editorLanguage]);

  // 공유 코드 동기화 (릴레이 게임)
  useEffect(() => {
    if (sharedCode !== null && editorRef.current) {
      const currentCode = editorRef.current.getValue();
      if (currentCode !== sharedCode) {
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(sharedCode);
        // 커서 위치 복원 (가능한 경우)
        if (position) {
          editorRef.current.setPosition(position);
        }
      }
    }
  }, [sharedCode]);

  // 코드 변경 이벤트 핸들러 (릴레이 게임)
  const handleEditorChange = useCallback(
    (value) => {
      if (onCodeChange && !isReadOnly) {
        const position = editorRef.current?.getPosition();
        console.log('[EditorPanel] 📝 코드 변경 감지 - 동기화 시작');
        onCodeChange(value, position);
      }
    },
    [onCodeChange, isReadOnly]
  );

  // 에디터 수정/저장 상태에 따라 렌더링하는 함수
  const renderSaveCode = () => {
    switch (saveStatus) {
      case SAVE_STATUS.UNSAVED:
        return <span className="save-status unsaved">수정됨</span>;
      case SAVE_STATUS.SAVING:
        return <span className="save-status saving">저장 중</span>;
      case SAVE_STATUS.SAVED:
        return <span className="save-status saved">저장됨</span>;
      default:
        return null;
    }
  };

  // [수정] 로컬 스토리지에서 내 '닉네임' 가져오기
    const myNickname = useMemo(() => {
      try {
        const userInfoString = localStorage.getItem('userInfo');
        if (!userInfoString) return null;
        
        const userInfo = JSON.parse(userInfoString);
        
        // ★ 중요: userInfo 안에 저장된 닉네임 키값을 사용해야 합니다.
        // 예: userInfo.nickname, userInfo.name, userInfo.userName 등
        return userInfo.nickname; 
      } catch (e) {
        console.error("localStorage 'userInfo' 파싱 실패", e);
        return null;
      }
    }, []);

    // [수정] 이름 대 이름으로 비교
    const isMyTurn = currentEditor && myNickname && (currentEditor === myNickname);
    
  
  return (
    <>
      <div className="editor-section">
        <div className="title-box">
          <div className="title">
            Code
            {currentEditor && (
              <span className="current-editor-label">
                {" - "}
                {/* 내 닉네임과 현재 작성자 닉네임 비교 */}
                {isMyTurn ? "내가 작성할 차례!" : `${currentEditor}님이 작성 중`}
              </span>
            )}
          </div>
          <div className="btn-box">
            {isRelayMode ? (
              // 릴레이 모드: 테스트 & 제출 버튼만
              <>
                <button className="btn test-submit-btn" onClick={onTestSubmit}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>테스트</span>
                </button>
                <button className="btn real-submit-btn" onClick={onFinalSubmit}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>제출</span>
                </button>
              </>
            ) : (
              // 일반 모드: 기존 버튼들
              <>
                <div className="btn-wrapper">
                  <div className="save-code-message">{renderSaveCode()}</div>
                  <button className="btn test-submit-btn" onClick={onSaveCode}>
                    <img src={saveIcon} className="btn-icon" />
                  </button>
                </div>
                <button className="btn test-submit-btn" onClick={onTestSubmit}>
                  <img src={runIcon} className="btn-icon" />
                </button>
                <button className="btn code-reset" onClick={handleResetEditor}>
                  <img src={trashIcon} className="btn-icon" />
                </button>
              </>
            )}
          </div>
        </div>
        {/* 읽기 전용 배너 (릴레이 게임) */}
        {isReadOnly && currentEditor && (
          <div className="editor-readonly-banner">
            <span>🔒 {currentEditor}님이 작성 중입니다...</span>
          </div>
        )}
        <div className="editor">
          <BaseMonacoEditor
            language={editorLanguage}
            theme={monacoTheme}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
            options={{
              fontSize: 14,
              readOnly: isReadOnly,
            }}
          />
        </div>
      </div>
    </>
  );
}

export default EditorPanel;
