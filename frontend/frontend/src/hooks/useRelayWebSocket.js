import { useEffect } from 'react';
import useGameStore from '@/stores/gameStore';

export const useRelayWebSocket = () => {
  const { connect, disconnect, sendCodeUpdate } = useGameStore();

  useEffect(() => {
    // 컴포넌트가 마운트될 때 웹소켓 연결을 시도합니다.
    // 연결에 필요한 정보(roomId, myUserId)는 store 내에서 자체적으로 확인합니다.
    connect();

    // 컴포넌트가 언마운트될 때 웹소켓 연결을 해제하지 않습니다.
    // 연결 해제는 store의 reset 액션 등에서 명시적으로 처리합니다.
    return () => {};
  }, [connect]);

  // 이 훅은 컴포넌트에서 메시지 전송 함수를 사용할 수 있도록 반환합니다.
  // sendCodeUpdate 함수는 이제 store에서 직접 가져옵니다.
  return { sendCodeUpdate };
};
