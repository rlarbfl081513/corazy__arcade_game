import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from '@/page/MainPage/components/LeftSidebar';
import RoomList from '@/page/MainPage/components/RoomList';
import ChatSidebar from '@/page/MainPage/components/ChatSidebar';
import RollingBanner from '@/page/MainPage/components/design/RollingBanner';
import WaitingRoom from '@/page/MainPage/components/WaitingRoom/WaitingRoom';
import './MainPage.css';
import { getRankingList, getMyRank } from '@/api/rankingApi';
import { getUserInfo } from '@/utils/storage';
import { logout } from '@/api/authApi';
import { useChatSocket } from '@/page/MainPage/hooks/useChatSocket';
import { useRelaySocket } from '@/page/MainPage/hooks/useRelaySocket';
import ProblemGameStartModal from '@/page/MainPage/components/modal/ProblemGameStartModal';
import { createRoom } from '@/api/relayApi';
import Challenge from '@/page/ChallengePage/ChallengePage';
import MainButton from './components/MainButton';
import ModalManager from './components/modal/ModalManager';
import { getChatList } from '@/api/ChatBoardApi';
import useGameStore from '@/stores/gameStore';

// 이미지
import logoutIcon from '@/assets/icon/logout.png';

/**
 * 크레이지 아케이드 스타일의 메인 화면 컴포넌트
 * 컴포넌트 구조:
 * - LeftSidebar: 내 랭킹, 유저 순위
 * - TopSidebar: 방 관리 버튼, 방 목록
 * - ChatSidebar: 채팅
 * - Dictation eModal: 받아쓰기 설정 모달
 */
