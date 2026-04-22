import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { getAccessToken, getUserInfo } from '@/utils/storage';

/**
 * Room WebSocket Hook (방 내부 실시간 업데이트)
 * - 특정 방의 참가자 입장/퇴장 실시간 업데이트
 * - 채팅 메시지 송수신
 * - SockJS + Stomp 사용
 * - 연결 경로: /api/ws/relay
 * - 구독 토픽: /topic/rooms/{roomId} (방 내부 모든 이벤트)
 * - 발행 경로: /app/rooms/{roomId}/chat (채팅 메시지 전송)
 *
 * WebSocket 메시지 형식:
 * {
 *   type: 'CHAT_MESSAGE' | 'USER_JOINED' | 'USER_LEFT' | 'GAME_START' | 'READY' | 'TURN_CHANGE' | ...,
 *   roomId: string,
 *   data: any
 * }
 */

export function useRoomSocket({ roomId }) {
  const stompClientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [roomUpdate, setRoomUpdate] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // 재연결 관련 상태
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      setError('인증 토큰이 없습니다.');
      return;
    }

    const baseUrl = import.meta.env.VITE_SOCKET_URL;
    const wsPath = '/api/ws/relay';
    const socketUrl = `${baseUrl}${wsPath}?token=${accessToken}`;
    console.log('[RoomSocket] Connecting to:', socketUrl, 'roomId:', roomId);

    // SockJS 소켓 생성
    const socket = new SockJS(socketUrl);

    // Stomp 클라이언트 생성
    const client = Stomp.over(socket);

    // Stomp 디버그 로그 (개발 시에만 활성화)
    client.debug = (str) => {
      if (import.meta.env.DEV) {
        console.log('[Stomp]', str);
      }
    };

    // Stomp 연결 (헤더는 빈 객체로)
    client.connect(
      {},
      () => {
        // 연결 성공
        console.log('[RoomSocket] Connected successfully');
        setConnected(true);
        setError(null);

        // 특정 방 실시간 업데이트 구독
        client.subscribe(`/topic/rooms/${roomId}`, (message) => {
          try {
            const wsMessage = JSON.parse(message.body);
            console.log(`[WebSocket] 📨 메시지 수신:`, {
              type: wsMessage.type,
              roomId: wsMessage.roomId,
              data: wsMessage.data
            });

            // 메시지 타입별 처리
            if (wsMessage.type === 'CHAT_MESSAGE') {
              // 채팅 메시지 처리
              setChatMessages((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  user: wsMessage.data.nickname || wsMessage.data.userId,
                  message: wsMessage.data.message,
                  timestamp: wsMessage.data.timestamp || Date.now(),
                },
              ]);
            } else {
              // 다른 방 이벤트 처리 (USER_JOINED, USER_LEFT, READY_STATUS_CHANGE, GAME_START 등)
              setRoomUpdate({
                timestamp: Date.now(),
                type: wsMessage.type,
                data: wsMessage.data,
                roomId: wsMessage.roomId,
              });
            }
          } catch (err) {
            console.error('[WebSocket] ❌ 메시지 파싱 실패:', err);
            console.error('[WebSocket] Raw message:', message.body);
          }
        });

        stompClientRef.current = client;
      },
      (err) => {
        // 연결 실패 또는 에러
        console.error('[RoomSocket] Connection error:', err);
        console.error('[RoomSocket] 백엔드 WebSocket 설정을 확인하세요. SockJS 엔드포인트가 올바르게 설정되어 있는지 확인이 필요합니다.');
        setError(err?.message || 'WebSocket 연결 실패');
        setConnected(false);

        // 지수 백오프 재연결 (1s → 2s → 4s → 8s, 최대 5회)
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 8000);
          reconnectAttemptsRef.current += 1;
          setIsReconnecting(true);

          console.warn(`[RoomSocket] 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts} (${delay}ms 후)`);

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[RoomSocket] 재연결 시도 중...');
            // TODO: 재연결 로직 구현 (현재는 페이지 새로고침 필요)
            setIsReconnecting(false);
          }, delay);
        } else {
          console.error('[RoomSocket] 최대 재연결 시도 횟수 초과');
          setIsReconnecting(false);
        }
      }
    );

    // cleanup: 컴포넌트 언마운트 시 연결 해제
    return () => {
      // 재연결 타임아웃 정리
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (stompClientRef.current) {
        console.log('[RoomSocket] Disconnecting...');
        stompClientRef.current.disconnect();
      }
    };
  }, [roomId]);

  /**
   * 채팅 메시지 전송
   * @param {string} message - 전송할 메시지
   */
  const sendChatMessage = (message) => {
    if (!stompClientRef.current || !connected) {
      console.error('[RoomSocket] WebSocket is not connected');
      return;
    }

    const userInfo = getUserInfo();
    if (!userInfo) {
      console.error('[RoomSocket] User info not found');
      return;
    }

    const chatRequest = {
      userId: userInfo.userId,
      nickname: userInfo.nickname,
      message: message,
    };

    console.log('[RoomSocket] Sending chat message:', chatRequest);

    try {
      stompClientRef.current.send(
        `/app/rooms/${roomId}/chat`,
        {},
        JSON.stringify(chatRequest)
      );
    } catch (err) {
      console.error('[RoomSocket] Failed to send message:', err);
    }
  };

  return {
    connected,
    error,
    roomUpdate,
    chatMessages,
    sendChatMessage,
    isReconnecting,  // 재연결 중 여부
    stompClient: stompClientRef.current
  };
}
