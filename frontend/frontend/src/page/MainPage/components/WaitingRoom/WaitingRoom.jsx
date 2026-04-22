import { useEffect, useState } from 'react';
import { getRoomList, joinRoom } from '@/api/relayApi';
import { getUserInfo } from '@/utils/storage';
import RoomCard from './RoomCard';
import './WaitingRoom.css';
import resetIcon from '@/assets/icon/reset.png';

/**
 * 대기방 컴포넌트
 * - 방 목록 조회 및 실시간 업데이트
 * - WebSocket으로 방 상태 변경 감지
 */
function WaitingRoom({ onJoinRoom, roomListUpdate, relayConnected }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 현재 사용자 정보
  const userInfo = getUserInfo();
  const currentUserId = userInfo?.userId;

  // 초기 방 목록 조회
  useEffect(() => {
    loadRooms();
  }, []);

  // WebSocket으로 방 목록 업데이트 수신 시 자동 새로고침
  useEffect(() => {
    if (roomListUpdate?.data) {
      console.log('[WaitingRoom] Room list updated via WebSocket:', roomListUpdate.data);
      // WebSocket으로 받은 방 목록으로 직접 업데이트
      setRooms(roomListUpdate.data);
    }
  }, [roomListUpdate]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRoomList();

      if (response.success) {
        setRooms(response.data || []);
      } else {
        setError(response.message || '방 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('[WaitingRoom] Failed to load rooms:', err);
      setError(err.message || '방 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRooms();
  };

  // 방 클릭 시 입장 시도
  const handleRoomClick = async (room) => {
    try {
      console.log('[WaitingRoom] Joining room:', room.roomId);
      const response = await joinRoom(room.roomId);

      if (response.success) {
        console.log('[WaitingRoom] Successfully joined room:', response.data);
        // RoomPage로 이동 (roomId 전달)
        if (onJoinRoom && response.data.roomId) {
          onJoinRoom(response.data.roomId);
        }
      } else {
        alert(response.message || '방 입장에 실패했습니다.');
      }
    } catch (err) {
      console.error('[WaitingRoom] Failed to join room:', err);
      alert(err.message || '방 입장에 실패했습니다.');
    }
  };

  // 방 목록 화면 표시 (기본)
  return (
    <div className="waiting-room-container">
      {/* 상단 영역 */}
      <div className="title-btn-box">
        <div className="rooms-title-box">Waiting Rooms</div>
        <div className="top-buttons">
          <button className="btn refresh" onClick={handleRefresh}>
            <img src={resetIcon} />
          </button>
         
          {/* {relayConnected && (
            <span className="websocket-status connected">● 실시간 연결</span>
          )} */}
        </div>
      </div>

      {/* 방 목록 영역 */}
      <div className="rooms-section">

        {loading && (
          <div className="loading-message">방 목록을 불러오는 중...</div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className="msg-box">
              <div className="empty-message">
                생성된 방이 없습니다.
                <br />
                새로운 방을 만들어보세요!
              </div>
          </div>
          
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="rooms-list">
            {rooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                onClick={() => handleRoomClick(room)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
