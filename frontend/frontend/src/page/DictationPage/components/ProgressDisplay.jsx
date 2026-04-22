// src/component/ProgressDisplay.jsx

import React, {useMemo} from 'react'
import './ProgressDisplay.css';

import happyChar from '../assets/char/normal.png'
import peaceChar from '../assets/char/freakout.png'
import angryChar from '../assets/char/angry.png'

/**
 * PRO 수치에 따라 캐릭터 이미지와 애니메이션을 보여주는 컴포넌트
 * @param {object} props
 * @param {number} props.progress - 현재 정확도 (0-100)
 */

/**
 * PRO 수치에 따라 캐릭터 이미지와 애니메이션을 보여주는 컴포넌트
 * @param {object} props
 * @param {number} props.progress - 현재 정확도 (0-100)
 */
function ProgressDisplay({ progress }) {
  
  // progress 값에 따라 현재 티어(tier), 이미지(imageSrc)를 결정합니다.
  const { tier, imageSrc } = useMemo(() => {
    if (progress >= 67) { // 67-100%
      return { tier: 'good', imageSrc: angryChar };
    }
    if (progress >= 34 && progress <= 66) { // 34-66%
      return { tier: 'okay', imageSrc: peaceChar };
    }
    // 0-33% (33% 이하)
    return { tier: 'bad', imageSrc: happyChar }; 

  }, [progress]); // progress가 바뀔 때만 재계산

  // 티어에 맞는 애니메이션 오버레이를 반환합니다.
  const getAnimationOverlay = () => {
    switch (tier) {
      case 'good':
        return (
          // 활활 애니메이션 (CSS 클래스 적용)
          <div className="animation-overlay hearts-animation">
            <span>🔥</span>
            <span style={{ animationDelay: '0.2s', left: '60%' }}>⚡</span>
            <span style={{ animationDelay: '0.4s', left: '20%' }}>🔥</span>
            <span style={{ animationDelay: '0.6s', left: '75%' }}>⚡</span>
          </div>
        );
      case 'bad':
        return (
          // 샤방샤방 애니메이션 (CSS 클래스 적용)
          <div className="animation-overlay skulls-animation">
            <span>✨</span>
            <span style={{ animationDelay: '0s', left: '45%', top: '40%' }}>⭐</span>
            <span style={{ animationDelay: '0.2s', left: '60%', top: '30%' }}>✨</span>
            <span style={{ animationDelay: '0.4s', left: '20%', top: '60%' }}>⭐</span>
            <span style={{ animationDelay: '0.6s', left: '75%', top: '40%' }}>✨</span>
          </div>
        );
      default: // 'okay' 티어 등은 애니메이션 없음
        return null;
    }
  };

  return (
    <div className="progress-display-container">
      <div className="character-image-wrapper">
        <img src={imageSrc} alt={`Progress: ${tier}`} className="character-image" />
        {/* 애니메이션 오버레이 렌더링 */}
        {getAnimationOverlay()}
      </div>
    </div>
  );
}


export default ProgressDisplay; // 컴포넌트를 export
