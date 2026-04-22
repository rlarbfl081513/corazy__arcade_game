import { useEffect, useState, useCallback, useRef } from 'react';
import { useRoomSocket } from '@/page/MainPage/hooks/useRoomSocket';
import { getUserInfo } from '@/utils/storage';
import { updateCode } from '@/api/relayApi';

/**
 * 게임 전용 WebSocket Hook
 * - useRoomSocket을 활용하여 게임 이벤트 처리
 * - 턴 관리, 코드 동기화 담당
 *
 * WebSocket 메시지 타입:
 * - GAME_START: 게임 시작
 * - TURN_CHANGE: 턴 변경 (currentTurnUserId, currentTurnNickname 포함)
 * - CODE_UPDATE: 코드 동기화 (백엔드가 PUT /code API 호출 후 브로드캐스트)
 * - GAME_END: 게임 종료 (TODO: 제출 성공 시 처리)
 *
 * HTTP API:
 * - PUT /api/relay/rooms/{roomId}/code: 코드 업데이트 (내 턴일 때만)
 */

// 디바운스 유틸리티
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function useGameSocket({ roomId, initialGameData = null }) {
  // 현재 사용자 정보
  const userInfo = getUserInfo();
  const myUserId = userInfo?.userId;

  // 게임 상태 관리 (initialGameData로 초기화)
  const [gameState, setGameState] = useState(() => {
    const currentTurnUserId = initialGameData?.currentTurnUserId;
    const isMyTurn = currentTurnUserId === myUserId;

    return {
      status: initialGameData?.status || 'WAITING',
      currentTurn: initialGameData?.currentTurn || 0,
      currentTurnUserId: currentTurnUserId || null,
      currentTurnNickname: initialGameData?.currentTurnNickname || '',
      isMyTurn: isMyTurn,
      problemNumber: initialGameData?.problemNumber || null,
      remainingSeconds: 60,  // ⭐ 서버 기반 타이머 추가
    };
  });

  // 공유 코드 상태
  const [sharedCode, setSharedCode] = useState(null);
  const [lastCodeUpdate, setLastCodeUpdate] = useState(null);

  // 게임 종료/제출 결과 상태
  const [gameEndData, setGameEndData] = useState(null);
  const [submitResultData, setSubmitResultData] = useState(null);

  // 기존 useRoomSocket 활용 (채팅 + 게임 이벤트)
  const { connected, roomUpdate, chatMessages, sendChatMessage, stompClient } = useRoomSocket({
    roomId,
  });

  // WebSocket 메시지 처리
  useEffect(() => {
    if (!roomUpdate) return;

    switch (roomUpdate.type) {
      case 'STRATEGY_START':  // ⭐ 전략 구상 시간 시작
        handleStrategyStart(roomUpdate.data);
        break;
      case 'STRATEGY_END':  // ⭐ 전략 구상 시간 종료
        handleStrategyEnd(roomUpdate.data);
        break;
      case 'GAME_START':
        handleGameStart(roomUpdate.data);
        break;
      case 'TURN_CHANGE':
        handleTurnChange(roomUpdate.data);
        break;
      case 'TIMER_UPDATE':  // ⭐ 추가
        handleTimerUpdate(roomUpdate.data);
        break;
      case 'TURN_TIMEOUT':  // 턴 타임아웃 처리
        handleTurnTimeout(roomUpdate.data);
        break;
      case 'CODE_UPDATE':
        handleCodeUpdate(roomUpdate.data);
        break;
      case 'SUBMIT_RESULT':
        handleSubmitResult(roomUpdate.data);
        break;
      case 'GAME_END':
        handleGameEnd(roomUpdate.data);
        break;
      default:
        break;
    }
  }, [roomUpdate, myUserId]);

  // ⭐ 전략 구상 시간 시작 처리
  const handleStrategyStart = (data) => {
    console.log('[WebSocket] 🧠 STRATEGY_START 수신:', {
      status: data.status,
      problemNumber: data.problemNumber,
      problemTitle: data.problemTitle,
      strategyDuration: data.turnDurationSeconds
    });

    setGameState((prev) => ({
      ...prev,
      status: 'STRATEGY_PHASE',
      problemNumber: data.problemNumber || null,
      remainingSeconds: data.turnDurationSeconds || 30,  // 전략 구상 시간 (테스트용 30초)
    }));

    console.log('[WebSocket] 전략 구상 단계 진입: 3분간 문제 파악 시간');
  };

  // ⭐ 전략 구상 시간 종료 처리
  const handleStrategyEnd = (data) => {
    console.log('[WebSocket] 🧠 STRATEGY_END 수신:', data);

    // 전략 구상 종료, 곧 GAME_START가 올 예정
    setGameState((prev) => ({
      ...prev,
      status: 'STRATEGY_PHASE_END',
    }));

    console.log('[WebSocket] 전략 구상 종료, 게임 시작 대기 중...');
  };

  // 게임 시작 처리
  const handleGameStart = (data) => {
    console.log('[WebSocket] ✅ GAME_START 수신:', {
      currentTurn: data.currentTurn,
      currentTurnUserId: data.currentTurnUserId,
      currentTurnNickname: data.currentTurnNickname,
      problemNumber: data.problemNumber
    });

    setGameState((prev) => ({
      ...prev,
      status: 'IN_PROGRESS',
      currentTurn: data.currentTurn || 1,
      currentTurnUserId: data.currentTurnUserId || null,
      currentTurnNickname: data.currentTurnNickname || '',
      isMyTurn: data.currentTurnUserId === myUserId,
      problemNumber: data.problemNumber || null,
      remainingSeconds: 60,  // ⭐ 타이머 초기화
    }));

    // 게임 시작 시 코드 초기화 (또는 서버에서 받은 초기 코드 설정)
    if (data.initialCode) {
      setSharedCode(data.initialCode);
    }
  };

  // 턴 변경 처리
  const handleTurnChange = (data) => {
    console.log('[WebSocket] 🔄 TURN_CHANGE 수신:', {
      currentTurn: data.currentTurn,
      currentTurnUserId: data.currentTurnUserId,
      currentTurnNickname: data.currentTurnNickname
    });

    setGameState((prev) => ({
      ...prev,
      status: data.status || 'IN_PROGRESS',
      currentTurn: data.currentTurn || prev.currentTurn + 1,
      currentTurnUserId: data.currentTurnUserId,
      currentTurnNickname: data.currentTurnNickname || '',
      isMyTurn: data.currentTurnUserId === myUserId,
      remainingSeconds: 60,  // ⭐ 턴 변경 시 타이머 리셋
    }));
  };

  // 타이머 업데이트 처리 (서버에서 1초마다 전송)
  const handleTimerUpdate = (data) => {
    setGameState((prev) => ({
      ...prev,
      remainingSeconds: data.remainingSeconds || 0,
    }));
  };

  // 턴 타임아웃 처리
  const handleTurnTimeout = (data) => {
    console.log('[WebSocket] ⏰ TURN_TIMEOUT 수신:', {
      currentTurn: data.currentTurn,
      currentTurnUserId: data.currentTurnUserId,
    });

    // 타이머를 0으로 설정
    setGameState((prev) => ({
      ...prev,
      remainingSeconds: 0,
    }));

    // TODO: 타임아웃 알림 UI (이미 개발된 기존 알림 사용)
    // 기존에 개발된 타임아웃 알림이 있으므로 여기서는 주석 처리
    // console.warn('⏰ 턴 시간이 초과되었습니다! 다음 턴으로 자동 전환됩니다.');
  };

  // 코드 업데이트 처리
  const handleCodeUpdate = (data) => {
    console.log('[WebSocket] 📝 CODE_UPDATE 수신:', { nickname: data.nickname, userId: data.userId });

    // 자신이 보낸 메시지는 무시 (내가 타이핑한 코드의 브로드캐스트는 무시)
    if (data.userId === myUserId) {
      console.log('[WebSocket] 📝 CODE_UPDATE 무시: 내가 보낸 메시지');
      return;
    }

    setSharedCode(data.code || '');
    setLastCodeUpdate({
      userId: data.userId,
      nickname: data.nickname,
      timestamp: Date.now(),
      cursorPosition: data.cursorPosition,
    });
  };

  // 제출 결과 처리 (오답)
  const handleSubmitResult = (data) => {
    console.log('[WebSocket] ❌ SUBMIT_RESULT 수신:', data);

    // 오답일 때 0.5초간 모달 표시
    setSubmitResultData(data);

    // 0.5초 후 자동으로 모달 닫기
    setTimeout(() => {
      setSubmitResultData(null);
    }, 500);
  };

  // 게임 종료 처리 (정답)
  const handleGameEnd = (data) => {
    console.log('[WebSocket] 🏁 GAME_END 수신:', data);

    setGameState((prev) => ({
      ...prev,
      status: 'COMPLETED',
      isMyTurn: false,
    }));

    // 게임 종료 데이터 저장 (모달 표시용)
    setGameEndData(data);
  };

  // 코드 동기화 전송 (Debounced) - HTTP API 사용 + 재시도 로직
  const syncCodeRef = useRef(null);

  useEffect(() => {
    syncCodeRef.current = debounce(async (code, cursorPosition) => {
      if (!gameState.isMyTurn) {
        console.warn('[API] 코드 동기화 스킵: 내 턴 아님');
        return;
      }

      console.log('[API] 📤 코드 업데이트 API 호출:', {
        nickname: userInfo?.nickname,
        codeLength: code?.length || 0,
        endpoint: `PUT /api/relay/rooms/${roomId}/code`
      });

      // 재시도 로직 (최대 3회)
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries) {
        try {
          const response = await updateCode(roomId, code);
          console.log('[API] ✅ 코드 업데이트 성공:', response);
          return; // 성공 시 종료
        } catch (error) {
          retryCount++;
          if (retryCount > maxRetries) {
            console.error('[API] ❌ 코드 업데이트 최종 실패 (3회 재시도):', error);
          } else {
            console.warn(`[API] 코드 업데이트 실패 - 재시도 ${retryCount}/${maxRetries}`, error);
            // 재시도 전 대기 (0.5초)
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }, 300);
  }, [roomId, gameState.isMyTurn, userInfo]);

  const syncCode = useCallback(
    (code, cursorPosition) => {
      if (syncCodeRef.current) {
        syncCodeRef.current(code, cursorPosition);
      }
    },
    []
  );

  return {
    connected,
    gameState,
    sharedCode,
    lastCodeUpdate,
    chatMessages,
    sendChatMessage,
    syncCode,
    gameEndData,
    submitResultData,
  };
}
