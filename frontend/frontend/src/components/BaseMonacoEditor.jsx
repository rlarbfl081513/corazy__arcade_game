import React from 'react';
import Editor from '@monaco-editor/react';

/**
 * 범용 모나코 에디터 컴포넌트
 * (어떤 프로젝트에서든 재사용 가능)
 */
function BaseMonacoEditor(props) {
  const {
    value,
    onChange,
    language = 'javascript', // 기본값
    theme = 'vs-dark',       // 기본값
    options,
    onMount,
    beforeMount,
  } = props;

  // 기본 에디터 옵션
  const defaultOptions = {
    fontFamily: "'Consolas', 'Courier New', monospace",
    fontSize: 18,
    lineHeight: 24,
    tabSize: 2,
    insertSpaces: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    scrollbar: {
        vertical: 'auto',
        horizontal: 'auto'
    }

  };

  // 부모로부터 받은 options와 기본 옵션을 병합
  const finalOptions = {
    ...defaultOptions,
    ...options, // 부모가 전달한 options가 우선 적용
  };

  return (
    <Editor
      height="100%" // 부모 div의 크기를 따르도록 설정
      width="100%"
      language={language}
      theme={theme}
      value={value}
      options={finalOptions}
      onChange={onChange}
      onMount={onMount}
      beforeMount={beforeMount}
    />
  );
}

export default BaseMonacoEditor;