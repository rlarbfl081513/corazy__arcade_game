import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTheme } from '@/components/ThemeProvider';
import useGameStore from '@/stores/gameStore';
import { submitResult, leaveRoom, sendActivityData } from '@/api/relayApi';
import { getProblemInfo, enqueueSubmission } from '@/api/problemApi';
import useSubmissionWebSocket from '@/hooks/useSubmissionWebSocket';
import ProblemPanel from '@/page/ChallengePage/components/ProblemPanel';
import EditorPanel, { DEFAULT_CODE_TEMPLATES } from '@/page/ChallengePage/components/EditorPanel';
import OutputPanel from '@/page/ChallengePage/components/OutputPanel';
import ChatSidebar from '@/page/MainPage/components/ChatSidebar';
import EnhancedResultModal from './EnhancedResultModal';
import useActivityTracker from '@/hooks/useActivityTracker';
import SubmitResultModal from './components/SubmitResultModal';
import GameStartLoading from './components/GameStartLoading';
import TossedEmojiEffect from './components/TossedEmojiEffect';
import RealSubmitModal from '@/page/ChallengePage/components/modal/RealSubmitModal';
import useGameSettings from '@/hooks/useGameSettings';
import backIcon from '@/assets/icon/back.png';
import hostCrown from '@/assets/icon/hostCrown.png';
import runing from '@/assets/character/runCharacter.png';
import waiting from '@/assets/character/notRunningCharacter.png';
import fence from '@/assets/fence.png';
import lock from '@/assets/lock.png';
import timefire from '@/page/RelayGamePage/assests/fire.png';
import meeting from '@/page/RelayGamePage/assests/meeting.png';
import emoji from '@/page/RelayGamePage/assests/emoji.png';
import emojiQuestion from '@/page/RelayGamePage/assests/emoji/questoinEmoji.png';
import emojiSad from '@/page/RelayGamePage/assests/emoji/sadEmoji.png';
import emojiThumb from '@/page/RelayGamePage/assests/emoji/thumbEmoji.png';
import pingImage from '@/page/RelayGamePage/assests/ping.png';
import './RelayGamePage.css';
import RelayGameBgm from '@/assets/bgm/RelayGame.mp3';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