function MainPage() {
  const navigate = useNavigate();
  const { reset } = useGameStore();

  // API 연결 - 랭킹 데이터 (무한 스크롤)
  const [userRankings, setUserRankings] = useState([]);
  const [myRanking, setMyRanking] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMoreRankings, setHasMoreRankings] = useState(true);

  // 채팅 메시지 (웹소켓)
  const [historyMessages, setHistoryMessages] = useState([]);

  // Chat socket: connect to room 1 (token-based authentication)
  const defaultRoomId = 1;
  const { messages: socketMessages, sendMessage: emitChatMessage } = useChatSocket({
    roomId: defaultRoomId,
  });

  // Relay socket: connect for real-time room list updates
  const { connected: relayConnected, roomListUpdate, error: relayError } = useRelaySocket();

  // 게임 시작 버튼에따른 모달
  const [modalType, setModalType] = useState(null); // null, 'dictation', 'challenge'


  // 랭킹 데이터 변환 함수
  const transformRankingData = (item) => ({
    rank: item.rank,
    name: item.userNickname || `User${item.userId}`, // userNickname 우선, 없으면 User{userId}
    score: item.bestCpm, // CPM을 score로 사용
    userId: item.userId,
    cpm: item.bestCpm,
    wpm: item.bestWpm,
    accuracy: item.bestAccuracy,
  });

  // 채팅 데이터
  const mapApiChatToUi = (m) => ({
    id: m.id,
    user: m.nickname,
    message: m.content,
  });

  // 메인 페이지 진입 시 게임 상태 초기화
  useEffect(() => {
    console.log('[MainPage] 게임 상태 초기화 (reset)');
    reset();
  }, [reset]);

  // 첫 페이지 랭킹 데이터 가져오기
  useEffect(() => {
    const fetchInitialRankings = async () => {
      try {
        setRankingLoading(true);
        setRankingError(null);

        // 첫 페이지 랭킹 조회 (상위 10명)
        const response = await getRankingList({ pageSize: 10 });

        // 랭킹 데이터 변환
        const rankings = response.rankings.map(transformRankingData);

        setUserRankings(rankings);
        setNextCursor(response.nextCursor);
        setHasMoreRankings(response.hasNext);
      } catch (error) {
        console.error('랭킹 조회 실패:', error);
        setRankingError(error.message);
        setUserRankings([]);
      } finally {
        setRankingLoading(false);
      }
    };

    fetchInitialRankings();
  }, []); // 컴포넌트 마운트 시 1회 실행

  // 내 랭킹 조회 (별도 API 호출)
  useEffect(() => {
    const fetchMyRank = async () => {
      try {
        const myRankData = await getMyRank();

        // API 응답을 UI 형식에 맞게 변환
        setMyRanking({
          name: myRankData.userNickname || getUserInfo()?.nickname || '플레이어',
          rank: myRankData.rank,
          score: myRankData.bestCpm,
        });
      } catch (error) {
        console.error('내 랭킹 조회 실패:', error);

        // 에러 시 기본값 (닉네임만 표시)
        const userInfo = getUserInfo();
        setMyRanking({
          name: userInfo?.nickname || '플레이어',
          rank: '-',
          score: 0,
        });
      }
    };

    fetchMyRank();
  }, []); // 컴포넌트 마운트 시 1회 실행

  // 다음 페이지 랭킹 데이터 가져오기 (무한 스크롤)
  const loadMoreRankings = async () => {
    if (!hasMoreRankings || rankingLoading || !nextCursor) {
      return;
    }

    try {
      setRankingLoading(true);

      // 다음 페이지 조회
      const response = await getRankingList({
        cursor: nextCursor,
        pageSize: 10,
      });

      // 새로운 랭킹 데이터 변환
      const newRankings = response.rankings.map(transformRankingData);

      // 기존 데이터에 추가 (중복 제거)
      setUserRankings((prev) => {
        const existingIds = new Set(prev.map((r) => `${r.userId}-${r.rank}`));
        const uniqueNewRankings = newRankings.filter(
          (r) => !existingIds.has(`${r.userId}-${r.rank}`)
        );
        return [...prev, ...uniqueNewRankings];
      });

      setNextCursor(response.nextCursor);
      setHasMoreRankings(response.hasNext);
    } catch (error) {
      console.error('다음 페이지 랭킹 조회 실패:', error);
      setRankingError(error.message);
    } finally {
      setRankingLoading(false);
    }
  };

  // 방 목록 상태 관리 (WebSocket 실시간 업데이트)
  const [rooms, setRooms] = useState([]);

 
  // 채팅 메시지 전송 (웹소켓)
  const handleSendChat = (message) => {
    if (!message || !message.trim()) return;

    console.log('채팅 전송:', message);
    emitChatMessage(message.trim());
  };

  // 채팅 : 최근 100개 불러오고 새로운 채팅 이어붙도록
  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const res = await getChatList(defaultRoomId, { limit: 100 });
        const items = (res?.messages ?? [])
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map(mapApiChatToUi)
          .slice(-100);
        if (!cancelled) setHistoryMessages(items);
      } catch (e) {
        console.error('채팅 히스토리 조회 실패:', e);
        if (!cancelled) setHistoryMessages([]);
      }
    };

    fetchHistory();
    return () => { cancelled = true; };
  }, [defaultRoomId]);

  const combinedMessages = [...historyMessages, ...socketMessages].slice(-100);

  // WebSocket 방 목록 업데이트 감지
  useEffect(() => {
    if (roomListUpdate?.data) {
      console.log('[MainPage] Room list updated via WebSocket:', roomListUpdate.data);
      // 서버에서 전달받은 방 목록으로 업데이트
      setRooms(roomListUpdate.data);
    }
  }, [roomListUpdate]);


  // 방 생성 핸들러
  const handleCreateRoom = async (roomData) => {
    try {
      console.log('[MainPage] 방 생성 요청:', roomData);
      const response = await createRoom(roomData);

      if (response.success) {
        console.log('[MainPage] 방 생성 성공:', response.data);

        // 생성된 방으로 자동 입장
        const newRoomId = response.data.roomId;

        if (newRoomId) {
          // 생성된 방 번호로 바로 이동
          navigate(`/room/${newRoomId}`);
        }
      } else {
        alert(response.message || '방 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('[MainPage] 방 생성 실패:', error);
      alert(error.message || '방 생성에 실패했습니다.');
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout(); // 로컬 스토리지 클리어
    console.log('로그아웃 완료 - 인트로 페이지로 이동');
    navigate('/');
  };

  // 이동 함수들 정의
  const handleGoDictation = (langId, algoId) => {
    navigate(`/dictation?lang=${langId}&algo=${algoId}`);
  };

  const handleGoChallenge = (problemId, language) => {
    // 객체가 아니라 ID가 들어옴
    navigate(`/challenge/${problemId}?lang=${encodeURIComponent(language)}`);
  };


  return (
    <div className="main-page">
      <div className="bg-red-500 w-32 h-32"></div>
      <div className="rolling-banner">
        <div className="top-rolling-banner">
          <RollingBanner text="CORAZY ARCADE" speed={18} gap={12} bg="#F4FC06" />
        </div>
        {/* <div className="bott-rolling-banner">
          <RollingBanner text="CORAZY ARCADE" speed={18} gap={12} bg="#BEA1FF" />
        </div> */}
        <div className="side-rolling-banner">
          <RollingBanner text="CORAZY ARCADE" speed={18} gap={12} bg="#BEA1FF" fontsize={14} />
        </div>
      </div>
      
      <button
        type="button"
        className="main-exit-btn"
        onClick={handleLogout}
      >
        <img src={logoutIcon}/>
      </button>
      <div className="content-container">
        {/* 왼쪽 사이드바 */}
        {/* 내 프로필 & 전체 랭킹 */}
        
          <LeftSidebar
            myRanking={myRanking}
            userRankings={userRankings}
            onLoadMore={loadMoreRankings}
            hasMore={hasMoreRankings}
            isLoading={rankingLoading}
          />


        <div className="right-section">

          {/* 대기방과 버튼목록 */}
          <div className="room-btn-box">
            {/* 게임 대기방 */}
            <div className="game-container">
              <MainButton
                onSoloPlay={() => setModalType('dictation')}
                onChallengePlay={() => setModalType('challenge')}
                onCreateRoom={() => setModalType('createRoom')}
              />
              <WaitingRoom
                roomListUpdate={roomListUpdate}
                relayConnected={relayConnected}
                onJoinRoom={(roomId) => {
                  console.log('[MainPage] 방 입장:', roomId);
                  navigate(`/room/${roomId}`)
                }}
              />
              
            </div>
          </div>
          
          <div className="chat-room">
            {/* 채팅 */}
              <ChatSidebar 
                chatMessages={combinedMessages} 
                onSendChat={handleSendChat} 
              />
          </div>
        </div>
        <div className="btn-section">
            {/* 게임 버튼 */}    
        </div>
        </div>
      {/* 게임 설정 모달 */}
      <ModalManager
        modalType={modalType}
        onClose={() => setModalType(null)}
        onStartDictation={handleGoDictation} // 받아쓰기 게임 시작
        onStartChallenge={handleGoChallenge} // 챌린지 게임 시작
        onCreateRoom={handleCreateRoom} // 방 생성
      />
    </div>
  );
}

export default MainPage;
