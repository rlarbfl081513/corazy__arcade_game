import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '@/utils/storage';

/**
 * Minimal Socket.IO chat hook
 * - Connects to path '/api/chat' with JWT token authentication
 * - Listens to 'chat message' and normalizes for ChatSidebar
 * - Emits 'chat message' with { roomId, message } (userId는 서버가 token에서 추출)
 */
export function useChatSocket({ roomId }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      setError('인증 토큰이 없습니다.');
      return;
    }

    // Socket.IO는 HTTP/HTTPS URL 사용 (자동으로 ws/wss로 업그레이드)
    const baseUrl = import.meta.env.VITE_SOCKET_URL;
    console.log('[WebSocket] Connecting to:', baseUrl, 'with roomId:', roomId);

    const socket = io(baseUrl, {
      path: '/api/chat',
      query: { roomId: String(roomId),
        token: accessToken // JWT 토큰을 쿼리 파라미터로 전달
       },
      // transports 제거 - polling -> websocket 순서로 자동 업그레이드 (안정적)
    });

    socketRef.current = socket;

    const onConnect = () => {
      console.log('[WebSocket] Connected to server with ID:', socket.id);
      setConnected(true);
      setError(null);

      // 백엔드가 joinRoom을 기대하는 경우를 위해 emit
      socket.emit('joinRoom', { roomId });
    };

    const onDisconnect = () => {
      console.log('[WebSocket] Disconnected from server');
      setConnected(false);
    };

    const onConnectError = (err) => {
      console.error('[WebSocket] Connection error:', err);
      setError(err?.message || 'connect_error');
      setConnected(false);
    };

    const onChatMessage = (payload) => {
      console.log('[WebSocket] Received message:', payload);
      // Server payload example: { userId, nickname, message }
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const userLabel = payload?.nickname || `User${payload?.userId ?? ''}`;
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          { id, user: userLabel, message: payload?.message ?? '' },
        ];
        // 최신 100개 메시지만 유지 (오래된 메시지 자동 삭제)
        return newMessages.slice(-100);
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('chat message', onChatMessage);
    // 'message' 이벤트도 리스닝 (백엔드가 사용할 수 있음)
    socket.on('message', onChatMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('chat message', onChatMessage);
      socket.off('message', onChatMessage);
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = (text) => {
    const trimmed = (text ?? '').trim();
    if (!trimmed || !socketRef.current) return;
    socketRef.current.emit('chat message', {
      roomId,
      message: trimmed,
    });
  };

  return { connected, error, messages, sendMessage };
}