function RelayGamePage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { theme } = useTheme();
  const editorRef = useRef(null);

  const {
    myUserId,
    myNickname,
    roomInfo,
    participants,
    gameState,
    isMyTurn,
    turnTimeLeft,
    code,
    submissionResult,
    gameEndData,
    isAnalysisComplete,
    activeEmojiByUser: storeActiveEmojiByUser,
    activePings,
    chatMessages,
    setMyCode,
    reset,
    connect,
    sendCodeUpdate,
    sendEmoji,
    sendPing,
    sendChatMessage,
    decrementTimeLeft,
  } = useGameStore();

  const [problemData, setProblemData] = useState(null);
  const [submissionUuid, setSubmissionUuid] = useState(null);
  const [isEvaluateMode, setIsEvaluateMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showYourTurnMessage, setShowYourTurnMessage] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null); // 클라이언트 자체 게임 시작 시간
  const [chatInput, setChatInput] = useState('');
  const [strategyTimeLeft, setStrategyTimeLeft] = useState(30); // ⭐ 전략 시간 전용 상태 (테스트용 30초)
  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [showStartLoading, setShowStartLoading] = useState(false); // 게임 시작 로딩
  const hasShownLoadingRef = useRef(false); // 로딩 화면 표시 여부 추적
  const loadingStartedRef = useRef(false); // 로딩이 시작됐는지 추적
  const tossRef = useRef(null); // TossedEmojiEffect ref
  const [showSubmitModal, setShowSubmitModal] = useState(false); // 제출 확인 모달
  const [showExitModal, setShowExitModal] = useState(false); // 나가기 확인 모달

  // ✨ GameSettings 훅 추가 (파티클, 쉐이크 효과)
  const { allSettings } = useGameSettings();
  const [activeMode, setActiveMode] = useState('relay');
  const currentModeSettings = allSettings?.[activeMode] || {};
  const enableParticles = currentModeSettings.particles ?? true;
  const enableShake = currentModeSettings.shake ?? false;

  // 🔍 디버깅: 컴포넌트 렌더링 추적
  console.log('🎮 [RelayGamePage] Render -', {
    gameState,
    isAnalysisComplete,
    isResultModalOpen,
    roomId
  });

  // 사용자 활동 추적 훅
  const { getAggregatedData } = useActivityTracker(editorRef.current, gameState === 'PLAYING');

  // 이모지 옵션 정의
  const emojiOptions = [
    { id: 'question', image: emojiQuestion, alt: 'question' },
    { id: 'sad', image: emojiSad, alt: 'sad' },
    { id: 'thumb', image: emojiThumb, alt: 'thumb up' },
  ];

  const emojiMap = {
    question: emojiQuestion,
    sad: emojiSad,
    thumb: emojiThumb,
  };

  // 이모지 선택 핸들러 (TossedEmojiEffect 통합)
  const handleSelectEmoji = (emojiId) => {
    sendEmoji(emojiId);
    setEmojiPickerOpen(false);

    // Toss 애니메이션 트리거
    if (tossRef.current) {
      tossRef.current.triggerToss(emojiId);
    }
  };

  useEffect(() => {
    connect();
  }, [connect]);

  // 채팅 메시지 자동 스크롤 (컨테이너 내부만 스크롤)
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [chatMessages]);

  // 게임 시작 시 로딩 화면 표시 (STRATEGY_PHASE로 처음 전환될 때만)
  useEffect(() => {
    if (gameState === "STRATEGY_PHASE" && !hasShownLoadingRef.current && !loadingStartedRef.current) {
      console.log('[RelayGamePage] 🎮 게임 시작 - 로딩 화면 표시');
      setShowStartLoading(true);
      hasShownLoadingRef.current = true; // 한 번만 표시되도록
      loadingStartedRef.current = true; // 로딩 시작됨 표시
    }
  }, [gameState]);

  // 로딩 완료 핸들러
  const handleLoadingComplete = useCallback(() => {
    console.log('[RelayGamePage] 로딩 화면 완료');
    setShowStartLoading(false);
  }, []);

  // 전략 시간 서버 동기화 (5초마다 수신)
  useEffect(() => {
    if (gameState === "STRATEGY_PHASE" && turnTimeLeft >= 0) {
      console.log('[RelayGamePage] 전략 시간 서버 동기화:', turnTimeLeft);
      setStrategyTimeLeft(turnTimeLeft);
    }
  }, [gameState, turnTimeLeft]);

  // 전략 시간 로컬 타이머 (매초 감소)
  useEffect(() => {
    if (gameState === "STRATEGY_PHASE" && strategyTimeLeft > 0) {
      const timer = setInterval(() => {
        setStrategyTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, strategyTimeLeft]);

  useEffect(() => {
    const audio = new Audio(RelayGameBgm);
    audio.loop = true;
    audio.volume = 0.3;
    audio.play().catch((error) => {
      console.log("배경음악 자동 재생 실패:", error);
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (!roomInfo?.problemNumber) return;
    const loadProblemData = async () => {
      try {
        const languageMap = {
          java: "java",
          python: "python",
          "c++": "cpp",
          cpp: "cpp",
          c: "c",
          javascript: "javascript",
        };
        const roomLanguage = roomInfo.languageName;
        if (!roomLanguage) {
          console.error("[RelayGamePage] languageName is missing in roomInfo");
          return;
        }
        const monacoLang = languageMap[roomLanguage.toLowerCase()];
        const response = await getProblemInfo({
          problemId: roomInfo.problemNumber,
        });
        if (!response || !response.info) {
          console.error("[RelayGamePage] Failed to load problem info");
          return;
        }
        const info = response.info;
        const testcases = response.testcases;
        const transformedData = {
          problemId: info.problemId,
          title: info.title,
          level: info.difficulty,
          problemInfo: info.description,
          inputDescription: info.inputDescription,
          outputDescription: info.outputDescription,
          limitations: `시간 제한: ${info.timeLimit}ms, 메모리 제한: ${info.memoryLimit}MB`,
          examplesList: (testcases?.testCases || []).map((tc, index) => ({
            id: index,
            input: tc.input || "",
            output: tc.output || "",
          })),
          language: roomLanguage,
          algorithm: "알고리즘",
          monacoLanguage: monacoLang,
          isSolved: false,
        };
        setProblemData(transformedData);
      } catch (err) {
        console.error("[RelayGamePage] Failed to load problem:", err);
      }
    };
    loadProblemData();
  }, [roomInfo?.problemNumber]);

  const getMonacoLanguage = () => {
    if (!roomInfo?.languageName) return null;
    const languageMap = {
      java: "java",
      python: "python",
      "c++": "cpp",
      cpp: "cpp",
      c: "c",
      javascript: "javascript",
    };
    return languageMap[roomInfo.languageName.toLowerCase()];
  };

  const currentLanguage = getMonacoLanguage() || problemData?.monacoLanguage;

  useEffect(() => {
    if (gameState !== 'PLAYING' || !roomInfo || !currentLanguage || !editorRef.current) {
      return;
    }
    const isHost = roomInfo.participants?.some(p => p.userId === myUserId && p.isHost);
    if (!isHost) {
      return;
    }
    const currentCode = editorRef.current.getValue();
    if (currentCode && currentCode.trim()) {
      return;
    }
    const template = DEFAULT_CODE_TEMPLATES[currentLanguage] || '';
    if (template) {
      editorRef.current.setValue(template);
    }
  }, [gameState, roomInfo, currentLanguage, myUserId]);

  const turnFormattedTime = formatTime(turnTimeLeft || 0);
  const isWarning = (turnTimeLeft || 0) <= 10;

  const {
    progress,
    testCases,
    finalResult,
    error: submissionError,
    isComplete,
    isReady,
  } = useSubmissionWebSocket(submissionUuid);

  const mappedTestCases = useMemo(() => {
    if (!testCases) return [];
    return testCases.map((tc) => ({
      testCase: tc.test_case_number,
      status: tc.status === "AC" ? "Success" : "Fail",
      input: tc.input,
      expectation: tc.expected_output,
      output: tc.actual_output,
    }));
  }, [testCases]);

  const isLoading = submissionUuid && !isComplete && !submissionError;
  const connectionStatus = submissionUuid
    ? isReady
      ? "✅ 채점 준비 완료"
      : "🔌 연결 중..."
    : null;

  useEffect(() => {
    if (!isEvaluateMode || !isComplete || !finalResult) return;
    if (isSubmitting) return;
    // 게임이 종료된 경우 제출하지 않음
    if (gameState !== 'PLAYING') {
      console.log("[RelayGamePage] Game is not in PLAYING state, skipping submit result.");
      setSubmissionUuid(null);
      return;
    }

    const sendSubmitResult = async () => {
      try {
        setIsSubmitting(true);
        const isCorrect = finalResult.status === "AC";
        const resultText = isCorrect ? "맞았습니다!!" : "틀렸습니다";
        const message = isCorrect ? "축하합니다" : "다시 도전해보세요";
        await submitResult(roomId, { isCorrect, result: resultText, message });

        // 서버로 결과 전송 후 모달 닫기
        console.log("[RelayGamePage] Submit result completed, closing modal");
      } catch (error) {
        console.error("[RelayGamePage] Failed to submit result:", error);
        // 게임이 이미 종료된 후 재요청이 들어오면 실패할 수 있음.
        // 이 경우 alert를 띄우지 않고 조용히 무시.
        if (error.message.includes("게임이 진행 중일 때만")) {
          console.log("Game already finished, ignoring submit result error.");
        } else {
          alert("제출에 실패했습니다. 다시 시도해주세요.");
        }
      } finally {
        setIsSubmitting(false);
        setSubmissionUuid(null);
        setIsEvaluateMode(false); // 모달 닫기
      }
    };

    sendSubmitResult();
  }, [isEvaluateMode, isComplete, finalResult, roomId, isSubmitting, gameState]);

  // 게임 시작 시 클라이언트 시작 시간 기록
  useEffect(() => {
    if (gameState === 'PLAYING' && !gameStartTime) {
      console.log('[RelayGamePage] 게임 시작 - 클라이언트 시작 시간 기록');
      setGameStartTime(Date.now());
    } else if (gameState !== 'PLAYING') {
      console.log('[RelayGamePage] 게임 종료 - 시작 시간 초기화');
      setGameStartTime(null);
      setElapsedTime(0);
    }
  }, [gameState, gameStartTime]);

  // 클라이언트 자체 총 시간 측정
  useEffect(() => {
    if (gameState !== 'PLAYING' || !gameStartTime) {
      return;
    }

    console.log('[RelayGamePage] 총 시간 측정 시작');
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - gameStartTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => {
      console.log('[RelayGamePage] 총 시간 측정 타이머 정리');
      clearInterval(timer);
    };
  }, [gameState, gameStartTime]);

  useEffect(() => {
    if (gameState !== 'PLAYING' || turnTimeLeft <= 0) {
      return;
    }
    const countdown = setInterval(() => {
      decrementTimeLeft();
    }, 1000);
    return () => clearInterval(countdown);
  }, [gameState, turnTimeLeft, decrementTimeLeft]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleSendChat = (message) => {
    if (!message || !message.trim()) return;
    sendChatMessage(message.trim());
  };

  const handleCodeChange = (newCode) => {
    if (isMyTurn) {
      setMyCode(newCode);
      sendCodeUpdate(newCode);
    }
  };

  const handleCompleteTurn = async () => {
    if (!isMyTurn) return;
    try {
      const response = await completeTurn(roomId);
      if (!response.success) {
        alert("턴 완료에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("[RelayGamePage] Failed to complete turn:", error);
      alert("턴 완료에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleTestSubmit = async () => {
    if (!isMyTurn) {
      alert("내 턴일 때만 제출할 수 있습니다.");
      return;
    }
    if (!editorRef.current || !problemData) {
      alert("문제 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    const currentCode = editorRef.current.getValue();
    if (!currentCode || currentCode.trim() === "") {
      alert("코드를 작성해주세요.");
      return;
    }
    try {
      const data = await enqueueSubmission({
        problem_id: problemData.problemId,
        code: currentCode,
        language: problemData.monacoLanguage,
        mode: "SAMPLE",
      });
      setIsEvaluateMode(false);
      setSubmissionUuid(data.submission_uuid);
    } catch (apiError) {
      console.error("[RelayGamePage] Failed to submit test:", apiError);
      alert("테스트 제출에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 최종 제출 버튼 클릭 (모달 열기)
  const handleFinalSubmit = async () => {
    if (!isMyTurn) {
      alert("내 턴일 때만 제출할 수 있습니다.");
      return;
    }
    if (!editorRef.current || !problemData) {
      alert("문제 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    const currentCode = editorRef.current.getValue();
    if (!currentCode || currentCode.trim() === "") {
      alert("코드를 작성해주세요.");
      return;
    }
    // 모달 열기
    setShowSubmitModal(true);
  };

  // 실제 최종 제출 (모달에서 확인 클릭 시)
  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);

    if (!editorRef.current || !problemData) {
      alert("오류: 문제 정보를 다시 확인해주세요.");
      return;
    }
    const currentCode = editorRef.current.getValue();

    try {
      // 새로운 EVALUATE 제출 시작 전에 이전 결과 초기화
      setSubmissionUuid(null);

      const data = await enqueueSubmission({
        problem_id: problemData.problemId,
        code: currentCode,
        language: problemData.monacoLanguage,
        mode: "EVALUATE",
      });
      setIsEvaluateMode(true);
      setSubmissionUuid(data.submission_uuid);
    } catch (apiError) {
      console.error("[RelayGamePage] Failed to submit final:", apiError);
      alert("최종 제출에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 방 나가기 버튼 클릭 (모달 열기)
  const handleTempExit = async () => {
    setShowExitModal(true);
  };

  // 실제 방 나가기 (모달에서 확인 클릭 시)
  const handleConfirmExit = async () => {
    setShowExitModal(false);
    try {
      await leaveRoom(roomId);
      console.log('[RelayGamePage] 방 나가기 - 게임 상태 초기화 후 메인으로 이동');
      reset();
      navigate('/main');
    } catch (error) {
      console.error('[RelayGamePage] 방 나가기 실패:', error);
      alert('방 나가기에 실패했습니다.');
    }
  };

  const handleGameEndConfirm = () => {
    console.log('[RelayGamePage] 게임 종료 확인 - 게임 상태 초기화 후 메인으로 이동');
    setIsResultModalOpen(false);
    reset();
    navigate('/main');
  };

  // 게임 종료 처리 - 활동 데이터 전송
  useEffect(() => {
    if (gameState === 'FINISHED') {
      // 집계된 활동 데이터를 가져와서 서버로 전송 (fire-and-forget)
      try {
        const activityData = getAggregatedData();
        if (myUserId && (activityData.totalKeystrokes > 0 || activityData.totalIdleTime > 0)) {
          console.log('🎮 [RelayGamePage] 게임 종료! 활동 데이터 전송:', activityData);
          sendActivityData(roomId, {
            userId: myUserId,
            totalKeystrokes: activityData.totalKeystrokes,
            totalIdleTime: activityData.totalIdleTime,
          }).catch(error => {
            console.error("활동 데이터 전송 실패:", error);
          });
        }
      } catch (error) {
        console.error("활동 데이터 수집 실패:", error);
      }
    }
  }, [gameState, roomId, myUserId]); // getAggregatedData 의존성 제거 - 함수가 매번 새로 생성되어 무한 루프 발생 방지

  // 기여도 분석 완료 시 모달 오픈
  useEffect(() => {
    if (gameState === 'FINISHED' && isAnalysisComplete) {
      console.log('📊 [RelayGamePage] 기여도 분석 완료! 결과 모달 오픈');
      console.log('📊 [RelayGamePage] 현재 isResultModalOpen:', isResultModalOpen);
      setIsResultModalOpen(true);
      console.log('📊 [RelayGamePage] setIsResultModalOpen(true) 호출 완료');
    }
  }, [gameState, isAnalysisComplete]); // isResultModalOpen 제거 - 상태 업데이트 후 재실행 방지

  // 분석 타임아웃 처리 (10초 후 강제 모달 오픈)
  useEffect(() => {
    if (gameState === 'FINISHED' && !isAnalysisComplete) {
      console.log('⏳ [RelayGamePage] 분석 타임아웃 타이머 시작 (10초)');
      const timeoutId = setTimeout(() => {
        if (!isAnalysisComplete) {
          console.warn('⚠️ [RelayGamePage] 분석 타임아웃! 강제로 모달 오픈');
          setIsResultModalOpen(true);
        }
      }, 10000); // 10초

      return () => clearTimeout(timeoutId);
    }
  }, [gameState, isAnalysisComplete]);

  // 게임 중 참여자 이탈 감지 - 게임 중단 및 메인으로 이동
  useEffect(() => {
    // 게임 중(PLAYING 또는 STRATEGY_PHASE)이 아니면 무시
    if (gameState !== 'PLAYING' && gameState !== 'STRATEGY_PHASE') {
      return;
    }

    // 참여자가 1명 이하로 줄어들면 게임 중단
    if (participants && participants.length <= 1) {
      console.warn('⚠️ [RelayGamePage] 게임 중 참여자 이탈 감지 - 메인으로 이동');
      alert('다른 참여자가 나가서 게임이 중단됩니다.');
      reset();
      navigate('/main');
    }
  }, [participants, gameState, reset, navigate]);

  const maxParticipants = roomInfo?.maxParticipants || 4;

  const title = "Chat Board";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      handleSendChat(chatInput);
      setChatInput('');
    }
  };

  useEffect(() => {
    if (isMyTurn && gameState === "PLAYING") {
      setShowYourTurnMessage(true);
      const timer = setTimeout(() => {
        setShowYourTurnMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, gameState]);

  const showGlobalCountdown = turnTimeLeft <= 3 && turnTimeLeft > 0;

  // 전역 핑 클릭 핸들러
  const handleGlobalPing = (e) => {
    if (e.altKey) {
      e.preventDefault();
      const xRatio = e.clientX / window.innerWidth;
      const yRatio = e.clientY / window.innerHeight;
      console.log('[RelayGamePage] 전역 핑 클릭:', { xRatio, yRatio });
      sendPing(xRatio, yRatio);
    }
  };

  return (
    <>
      {/* 게임 시작 로딩 화면 */}
      {showStartLoading && loadingStartedRef.current && (
        <GameStartLoading key="game-start-loading" onComplete={handleLoadingComplete} />
      )}

      <div
        className={`relay-game-page ${isMyTurn ? 'turn-active-sky' : 'noturn-active-sky'}`}
        onClick={handleGlobalPing}
      >
        <div className="container">
          <div className="main-container" data-theme={theme}>
            <div className="main-title">
              <div className="sub">
                <img
                  src={backIcon}
                  className="icon to-home"
                  onClick={handleTempExit}
                />
              </div>
            </div>
            <div className="relay-main-row">
              <div className="participants-bar">
                <div className="participants-list-horizontal">
                  {participants.map((participant, index) => {
                    const isMe = participant.userId === myUserId;
                    const isActiveTurn = participant.userId === roomInfo.currentTurnUserId;
                    return (
                      <div
                        key={participant.userId}
                        className={`participant-item ${isMe ? 'participant-me' : ''} ${isActiveTurn ? 'box-active' : ''}`}
                      >
                        {isActiveTurn && (
                          <div className='fire' />
                        )}
                        <div className={`char-img ${isActiveTurn ? 'participant-active' : ''}`}>
                          {isActiveTurn ? (
                            <div className="run">
                              <img className="turn-badge" src={runing} alt="running" />
                            </div>
                          ) : (
                            <div className="wait-box">
                              <img className='fence' src={fence} />
                              <img className='waiting' src={waiting} alt="waiting" />
                              <img className='waiting-lock' src={lock} />
                            </div>
                          )}
                        </div>
                        <div className="user-info">
                          <div className={`participant-number ${isActiveTurn ? 'number-active' : ''}`}>
                            {isMe ? (
                              <span className="host-badge">
                                <img src={hostCrown} />
                              </span>
                            ) : (
                              <span className="index-number">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div className={`participant-name ${isActiveTurn ? 'name-active' : ''}`}>
                            {participant.nickname}
                          </div>
                        </div>
                        {storeActiveEmojiByUser?.[participant.userId] && (
                          <div className="emoji-bubble">
                            <img className="bubble-img" src={emojiMap[storeActiveEmojiByUser[participant.userId]]} alt="" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {Array.from({ length: maxParticipants - participants.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="participant-item participant-empty">
                      <div className="participant-number">참가자 {participants.length + index + 1}</div>
                      <div className="participant-name">대기 중...</div>
                    </div>
                  ))}
                </div>
              </div>
              <PanelGroup direction="horizontal" className="main-panel row-section">
                <Panel defaultSize={25} minSize={15}>
                  <ProblemPanel challenge={problemData} />
                </Panel>
                <PanelResizeHandle className="handle row-handle">
                  <div className="row-dash"></div>
                  <div className="row-move-handel">
                    <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                    <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                    <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                  </div>
                </PanelResizeHandle>
                <Panel defaultSize={52} minSize={35}>
                  <PanelGroup direction="vertical" className="col-section">
                    <Panel defaultSize={60} minSize={30} className="scrollable-panel">
                      <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <EditorPanel
                          language={currentLanguage}
                          onMount={handleEditorDidMount}
                          onTestSubmit={handleTestSubmit}
                          onFinalSubmit={handleFinalSubmit}
                          isReadOnly={!isMyTurn}
                          sharedCode={code}
                          onCodeChange={handleCodeChange}
                          currentEditor={roomInfo?.currentTurnNickname}
                          isRelayMode={true}
                          enableParticles={enableParticles}
                          enableShake={enableShake}
                        />

                        {/* 전략 구상 시간 오버레이 */}
                        {gameState === "STRATEGY_PHASE" && (
                          <div className="discussion-overlay">
                            <div className="discussion-box">
                              <div className="dis-title">
                                <img src={timefire} alt="fire" />
                                전략 회의 시간
                                <img src={timefire} alt="fire" />
                              </div>
                              <span className='dis-time'>
                                {formatTime(strategyTimeLeft)}
                              </span>
                              <img className='time-meeting' src={meeting} alt="meeting" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Panel>
                    <PanelResizeHandle className="handle col-handle">
                      <div className="col-dash"></div>
                      <div className="col-move-handel">
                        <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                        <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                        <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                      </div>
                    </PanelResizeHandle>
                    <Panel defaultSize={40} minSize={20} className="scrollable-panel">
                      <OutputPanel
                        testResults={isEvaluateMode ? [] : mappedTestCases}
                        finalResult={isEvaluateMode ? null : finalResult}
                        isLoading={isEvaluateMode ? false : isLoading}
                        connectionStatus={isEvaluateMode ? null : connectionStatus}
                        isReady={isEvaluateMode ? false : isReady}
                        progress={isEvaluateMode ? 0 : progress}
                      />
                    </Panel>
                  </PanelGroup>
                </Panel>
                <PanelResizeHandle className="handle row-handle">
                  <div className="row-dash"></div>
                  <div className="row-move-handel">
                    <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                    <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                    <div className="circle" style={{ borderRadius: "20px", width: "8px", height: "8px", backgroundColor: "#dcdcdcff" }}></div>
                  </div>
                </PanelResizeHandle>
                <Panel defaultSize={24} minSize={15}>
                  <div className="bottom-sidebar">
                    <div className="chat-section">
                      <div className="game-timers">
                        <div className="game-timer-box">
                          <div className="timer-label">총 시간</div>
                          <div className="timer-value">{formatTime(elapsedTime)}</div>
                        </div>
                        <div className={`game-timer-box ${isWarning ? 'timer-warning' : ''}`}>
                          <div className="timer-label">남은 시간</div>
                          <div className="timer-value">{turnFormattedTime}</div>
                        </div>
                      </div>
                      <div className={`main-chat-section ${isMyTurn ? 'turn-active-chat' : ''}`}>
                        <div className="title-box">
                          <div className="chat-title">릴레이 전략 채팅</div>
                        </div>
                        <div className="line"></div>
                        <div className="chat-messages">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className="chat-message">
                              <span className="chat-user">{msg.user}:</span>
                              <span className="chat-text">{msg.message}</span>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSubmit} className="chat-input-form">
                          <input
                            type="text"
                            className="chat-input"
                            placeholder={isMyTurn ? "내 턴에는 코딩에 집중해주세요!" : ""}
                            value={chatInput}
                            onChange={(e) => {
                              setChatInput(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            rows={1}
                            maxLength={200}
                            disabled={isMyTurn}
                          />
                          <button type="submit" className="chat-send-btn" disabled={isMyTurn}>
                            Send
                          </button>
                          <button
                            type="button"
                            className="chat-send-btn emoji"
                            disabled={isMyTurn}
                            onClick={() => setEmojiPickerOpen((prev) => !prev)}
                          >
                            <img src={emoji} alt="emoji" />
                          </button>
                          {isEmojiPickerOpen && (
                            <div className="emoji-popover">
                              {emojiOptions.map((option) => (
                                <button
                                  key={option.id}
                                  className="emoji-option"
                                  onClick={() => handleSelectEmoji(option.id)}
                                >
                                  <img className='emoji-img' src={option.image} alt={option.alt} />
                                </button>
                              ))}
                            </div>
                          )}
                        </form>
                        <div className={`cover ${isMyTurn ? 'turn-active-chat' : 'noturn-active-lock'}`}>
                          <img src={lock} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </div>
          </div>
        </div>
        {showGlobalCountdown && (
          <div className="global-countdown-overlay">
            {turnTimeLeft}
          </div>
        )}
        {showYourTurnMessage && (
          <div className="your-turn-message-overlay">
            당신의 차례입니다!
          </div>
        )}
      </div>
      {/* 핑 표시 - 최상위 레벨로 이동 */}
      {activePings.map((ping) => (
        <img
          key={ping.id}
          src={pingImage}
          alt="ping"
          className="ping-marker"
          style={{
            position: 'absolute',
            left: `${ping.x}px`,
            top: `${ping.y}px`,
            pointerEvents: 'none',
            zIndex: 9999,
            width: '60px',
            height: 'auto',
          }}
        />
      ))}

      {/* TossedEmojiEffect - 이모지 던지기 애니메이션 */}
      <TossedEmojiEffect
        ref={tossRef}
        isEnabled={gameState === "PLAYING"}
      />

      {/* 기여도 분석 중 로딩 인디케이터 */}
      {gameState === 'FINISHED' && !isAnalysisComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl p-10 w-full max-w-lg text-center border border-gray-700 animate-fade-in">
            <div className="mb-6">
              <svg className="animate-spin h-20 w-20 mx-auto text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              📊 게임 결과 집계 중
            </h3>
            <p className="text-gray-300 text-lg mb-2">팀원들의 활동 데이터를 분석하고 있습니다</p>
            <p className="text-gray-400 text-sm">잠시만 기다려주세요...</p>

            {/* 진행 바 애니메이션 */}
            <div className="mt-6 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full animate-pulse"></div>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      <EnhancedResultModal
        isOpen={isResultModalOpen}
        onClose={handleGameEndConfirm}
        roomId={roomId}
      />
      <SubmitResultModal isOpen={!!submissionResult && gameState !== 'FINISHED'} data={submissionResult} />

      {/* EVALUATE 모드: 채점 진행 상태 모달 */}
      {isEvaluateMode && submissionUuid && (
        <div className="relay-game submit-modal-overlay">
          <RealSubmitModal
            finalResult={isComplete ? finalResult : null}
            progress={progress}
            isReady={isReady}
            onClose={() => {
              setSubmissionUuid(null);
              setIsEvaluateMode(false);
            }}
            onExit={() => {
              setSubmissionUuid(null);
              setIsEvaluateMode(false);
            }}
          />
        </div>
      )}

      {/* 최종 제출 확인 모달 */}
      {showSubmitModal && (
        <div className="relay-game submit-modal-overlay">
          <div className="relay-game submit-modal-box">
            <div className="modal-title">
              <h3>최종 제출하시겠습니까?</h3>
              <p>제출 후에는 코드를 수정할 수 없습니다.</p>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowSubmitModal(false)}
              >
                취소
              </button>
              <button
                className="modal-btn submit"
                onClick={handleConfirmSubmit}
              >
                네, 제출합니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 나가기 확인 모달 */}
      {showExitModal && (
        <div className="relay-game submit-modal-overlay">
          <div className="relay-game submit-modal-box">
            <div className='modal-title'>
              <h3>게임을 나가시겠습니까?</h3>
              <p>현재 게임에서 나가게 됩니다.</p>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowExitModal(false)}
              >
                취소
              </button>
              <button
                className="modal-btn submit"
                onClick={handleConfirmExit}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RelayGamePage;
