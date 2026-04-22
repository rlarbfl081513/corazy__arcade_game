import { useState, useEffect, useRef, useCallback } from 'react';

const IDLE_THRESHOLD = 3000; // 3초 이상 입력 없으면 유휴 상태로 간주

/**
 * 게임 진행 중 사용자 활동(총 키 입력, 총 유휴 시간)을 추적하는 훅
 * @param {object} editor - Monaco Editor 인스턴스
 * @param {boolean} isGameActive - 게임이 진행 중인지 여부 (e.g., gameState === 'PLAYING')
 */
const useActivityTracker = (editor, isGameActive) => {
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [totalIdleTime, setTotalIdleTime] = useState(0);

  const lastInputTime = useRef(Date.now());
  const idleTimer = useRef(null);
  const idleStartTime = useRef(null);

  // 유휴 시간 계산 로직
  const measureIdleTime = useCallback(() => {
    try {
      if (idleStartTime.current) {
        const idleDuration = (Date.now() - idleStartTime.current) / 1000;
        setTotalIdleTime(prev => prev + idleDuration);
      }
      idleStartTime.current = null;
    } catch (error) {
      console.error('[useActivityTracker] measureIdleTime 에러:', error);
    }
  }, []);

  // 키 입력 추적
  useEffect(() => {
    if (!editor || !isGameActive) {
      // 게임이 비활성화되면 모든 타이머 정리
      if (idleTimer.current) clearTimeout(idleTimer.current);
      measureIdleTime();
      return;
    }

    try {
      const model = editor.getModel();
      if (!model) {
        console.warn('[useActivityTracker] Editor model is null');
        return;
      }

      const disposable = model.onDidChangeContent(() => {
        // 키 입력 발생
        setTotalKeystrokes(prev => prev + 1);
        lastInputTime.current = Date.now();

        // 진행 중이던 유휴 시간 측정 종료
        if (idleTimer.current) clearTimeout(idleTimer.current);
        measureIdleTime();

        // 새로운 유휴 시간 측정 타이머 설정
        idleTimer.current = setTimeout(() => {
          idleStartTime.current = Date.now();
        }, IDLE_THRESHOLD);
      });

      return () => {
        try {
          disposable.dispose();
          if (idleTimer.current) clearTimeout(idleTimer.current);
          measureIdleTime(); // 컴포넌트 언마운트 시 마지막 유휴 시간 측정
        } catch (error) {
          console.error('[useActivityTracker] cleanup 에러:', error);
        }
      };
    } catch (error) {
      console.error('[useActivityTracker] setup 에러:', error);
    }
  }, [editor, isGameActive, measureIdleTime]);

  // 게임 시작 시 상태 초기화
  useEffect(() => {
    if (isGameActive) {
      setTotalKeystrokes(0);
      setTotalIdleTime(0);
      lastInputTime.current = Date.now();
      idleStartTime.current = Date.now(); // 게임 시작부터 유휴 시간 측정 시작
    } else {
      // 게임 종료 시 마지막 유휴 시간 측정
      measureIdleTime();
    }
  }, [isGameActive, measureIdleTime]);

  // 집계된 데이터를 반환하는 함수
  const getAggregatedData = useCallback(() => {
    try {
      // 마지막 유휴 시간 강제 측정
      measureIdleTime();
      return {
        totalKeystrokes,
        totalIdleTime: Math.round(totalIdleTime),
      };
    } catch (error) {
      console.error('[useActivityTracker] getAggregatedData 에러:', error);
      // 에러 발생 시 기본값 반환
      return {
        totalKeystrokes: 0,
        totalIdleTime: 0,
      };
    }
  }, [totalKeystrokes, totalIdleTime, measureIdleTime]);

  return { getAggregatedData };
};

export default useActivityTracker;
