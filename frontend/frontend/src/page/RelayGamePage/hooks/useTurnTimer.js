import { useEffect, useState } from 'react';

/**
 * 턴 타이머 Hook
 * - 1분(60초) 카운트다운
 * - 시간 만료 시 자동 턴 완료
 *
 * @param {Object} params
 * @param {boolean} params.isGameInProgress - 게임 진행 중 여부
 * @param {number} params.currentTurn - 현재 턴 번호 (턴 변경 감지용)
 * @param {boolean} params.isMyTurn - 현재 내 턴인지 여부
 * @param {Function} params.onTimeUp - 시간 만료 시 콜백 (내 턴일 때만 실행)
 * @param {number} params.duration - 타이머 시간 (초), 기본값 60초
 * @returns {Object} { remainingTime, formattedTime, isActive, isWarning }
 */
export function useTurnTimer({ isGameInProgress, currentTurn, isMyTurn, onTimeUp, duration = 60 }) {
  const [remainingTime, setRemainingTime] = useState(duration);
  const [isActive, setIsActive] = useState(false);

  // 게임 진행 중이면 타이머 활성화, 턴이 바뀌면 리셋
  useEffect(() => {
    if (isGameInProgress) {
      setRemainingTime(duration);
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [isGameInProgress, currentTurn, duration]);

  // 타이머 로직 (매 초마다 1씩 감소)
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  // 시간 만료 처리 (remainingTime === 0일 때)
  useEffect(() => {
    if (remainingTime === 0 && isActive) {
      setIsActive(false);

      // onTimeUp은 내 턴일 때만 실행
      if (isMyTurn && onTimeUp) {
        onTimeUp();
      }
    }
  }, [remainingTime, isActive, isMyTurn, onTimeUp]);

  // MM:SS 포맷
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
    isActive,
    isWarning: remainingTime <= 30, // 30초 이하 경고
  };
}
