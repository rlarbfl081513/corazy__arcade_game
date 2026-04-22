import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGameStore from '@/stores/gameStore';
import { getUserInfo } from '@/utils/storage';
import ChatSidebar from '@/page/MainPage/components/ChatSidebar';
import { getRoomDetail, leaveRoom, toggleReady, startGame } from '@/api/relayApi';
import { getRandomProblem, getLanguages } from '@/api/problemApi';
import { Button } from '@/components/ui/button';
import UserCard from './components/UserCard';
import { ArrowLeftIcon } from 'lucide-react';
import styles from './RoomPage.module.css';
import WaitingRoomBgm from '@/assets/bgm/WaitingRoom.mp3';

export default function RoomPage() {
  const navigate = useNavigate();
  const { roomId: roomIdFromParams } = useParams();

  // Zustand 스토어에서 상태와 액션을 가져옴
  const {
    myUserId,
    myNickname,
    roomInfo,
    participants,
    gameState,
    chatMessages,
    setRoomId,
    updateRoomState,
    reset,
    connect,
    sendChatMessage,
  } = useGameStore();

  const [languageMap, setLanguageMap] = useState({});
  const [isLeavingNormally, setIsLeavingNormally] = useState(false);
  const [error, setError] = useState(null); // API 호출 에러 등 지역적 에러 처리

  // 컴포넌트 마운트 시 roomId와 사용자 정보 설정, 언마운트 시 스토어 리셋
  useEffect(() => {
    // App.jsx에서 설정된 myUserId가 아직 반영되지 않았을 수 있으므로,
    // RoomPage 진입 시 다시 한번 사용자 정보를 설정하여 동기화 문제를 해결합니다.
    const userInfo = getUserInfo();
    if (userInfo && userInfo.userId) {
      useGameStore.getState().setMyInfo({ userId: userInfo.userId, nickname: userInfo.nickname });
    }

    setRoomId(roomIdFromParams);
    
    // 초기 방 정보 로드 후 웹소켓 연결
    const initialize = async () => {
      try {
        const response = await getRoomDetail(roomIdFromParams);
        if (response.success) {
          updateRoomState(response.data);
          // 방 정보 로드가 성공한 후에 웹소켓 연결
          connect();
        } else {
          setError(response.message || '방 정보를 불러올 수 없습니다.');
        }
      } catch (err) {
        setError(err.message || '방 정보 조회에 실패했습니다.');
      }
    };

    initialize();

    // 페이지 이동 시 reset을 호출하면 안 됨 (웹소켓 연결 유지)
    // reset은 사용자가 명시적으로 방을 나갈 때만 호출되어야 함
    return () => {};
  }, [roomIdFromParams, setRoomId, updateRoomState, connect]);

  // 배경음악 재생
  useEffect(() => {
    const audio = new Audio(WaitingRoomBgm);
    audio.loop = true;
    audio.volume = 0.3; // 볼륨 30%

    // 음악 재생 시도
    audio.play().catch((error) => {
      console.log('배경음악 자동 재생 실패:', error);
    });

    // 컴포넌트 언마운트 시 음악 정지
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // 브라우저 새로고침/종료/탭 닫기 감지 (roomIdFromParams 사용)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isLeavingNormally) {
        const token = localStorage.getItem('accessToken');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://corazyarcade.kro.kr';
        const url = `${baseUrl}/api/relay/rooms/${roomIdFromParams}/leave`;

        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({}),
          keepalive: true,
        }).catch(err => console.error('[RoomPage] Auto leave failed:', err));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomIdFromParams, isLeavingNormally]);

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
        console.error('[RoomPage] Failed to load languages:', err);
      }
    };
    loadLanguages();
  }, []);

  // 채팅 메시지 전송
  const handleSendChat = (message) => {
    if (!message || !message.trim()) return;
    sendChatMessage(message.trim());
  };

  // 방 나가기
  const handleLeave = async () => {
    if (!window.confirm('방에서 나가시겠습니까?')) return;

    try {
      setIsLeavingNormally(true);
      await leaveRoom(roomIdFromParams);
      reset(); // 스토어 상태 초기화 및 웹소켓 연결 해제
      navigate('/main');
    } catch (err) {
      console.error('[RoomPage] Failed to leave room:', err);
      alert(err.message || '방 나가기에 실패했습니다.');
      setIsLeavingNormally(false);
    }
  };

  // 준비 상태 토글 (API 호출만 하고, 상태 업데이트는 WebSocket 이벤트로 처리)
  const handleToggleReady = async () => {
    try {
      await toggleReady(roomIdFromParams);
    } catch (err) {
      console.error('[RoomPage] Failed to toggle ready:', err);
      alert(err.message || '준비 상태 변경에 실패했습니다.');
    }
  };

  // 게임 시작 (방장만)
  const handleStartGame = async () => {
    try {
      // 1. 언어 이름을 ID로 매핑
      const languageId = languageMap[languageName];

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

      // 6. 게임 시작 API 호출 (상태 업데이트는 WebSocket 이벤트로 처리)
      await startGame(roomIdFromParams, problemNumberInt, problemTitle);
    } catch (err) {
      console.error('[RoomPage] Failed to start game:', err);
      alert(err.message || '게임 시작에 실패했습니다.');
    }
  };

  // 게임 상태에 따른 페이지 이동 처리
  useEffect(() => {
    // STRATEGY_PHASE, PLAYING, IN_PROGRESS 상태일 때 게임 화면으로 이동
    if (gameState === 'STRATEGY_PHASE' || gameState === 'PLAYING' || gameState === 'IN_PROGRESS') {
      console.log('[RoomPage] 게임 시작 감지, 게임 화면으로 이동:', gameState);
      setIsLeavingNormally(true); // 페이지 전환으로 인한 자동 퇴장 방지
      navigate(`/game/${roomIdFromParams}`);
    }
  }, [gameState, navigate, roomIdFromParams]);

  // 로딩 중 (roomInfo가 없을 때)
  if (!roomInfo) {
    return (
      <div className={styles['room-page']}>
        <div className={styles['loading-message']}>방 정보를 불러오는 중...</div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className={styles['room-page']}>
        <div className={styles['error-message']}>
          {error}
          <Button onClick={() => navigate('/main')}>메인으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const {
    roomName,
    problemNumber,
    problemTitle,
    languageName,
    maxParticipants,
    currentParticipants,
    status,
  } = roomInfo;

  // 현재 사용자 정보 찾기
  const currentUser = participants.find((p) => p.userId === myUserId);

  const isHost = currentUser?.isHost || false;
  const isReady = currentUser?.isReady || false;

  console.log('[RoomPage] Current User:', myNickname, '| Host:', isHost, '| Ready:', isReady);

  // 방장 제외한 모든 참여자가 준비 완료했는지 확인
  const nonHostParticipants = participants.filter((p) => !p.isHost);
  const allParticipantsReady = nonHostParticipants.length > 0 && nonHostParticipants.every((p) => p.isReady);

  // 게임 시작 버튼 활성화 조건
  const canStartGame = isHost && status === 'WAITING' && currentParticipants >= 2 && allParticipantsReady;

  return (
    <div className={styles['room-page']}>
      {/* 나가기 버튼 */}
      <button className={styles['exit-btn']} onClick={handleLeave}>
        <ArrowLeftIcon size={20} /> LEAVE
      </button>

      {/* 웹소켓 연결 상태 */}
      {/* {roomSocketConnected && (
        <div className={styles['connection-status']}>
          ● LIVE
        </div>
      )} */}

      <div className={styles['room-content']}>
        {/* 왼쪽 섹션 */}
        <div className={styles['left-section']}>
          {/* 플레이어 목록 */}
          <div className={styles['players-section']}>
            {/* 방 정보 헤더 */}
            <div className={styles['room-header']}>
              <div className={styles['room-title']}>{roomName}</div>
              <div className={styles['room-info']}>
                <span className={styles['info-badge']}>#{problemNumber} {problemTitle}</span>
                <span className={styles['info-badge']}>{languageName}</span>
                <span className={styles['info-badge']}>{currentParticipants}/{maxParticipants} Players</span>
              </div>
            </div>

            <div className={styles['players-grid']}>
              {participants.map((participant) => (
                <UserCard
                  key={participant.userId}
                  name={participant.nickname}
                  isHost={participant.isHost}
                  isReady={participant.isReady || false}
                />
              ))}
              {/* 빈 슬롯 표시 */}
              {Array.from({ length: maxParticipants - currentParticipants }).map((_, index) => (
                <UserCard
                  key={`empty-${index}`}
                  name="Waiting..."
                  isHost={false}
                  isReady={false}
                />
              ))}
            </div>
          </div>

          {/* 채팅 섹션 */}
          <div className={styles['chat-section']}>
            <ChatSidebar
              chatMessages={chatMessages}
              onSendChat={handleSendChat}
              title={`${roomName} 채팅`}
            />
          </div>
        </div>

        {/* 오른쪽 섹션 */}
        <div className={styles['right-section']}>
          {/* 게임 규칙 */}
          <div className={styles['game-rules']}>
            <div className={styles['rules-content']}>
              <div className={styles['rules-title']}>Game Rules</div>
              <div className={styles["rule-text"]}>
                <p>
                <strong>릴레이 모드:</strong> 코드가 '바톤'이 되는 순간!
              </p>
              <p>
                혼자서는 지루했던 알고리즘, 이제 팀 스포츠가 됩니다!
                팀원들과 함께 하나의 거대한 알고리즘 문제에 도전하세요.
              </p>
              <p>
                1번 주자가 작성한 코드는 2번 주자가 이어받고, 차례차례 완성해 나갑니다.
              </p>
              <p>
                내 차례가 다가오는 숨 막히는 긴장감! 타이머가 0이 되기 전에 코드를 완성하고
                다음 주자에게 넘기세요.
              </p>
              <p className={styles['highlight']}>
                혼자서는 포기했을 문제도, 팀과 함께라면 승리할 수 있습니다!
              </p>
              <p className={styles['highlight']}>
                모든 팀원이 채워지지 않아도 팀원이 2명 이상이면 게임시작 가능합니다.
              </p>
              </div>
              
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className={styles['action-buttons']}>
            
            {/* 상태 메시지 */}
            {isHost && currentParticipants < 2 && (
              <div className={styles['warning-message']}>
                ⚠ 최소 2명 이상이어야 게임을 시작할 수 있습니다
              </div>
            )}
            {isHost && currentParticipants >= 2 && !allParticipantsReady && (
              <div className={styles['warning-message']}>
                ⚠ 모든 참여자가 준비해야 시작할 수 있습니다
              </div>
            )}

            <div className={styles["btn-box"]}>
              
                {!isHost ? (
                // 일반 참여자: 준비 버튼
                <button
                  className={`${styles['ready-btn']} ${isReady ? styles['ready-active'] : ''}`}
                  onClick={handleToggleReady}
                >
                  {isReady ? 'Cancel Ready' : 'Ready'}
                </button>
              ) : (
                // 방장: 게임 시작 버튼
                <button
                  className={styles['start-btn']}
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                >
                  Start Game
                </button>
              )}
            </div>
          
          </div>
        </div>
      </div>
    </div>
  );
}
