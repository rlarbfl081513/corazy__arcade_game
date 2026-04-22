import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { getAccessToken } from '@/utils/storage';

/**
 * Relay WebSocket Hook (대기방)
 * - 메인 화면에서 방 목록 실시간 업데이트
 * - SockJS + Stomp 사용
 * - 연결 경로: /api/ws/relay
 * - 구독 토픽: /topic/rooms (방 목록 업데이트)
 *
 * WebSocket 메시지 형식:
 * {
 *   type: 'ROOM_LIST_UPDATE' | 'USER_JOINED' | 'USER_LEFT' | 'GAME_START' | ...,
 *   roomId: string | null,
 *   data: any
 * }
 */
export function useRelaySocket() {
  const stompClientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [roomListUpdate, setRoomListUpdate] = useState(null);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError('인증 토큰이 없습니다.');
      return;
    }

    const baseUrl = import.meta.env.VITE_SOCKET_URL;
    const wsPath = '/api/ws/relay';
    const socketUrl = `${baseUrl}${wsPath}?token=${accessToken}`;
    console.log('[RelaySocket] Connecting to:', socketUrl);

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
        console.log('[RelaySocket] Connected successfully');
        setConnected(true);
        setError(null);

        // 방 목록 실시간 업데이트 구독
        client.subscribe('/topic/rooms', (message) => {
          console.log('[RelaySocket] Received message:', message.body);

          try {
            const wsMessage = JSON.parse(message.body);

            // ROOM_LIST_UPDATE 타입 메시지 처리
            if (wsMessage.type === 'ROOM_LIST_UPDATE') {
              setRoomListUpdate({
                timestamp: Date.now(),
                data: wsMessage.data,
              });
            }
          } catch (err) {
            console.error('[RelaySocket] Failed to parse message:', err);
          }
        });

        stompClientRef.current = client;
      },
      (err) => {
        // 연결 실패 또는 에러
        console.error('[RelaySocket] Connection error:', err);
        console.error('[RelaySocket] 백엔드 WebSocket 설정을 확인하세요. SockJS 엔드포인트가 올바르게 설정되어 있는지 확인이 필요합니다.');
        setError(err?.message || 'WebSocket 연결 실패');
        setConnected(false);
      }
    );

    // cleanup: 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (stompClientRef.current) {
        console.log('[RelaySocket] Disconnecting...');
        stompClientRef.current.disconnect();
      }
    };
  }, []);

  return {
    connected,
    error,
    roomListUpdate,
    stompClient: stompClientRef.current
  };
}
