// useTypewriter.js (별도 파일로 만들 경우)
import { useState, useEffect } from 'react';

/**
 * 텍스트 타이핑 효과를 위한 커스텀 훅
 * @param {string} fullText - 타이핑할 전체 텍스트
 * @param {number} speed - 타이핑 속도 (ms)
 * @returns {{displayText: string, isTypingComplete: boolean}}
 */
function useTypewriter(fullText, speed = 50) {
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    setDisplayText(''); // 텍스트가 변경되면 초기화
    setIsTypingComplete(false); // 완료 상태 초기화
    if (!fullText) return;

    let index = 0;
    const timer = setInterval(() => {
      // 한 글자씩 추가
      setDisplayText(fullText.substring(0, index + 1));
      index++;

      // 타이핑이 완료되면
      if (index >= fullText.length) {
        clearInterval(timer);
        setIsTypingComplete(true); // 완료 상태로 변경
      }
    }, speed);

    // 컴포넌트 언마운트 시 또는 fullText가 바뀔 때 타이머 정리
    return () => clearInterval(timer);
  }, [fullText, speed]); // fullText나 speed가 바뀌면 효과 재시작

  return { displayText, isTypingComplete };
}

export default useTypewriter;
