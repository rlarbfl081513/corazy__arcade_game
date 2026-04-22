import React, { useLayoutEffect, useRef } from 'react';
// KaTeX의 auto-render 모듈을 가져옵니다.
import renderMathInElement from 'katex/dist/contrib/auto-render';
// KaTeX CSS 스타일을 가져옵니다.
import 'katex/dist/katex.min.css';

function KatexRenderer({ text }) {
  const containerRef = useRef(null);

  // useLayoutEffect: DOM 업데이트 직후, 브라우저 페인트 전에 동기적으로 실행
  useLayoutEffect(() => {
    if (containerRef.current && text) {
      // 먼저 텍스트 콘텐츠를 설정
      containerRef.current.textContent = text;

      // 그 다음 KaTeX 렌더링 실행
      try {
        renderMathInElement(containerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },   // 블록 수식
            { left: '\\[', right: '\\]', display: true }, // 블록 수식
            { left: '$', right: '$', display: false },    // 인라인 수식
            { left: '\\(', right: '\\)', display: false } // 인라인 수식
          ],
          throwOnError: false
        });
      } catch (error) {
        console.error('KaTeX 렌더링 에러:', error);
      }
    }
  }, [text]);

  return <div ref={containerRef} style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }} />;
}

export default KatexRenderer;