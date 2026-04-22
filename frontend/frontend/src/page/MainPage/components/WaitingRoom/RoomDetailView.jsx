import { useEffect, useState } from 'react';
import { getRoomDetail, leaveRoom, startGame } from '@/api/relayApi';
import { getRandomProblem, getLanguages } from '@/api/problemApi';
// TODO: 백엔드 WebSocket 설정 완료 후 활성화
// import { useRoomSocket } from '@/page/MainPage/hooks/useRoomSocket';
import './RoomDetailView.css';

/**
 * 방 상세 화면 (게임 대기방)
 * - 참가자 목록 표시
 * - 방장 표시
 * - 나가기 버튼
 * - 게임 시작 버튼 (방장만)
 */
function RoomDetailView({ roomId, onLeave, currentUserId }) {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageMap, setLanguageMap] = useState({}); // 언어 이름 → ID 매핑

  // TODO: 백엔드 WebSocket 설정 완료 후 활성화
  // WebSocket 연결 (방 실시간 업데이트)
  // const { connected, roomUpdate } = useRoomSocket({ roomId });

  // 언어 목록 조회 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const languages = await getLanguages();
        // { "Java": 2, "Python": 1, "Javascript": 3, "C++": 4 } 형태로 변환
        const map = {};
        languages.forEach(lang => {
          map[lang.language] = lang.id;
        });
        setLanguageMap(map);
      } catch (err) {
        console.error('[RoomDetailView] Failed to load languages:', err);
      }
    };
    loadLanguages();
  }, []);

  // 방 정보 조회
  useEffect(() => {
    loadRoomDetail();
  }, [roomId]);

  // TODO: 백엔드 WebSocket 설정 완료 후 활성화
  // WebSocket으로 방 업데이트 수신 시 자동 새로고침
  /*
  useEffect(() => {
    if (roomUpdate) {
      console.log('[RoomDetailView] Room updated via WebSocket:', roomUpdate);

      // USER_JOINED, USER_LEFT 등의 이벤트 처리
      if (roomUpdate.type === 'USER_JOINED' || roomUpdate.type === 'USER_LEFT') {
        loadRoomDetail();
      }
    }
  }, [roomUpdate]);
  */

  const loadRoomDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRoomDetail(roomId);

      if (response.success) {
        setRoomData(response.data);
      } else {
        setError(response.message || '방 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('[RoomDetailView] Failed to load room:', err);
      setError(err.message || '방 정보 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 방 나가기
  const handleLeave = async () => {

    // if (!window.confirm('방에서 나가시겠습니까?')) {
    //   return;
    // }

    try {
      const response = await leaveRoom(roomId);
      if (response.success) {
        alert('방에서 나갔습니다.');
        onLeave();
      } else {
        alert(response.message || '방 나가기에 실패했습니다.');
      }
    } catch (err) {
      console.error('[RoomDetailView] Failed to leave room:', err);
      alert(err.message || '방 나가기에 실패했습니다.');
    }
  };

  // 게임 시작 (방장만)
  const handleStartGame = async () => {
    if (!roomData) return;

    try {
      // 1. 언어 이름을 ID로 매핑
      const languageId = languageMap[roomData.languageName];

      if (!languageId) {
        alert('언어 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 2. 랜덤 문제 조회
      const randomProblem = await getRandomProblem({ languageId });

      if (!randomProblem) {
        alert('문제를 불러오는데 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // 3. 문제 번호 추출
      const problemNumber =
        randomProblem.problem_number ||
        randomProblem.problemNumber ||
        randomProblem.id ||
        randomProblem.problemId;

      if (!problemNumber) {
        alert('문제 번호를 찾을 수 없습니다. 관리자에게 문의해주세요.');
        return;
      }

      // 4. 문제 제목 추출
      const problemTitle =
        randomProblem.problem_title ||
        randomProblem.problemTitle ||
        randomProblem.title ||
        null;

      // 5. Integer 타입 변환
      const problemNumberInt = parseInt(problemNumber, 10);

      if (isNaN(problemNumberInt)) {
        alert('잘못된 문제 번호입니다. 다시 시도해주세요.');
        return;
      }

      // 6. 게임 시작 API 호출
      const response = await startGame(roomId, problemNumberInt, problemTitle);

      if (!response.success) {
        alert(response.message || '게임 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('[RoomDetailView] Failed to start game:', error);
      alert(error.message || '게임 시작에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="room-detail-container">
        <div className="loading-message">방 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-detail-container">
        <div className="error-message">{error}</div>
        <button className="btn-back" onClick={onLeave}>
          뒤로 가기
        </button>
      </div>
    );
  }

  if (!roomData) {
    return null;
  }

  const {
    roomName,
    hostUserId,
    hostNickname,
    problemNumber,
    problemTitle,
    languageName,
    maxParticipants,
    currentParticipants,
    participants,
    status,
  } = roomData;

  // 현재 사용자가 방장인지 확인
  const isHost = currentUserId === hostUserId;

  return (
    <div className="room-detail-container">
      {/* 방 정보 헤더 */}
      <div className="room-detail-header">
        <div className="room-detail-title">{roomName}</div>
        <div className="room-detail-info">
          <span className="info-item">👑 {hostNickname}</span>
          <span className="info-item">#{problemNumber} {problemTitle}</span>
          <span className="info-item">{languageName}</span>
          <span className="info-item participants-info">
            {currentParticipants} / {maxParticipants}
          </span>
        </div>
      </div>

      {/* 참가자 목록 */}
      <div className="participants-section">
        <h3 className="section-title">참가자</h3>
        <div className="participants-grid">
          {participants.map((participant) => (
            <div
              key={participant.userId}
              className={`participant-card ${
                participant.isHost ? 'host-card' : ''
              } ${participant.userId === currentUserId ? 'current-user' : ''}`}
            >
              <div className="participant-avatar">
                {participant.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="participant-info">
                <div className="participant-nickname">
                  {participant.nickname}
                  {participant.isHost && <span className="host-badge">방장</span>}
                  {participant.userId === currentUserId && (
                    <span className="me-badge">나</span>
                  )}
                </div>
                <div className="participant-turn">턴 순서: {participant.turnOrder + 1}</div>
              </div>
            </div>
          ))}

          {/* 빈 슬롯 표시 */}
          {Array.from({ length: maxParticipants - currentParticipants }).map((_, index) => (
            <div key={`empty-${index}`} className="participant-card empty-slot">
              <div className="participant-avatar empty-avatar">?</div>
              <div className="participant-info">
                <div className="participant-nickname empty-text">대기 중...</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="room-detail-actions">
        <button className="btn-leave" onClick={handleLeave}>
          방 나가기
        </button>
        {isHost && status === 'WAITING' && (
          <button
            className="btn-start-game"
            onClick={handleStartGame}
            disabled={currentParticipants < 2}
          >
            게임 시작
          </button>
        )}
      </div>

      {/* 상태 메시지 */}
      {status === 'WAITING' && currentParticipants < 2 && (
        <div className="status-message">
          최소 2명 이상이어야 게임을 시작할 수 있습니다.
        </div>
      )}
      {status === 'IN_PROGRESS' && (
        <div className="status-message in-progress">
          게임이 진행 중입니다...
        </div>
      )}
    </div>
  );
}

export default RoomDetailView;
