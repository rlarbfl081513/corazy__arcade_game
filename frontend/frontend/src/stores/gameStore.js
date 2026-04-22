import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from '@/utils/storage';
import { getRoomDetail } from '@/api/relayApi';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

const useGameStore = create(
  immer((set, get) => ({
    // =================================================================
    // 1. 상태 (State)
    // =================================================================
    
    // 웹소켓 클라이언트 인스턴스
    stompClient: null,
    isConnected: false,

    // 현재 클라이언트의 사용자 정보
    myUserId: null,
    myNickname: null,

    // 방 및 게임 정보
    roomId: null,
    roomInfo: null,
    participants: [],
    gameState: 'LOBBY',
    
    // 게임 진행 정보
    isMyTurn: false,
    currentTurnUserId: null,
    turnTimeLeft: 60,
    code: '',
    submissionResult: null,
    gameEndData: null, // 게임 종료 데이터
    isAnalysisComplete: false, // 기여도 분석 완료 여부

    // 이모지 상태
    activeEmojiByUser: {}, // { userId: emojiId } 형태

    // 핑 상태
    activePings: [], // [{ id, userId, x, y }] 형태

    // 채팅 메시지 상태
    chatMessages: [], // [{ id, user, message, timestamp }] 형태

    // =================================================================
    // 2. 액션 (Actions)
    // =================================================================

    // --- 웹소켓 연결 관리 ---
    connect: () => {
      if (get().stompClient || get().isConnected) {
        console.log('이미 연결되어 있거나 연결 중입니다.');
        return;
      }

      const { roomId, myUserId } = get();
      if (!roomId || !myUserId) {
        console.error('WebSocket 연결 실패: roomId 또는 myUserId가 없습니다.');
        return;
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        console.error('WebSocket 연결 실패: 인증 토큰이 없습니다.');
        return;
      }

      const socket = new SockJS(`${SOCKET_URL}/api/ws/relay?token=${accessToken}`);
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        debug: (str) => console.log(new Date(), str),
        onConnect: () => {
          set({ isConnected: true });
          console.log('✅ STOMP 연결 성공');

          client.subscribe(`/topic/rooms/${roomId}`, (message) => {
            const event = JSON.parse(message.body);
            get().handleEvent(event);
          });
        },
        onStompError: (frame) => {
          console.error('STOMP 에러:', frame.headers['message'], frame.body);
          set({ isConnected: false, stompClient: null });
        },
        onWebSocketError: (error) => {
          console.error('WebSocket 에러:', error);
          set({ isConnected: false, stompClient: null });
        },
        onDisconnect: () => {
          set({ isConnected: false, stompClient: null });
          console.log('⏹️ STOMP 연결 해제');
        }
      });

      client.activate();
      set({ stompClient: client });
    },

    disconnect: () => {
      const { stompClient } = get();
      if (stompClient) {
        stompClient.deactivate();
      }
    },

    // --- 메시지 전송 ---
    sendCodeUpdate: (code, cursorPosition) => {
      const { stompClient, roomId, myUserId, myNickname } = get();
      if (stompClient && stompClient.connected) {
        const payload = { userId: myUserId, nickname: myNickname, code, cursorPosition };
        stompClient.publish({
          destination: `/app/rooms/${roomId}/code/sync`,
          body: JSON.stringify(payload),
        });
      }
    },

    sendEmoji: (emojiId) => {
      const { stompClient, roomId, myUserId } = get();
      if (stompClient && stompClient.connected) {
        const payload = { userId: myUserId, emojiId };
        stompClient.publish({
          destination: `/app/rooms/${roomId}/emoji`,
          body: JSON.stringify(payload),
        });
        console.log('📤 이모지 전송:', payload);
      }
    },

    sendPing: (xRatio, yRatio) => {
      const { stompClient, roomId, myUserId } = get();
      if (stompClient && stompClient.connected) {
        const payload = { userId: myUserId, xratio: xRatio, yratio: yRatio };
        stompClient.publish({
          destination: `/app/rooms/${roomId}/ping`,
          body: JSON.stringify(payload),
        });
        console.log('📤 핑 전송:', payload);
      }
    },

    sendActivityData: (activityData) => {
      const { stompClient, roomId } = get();
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: `/app/rooms/${roomId}/activity`,
          body: JSON.stringify(activityData),
        });
        console.log('📤 활동 데이터 전송:', activityData);
      }
    },

    sendChatMessage: (message) => {
      const { stompClient, roomId, myUserId, myNickname } = get();
      if (stompClient && stompClient.connected) {
        const payload = { userId: myUserId, nickname: myNickname, message };
        stompClient.publish({
          destination: `/app/rooms/${roomId}/chat`,
          body: JSON.stringify(payload),
        });
        console.log('📤 채팅 메시지 전송:', payload);
      }
    },

    // --- 기본 정보 설정 ---
    setMyInfo: ({ userId, nickname }) => set({ myUserId: userId, myNickname: nickname }),
    setRoomId: (id) => set({ roomId: id }),

    // --- WebSocket 이벤트 처리 ---
    handleEvent: async (event) => {
      console.log('📥 WebSocket 이벤트 수신:', event);
      switch (event.type) {
        case 'USER_JOINED':
        case 'USER_LEFT':
        case 'READY_STATUS_CHANGE':
          try {
            if (event.roomId) {
              const response = await getRoomDetail(event.roomId);
              if (response.success) {
                get().updateRoomState(response.data);
              }
            }
          } catch (error) {
            console.error("Failed to fetch room details after event:", error);
          }
          break;
        case 'STRATEGY_START':
          // 전략 구상 시간 시작
          console.log('[gameStore] STRATEGY_START 이벤트 수신, gameState를 STRATEGY_PHASE로 변경', event.data);
          set((state) => {
            state.gameState = 'STRATEGY_PHASE';
            state.turnTimeLeft = event.data.turnDurationSeconds || 180;
            // 문제 정보 업데이트
            if (event.data.problemNumber && state.roomInfo) {
              state.roomInfo.problemNumber = event.data.problemNumber;
              state.roomInfo.problemTitle = event.data.problemTitle;
            }
          });
          break;
        case 'STRATEGY_TIMER_UPDATE':
          // 전략 구상 시간 타이머 업데이트 (매초)
          console.log('[gameStore] STRATEGY_TIMER_UPDATE 이벤트 수신, remainingSeconds:', event.data.remainingSeconds);
          set((state) => {
            state.turnTimeLeft = event.data.remainingSeconds;
          });
          break;
        case 'STRATEGY_END':
          // 전략 구상 시간 종료
          console.log('[gameStore] STRATEGY_END 이벤트 수신');
          break;
        case 'GAME_START':
          get().handleGameStart(event.data);
          break;
        case 'TURN_CHANGE':
          get().handleTurnChange(event.data);
          break;
        case 'TIMER_UPDATE':
          // 게임 턴 타이머 업데이트 (매초)
          get().handleTimeSync(event.data);
          break;
        case 'CODE_UPDATE':
          get().updateCode(event.data);
          break;
        case 'SUBMIT_RESULT':
          get().handleSubmissionResult(event.data);
          break;
        case 'GAME_END':
          get().handleGameEnd(event.data);
          break;
        case 'ANALYSIS_COMPLETE':
          get().handleAnalysisComplete(event.data);
          break;
        case 'EMOJI_REACTION':
          get().handleEmojiReaction(event.data);
          break;
        case 'PING':
          get().handlePing(event.data);
          break;
        case 'CHAT_MESSAGE':
          get().handleChatMessage(event.data);
          break;
        default:
          console.warn('알 수 없는 이벤트 타입:', event.type);
      }
    },

    // --- 상태 변경 로직 (내부 호출용) ---
    updateRoomState: (roomData) => set((state) => {
      state.roomInfo = roomData;
      state.participants = roomData.participants || [];
      // 게임이 이미 종료된 경우 gameState를 변경하지 않음 (모달 유지)
      if (state.gameState !== 'FINISHED') {
        state.gameState = roomData.status || 'WAITING';
      }
      state.code = roomData.currentCode || '';
      state.currentTurnUserId = roomData.currentTurnUserId;
      state.isMyTurn = state.myUserId === roomData.currentTurnUserId;
    }),

    handleGameStart: (gameData) => set((state) => {
      state.gameState = 'PLAYING';
      state.currentTurnUserId = gameData.currentTurnUserId;
      state.isMyTurn = state.myUserId === gameData.currentTurnUserId;
      state.turnTimeLeft = gameData.turnDurationSeconds || 60;

      // 게임 시작 시 받은 정보로 roomInfo 객체를 새로 만들어 업데이트
      state.roomInfo = {
        ...(state.roomInfo || {}),
        problemNumber: gameData.problemNumber,
        problemTitle: gameData.problemTitle,
        status: 'IN_PROGRESS',
        currentTurnUserId: gameData.currentTurnUserId, // 첫 턴 유저 ID도 roomInfo에 반영
        currentTurn: 0, // 첫 턴은 항상 0
      };
    }),

    handleTurnChange: (turnData) => set((state) => {
      state.currentTurnUserId = turnData.currentTurnUserId;
      state.isMyTurn = state.myUserId === turnData.currentTurnUserId;
      state.turnTimeLeft = turnData.turnDurationSeconds || 60;

      // roomInfo 객체를 새로 만들어 상태 변경을 감지하도록 함
      if (state.roomInfo) {
        state.roomInfo = {
          ...state.roomInfo,
          currentTurnUserId: turnData.currentTurnUserId,
          currentTurn: turnData.currentTurn,
        };
      }
    }),
    
    handleTimeSync: (timeData) => set((state) => {
      // 백엔드(remainingSeconds)와 프론트엔드(timeLeft) 필드명 불일치 해결
      state.turnTimeLeft = timeData.remainingSeconds ?? timeData.timeLeft;
    }),

    // 로컬 타이머를 위한 시간 감소 액션
    decrementTimeLeft: () => set((state) => {
      if (state.turnTimeLeft > 0) {
        state.turnTimeLeft -= 1;
      }
    }),

    updateCode: (codeData) => set((state) => {
      if (state.myUserId !== codeData.userId) {
        state.code = codeData.code;
      }
    }),
    
    setMyCode: (newCode) => set({ code: newCode }),

    handleSubmissionResult: (resultData) => set({ submissionResult: resultData }),

    // 제출 결과 모달을 닫기 위한 액션
    clearSubmissionResult: () => set({ submissionResult: null }),

    handleGameEnd: (endData) => set({
      gameState: 'FINISHED',
      isMyTurn: false,
      gameEndData: endData,
      isAnalysisComplete: false // 게임 종료 시 분석 완료 플래그 초기화
    }),

    handleAnalysisComplete: (analysisData) => {
      console.log('📊 [gameStore] ANALYSIS_COMPLETE 이벤트 처리 - 기여도 분석 완료', analysisData);
      set({
        isAnalysisComplete: true
      });
    },

    handleEmojiReaction: (emojiData) => set((state) => {
      console.log('📥 이모지 수신:', emojiData);
      state.activeEmojiByUser[emojiData.userId] = emojiData.emojiId;

      // 3초 후 이모지 제거
      setTimeout(() => {
        set((state) => {
          delete state.activeEmojiByUser[emojiData.userId];
        });
      }, 3000);
    }),

    handlePing: (pingData) => set((state) => {
      console.log('📥 핑 수신:', pingData);

      // 화면 크기에 맞게 절대 좌표 계산
      const x = pingData.xratio * window.innerWidth;
      const y = pingData.yratio * window.innerHeight;

      const ping = {
        id: Date.now() + Math.random(),
        userId: pingData.userId,
        x,
        y,
      };

      state.activePings.push(ping);

      // 3초 후 핑 제거
      setTimeout(() => {
        set((state) => {
          state.activePings = state.activePings.filter(p => p.id !== ping.id);
        });
      }, 3000);
    }),

    handleChatMessage: (chatData) => set((state) => {
      console.log('📥 채팅 메시지 수신:', chatData);

      const newMessage = {
        id: `${Date.now()}-${Math.random()}`,
        user: chatData.nickname || chatData.userId,
        message: chatData.message,
        timestamp: chatData.timestamp || Date.now(),
      };

      state.chatMessages.push(newMessage);

      // 최근 100개 메시지만 유지
      if (state.chatMessages.length > 100) {
        state.chatMessages = state.chatMessages.slice(-100);
      }
    }),

    // --- 초기화 ---
    reset: () => {
      get().disconnect();
      set({
        stompClient: null,
        isConnected: false,
        myUserId: null,
        myNickname: null,
        roomId: null,
        roomInfo: null,
        participants: [],
        gameState: 'LOBBY',
        isMyTurn: false,
        currentTurnUserId: null,
        turnTimeLeft: 60,
        code: '',
        submissionResult: null,
        gameEndData: null,
        isAnalysisComplete: false,
        activeEmojiByUser: {},
        activePings: [],
        chatMessages: [],
      });
    }
  }))
);

export default useGameStore;
