import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DictationCodeEditor from '@/page/DictationPage/components/DictationCodeEditor';
import ProgressDisplay from './components/ProgressDisplay';
import DinoCharAnimation from '@/page/DictationPage/components/DinoCharAnimation';
import './DictationPage.css';
import { saveGameResult } from '@/api/rankingApi';
import { getAccessToken } from '@/utils/storage';
import { getDictationByLangAlgo } from '@/api/dictationApi';
import useGameSettings from '@/hooks/useGameSettings';

/**
 * 코드 받아쓰기 게임 화면 컴포넌트
 * 왼쪽: 문제 코드 표시
 * 오른쪽: 코드 작성 영역
 * 상단: CPM, WPM, 진행도 지표
 */
function Dictation() {
  const navigate = useNavigate();
  const location = useLocation(); // URL의 쿼리 파라미터(?...)를 가져옴

  const { allSettings } = useGameSettings();

  const [dictation, setDictation] = useState(null);
  const [language, setLanguage] = useState(null);

  const [problemLines, setProblemLines] = useState([]); // 문제 라인들
  const [userCode, setUserCode] = useState('');         // 사용자가 치는 코드
  const [initialUserCode, setInitialUserCode] = useState(''); // 초기화용 원본
  const editorRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const dictationId = dictation?.id || null;
  const dictationTitle = dictation?.title || '피보나치 수열';
  const [currentCorrect, setCurrentCorrect] = useState(0);

  const [activeMode, setActiveMode] = useState('dictation');
  const currentModeSettings = allSettings?.[activeMode] || {};
  const enableParticles = currentModeSettings.particles ?? true;
  const enableShake = currentModeSettings.shake ?? false;

  useEffect(() => {
    const fetchDictation = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const langId = searchParams.get('lang');
        const algoId = searchParams.get('algo');

        // API 호출
        const response = await getDictationByLangAlgo({ 
          langId: langId, 
          algoId: algoId 
        }); 
        
        const data = Array.isArray(response) ? response[0] : response; 
        
        // 받아쓰기 정보 저장
        setDictation(data);
        setLanguage(data.languageName || 'javascript'); // 언어 설정

        // 받아온 데이터로 에디터 내용 갈아끼우기
        const content = data.content || '';
        const lines = content.split('\n');
        
        setProblemLines(lines); // 문제 라인 설정

        // 초기 코드 생성 (함수 정의 필요)
        const initCode = buildInitialUserCode(lines); 
        setInitialUserCode(initCode); // 재시작을 위해 저장
        setUserCode(initCode);        // 현재 에디터에 표시

      } catch (error) {
        console.error("데이터 로딩 실패", error);
      }
    };

    fetchDictation();
  }, [location.search, navigate]);

  // 타이핑 지표 (실시간)
  const [cpm, setCpm] = useState(0); // Characters Per Minute
  const [wpm, setWpm] = useState(0); // Words Per Minute
  const [progress, setProgress] = useState(0); // Progress

  // 타이머
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 게임 클리어 여부 확인
  const [isGameCompleted, setIsGameCompleted] = useState(false);

  // 완성 모달
  const [showModal, setShowModal] = useState(false);

  // 진행률 (퍼센티지)
  const [completedLines, setCompletedLines] = useState(0);
  const totalLines = problemLines.length;

  const [resetKey, setResetKey] = useState(0);
  const [typedChars, setTypedChars] = useState(0);

  // 완성 시 저장된 최종 결과 (백엔드 전송용)
  const [finalResult, setFinalResult] = useState({
    cpm: 0,
    wpm: 0,
    progress: 0,
    time: 0, // 초 단위
    timestamp: null, // 완성 시각
    rankingPercentage: null, // 상위 % (백엔드 응답)
  });

  function buildInitialUserCode(lines){
    const len = lines.length;
    const arr = new Array(len + 1).fill('');
    arr[0] = lines[0];
    for (let i = 1; i < len; i++) arr[i + 1] = lines[i];
    return arr.join('\n');
  }


  // 타이핑 시작 시 타이머 시작
  useEffect(() => {
    if (userCode !== initialUserCode && !startTime) {
      const now = Date.now();
      setStartTime(now);
      if (editorRef.current){
        editorRef.current.startTime = now;
      }
    }
  }, [userCode, startTime, initialUserCode]);

  // useEffect(() => {
  //   if (editorRef.current) editorRef.current.typedChars = typedChars;
  // }, [typedChars]);

  // 경과 시간 업데이트 (밀리초 단위)
  useEffect(() => {
    if (!startTime || showModal) return;

    // 50ms마다 업데이트
    timerIntervalRef.current = window.setInterval(() => {
    // 50으로 나누지 않고, 경과 시간을 그대로 저장합니다.
    setElapsedTime(Date.now() - startTime);
    }, 50); // 업데이트 주기도 짧게 변경

    return () => {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [startTime, showModal]);

  // CPM, 단어 WPM, 진행도 계산
  useEffect(() => {
    if (!startTime || elapsedTime === 0 || showModal) return; // 모달이 열리면 계산 중지

    const minutes = elapsedTime / 60000 || 1;
    const total = typedChars + currentCorrect;

    // CPM: 분당 타이핑한 문자 수
    const calculatedCpm = Math.round(total / minutes) || 0;
    setCpm(calculatedCpm);

    // WPM: 분당 단어 수 (5자 = 1단어)
    const calculatedWpm = Math.round(total / 5 / minutes) || 0;
    setWpm(calculatedWpm);

    // 디버깅: 글자 수 비교 (개발 시에만 사용)
    // console.log('normalizedUserCode.length:', normalizedUserCode.length);
    // console.log('normalizedProblemCode.length:', normalizedProblemCode.length);
    // console.log('correctChars:', correctChars);
    // console.log('totalTypedChars:', totalTypedChars);

    // Debug log: real-time total for CPM
    // console.log('Real-time total chars for CPM:', total);
  }, [typedChars, currentCorrect, elapsedTime, startTime, showModal]);

  useEffect(() => {
    const prog = totalLines > 0 ? (completedLines / totalLines) * 100 : 0;
    setProgress(Math.round(prog));
  }, [completedLines, totalLines]);

  const handleGameCompleted = (totalTypedChars, elapsedMs) => {
    if (isGameCompleted) return;

    // const endTime = Date.now();
    // const finalElapsedMs = startTime ? endTime - startTime : 0;
    // const total = typedChars + finalLineCorrect;

    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const minutes = elapsedMs / 60000 || 1;

    // CPM: 분당 타이핑한 문자 수
    const finalCpm = Math.round(totalTypedChars / minutes) || 0;

    // WPM: 분당 단어 수 (5자 = 1단어)
    const finalWpm = Math.round(totalTypedChars / 5 / minutes) || 0;

    // 완성 시 최종 결과 저장 (모달에 표시 & 백엔드 전송용)
    const result = {
      cpm: finalCpm,
      wpm: finalWpm,
      progress: 100,
      time: elapsedMs, // 초 단위
      timestamp: new Date().toISOString(), // ISO 8601 형식 (백엔드 전송용)
    };

    console.log('Final calc:', { totalTypedChars, elapsedMs, finalCpm, finalWpm });;

    setElapsedTime(elapsedMs);       // <-- make stats UI match modal
    setCpm(finalCpm);
    setWpm(finalWpm);

    setFinalResult(result);
    setIsGameCompleted(true);
    setShowModal(true); // 완성 모달 표시 (이후 타이머와 계산 중지됨)

    // 백엔드로 결과 전송
    saveGameResultToBackend(result);

    console.log('게임 완료! 최종 결과:', result);

    // Debug log: final total from editor
    // console.log('Final total chars from editor:', totalTypedChars);
  };

  // 게임 결과 저장 API 호출
  const saveGameResultToBackend = async (result) => {
    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        console.error('인증 토큰이 없습니다. 결과 저장 불가');
        return;
      }

      if (!dictationId) {
        console.error('dictationId가 없습니다. 결과 저장 불가');
        return;
      }
//
      const payload = {
        dictationId: dictationId,
        cpm: result.cpm,
        wpm: result.wpm,
        acc: result.progress,
      };

      console.log('게임 결과 저장 중...', payload);
      const response = await saveGameResult(payload);
      console.log('게임 결과 저장 완료!', response);

      // 응답에서 rankingPercentage 가져오기
      if (response && response.rankingPercentage !== undefined) {
        setFinalResult((prev) => ({
          ...prev,
          rankingPercentage: response.rankingPercentage,
        }));
      }
    } catch (error) {
      console.error('게임 결과 저장 실패:', error);
      // 에러가 발생해도 게임 완료 모달은 표시
    }
  };

  // 코드 입력 핸들러
  const handleCodeChange = (value) => {
    setUserCode(value || '');
  };

  /**
   * 게임 재시작 핸들러
   */
  const handleRestart = () => {
    // 모든 상태 초기화
    setCpm(0);
    setWpm(0);
    setProgress(0);
    setStartTime(null);
    setElapsedTime(0);
    setCompletedLines(0); // 진행률 초기화
    setCurrentCorrect(0)
    setShowModal(false);
    setIsGameCompleted(false);
    // 코드 에디터 내용을 초기상태로 복구
    setUserCode(initialUserCode);
    setTypedChars(0);

    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 최종 결과 초기화
    setFinalResult({
      cpm: 0,
      wpm: 0,
      progress: 100,
      time: 0,
      timestamp: null,
      rankingPercentage: null,
    });

    setResetKey(k => k + 1);
  };

  /**
   * 게임 종료 핸들러 (메인으로 이동)
   */
  const handleEnd = () => {
    setShowModal(false);
    navigate('/main') // 메인 페이지로 이동
  };

  /**
   * 시간 포맷팅 (초 → MM:SS)
   */
  // --- [수정] 시간 포맷팅 함수 (MM:SS.ms) ---
  const formatTime = (milliseconds) => {
      if (typeof milliseconds !== 'number' || milliseconds < 0) return '00:00:00';
      const totalSeconds = Math.floor(milliseconds / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      const ms = Math.floor((milliseconds % 1000) / 10).toString().padStart(2, '0');
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms}`;
  };

  
  // 3. 데이터 로딩 중일 때 보여줄 화면 (이게 없으면 에러 날 수 있음)
  if (!dictation || problemLines.length === 0) {
    return <div className="loading-screen">문제를 불러오는 중입니다...</div>;
  }

  return (
    <div className="game-page">

      {/* 완성 모달 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">게임 완료!</h2>

            {/* 랭킹 정보 */}
            <div className="modal-ranking">
              <div className="modal-rank-item">
                <span className="modal-rank-value">
                  {finalResult.rankingPercentage !== null
                    ? `${finalResult.rankingPercentage}%`
                    : '-'}
                </span>
                <span className="modal-rank-label">상위</span>
              </div>
              <div className="modal-rank-item">
                <span className="modal-rank-value">{finalResult.cpm}</span>
                <span className="modal-rank-label">CPM</span>
              </div>
            </div>

            <div className="modal-stats">
              <div className="modal-stat-row">
                <span className="modal-stat-value">{finalResult.progress}%</span>
                <span className="modal-stat-label">진행도</span>
              </div>
              <div className="modal-stat-row">
                                <span className="modal-stat-value">{formatTime(finalResult.time)}</span>
                <span className="modal-stat-label">TIME</span>
              </div>
            </div>

            
            {/* 버튼 */}
            <div className="modal-buttons">
              <button className="modal-btn restart-btn" onClick={handleRestart}>
                Restart
              </button>
              <button className="modal-btn end-btn" onClick={handleEnd}>
                End
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 나가기 버튼 */}
      <button className="exit-btn" onClick={() => navigate('/main')}>
        ← 메인으로
      </button>

      {/* 메인 컨텐츠 영역 */}
      <div className="game-content">
        {/* 중앙: 코드 작성 영역 (한컴타자 스타일) */}
        <div className="coding-section-centered">
          <div className="section-header">
            <h2>{dictationTitle}</h2>
            <button className="reset-btn" onClick={handleRestart}>
              다시
            </button>
          </div>
        <div className="progress-bar-container">
          <div className="progress-bar-filler" style={{ width: `${progress}%` }}>
          </div>
        </div>
          <div className="code-editor">

            {/* Monaco Editor 레이어 (투명 배경) */}
            <div className="editor-layer">
              <style>
                {`
                  .unexpected-closing-bracket:not(.correct-char, .incorrect-char) {
                    color: inherit !important;
                  }
                  .monaco-editor .squiggly-error {
                    background: none !important;
                    border: none !important;
                  }
                  .correct-char {
                    color: green !important;
                  }
                  .incorrect-char {
                    color: red !important;
                    font-weight: bold !important;
                    background-color: rgba(255, 0, 0, 0.25) !important;
                  }
                  .ghost-text {
                    color: rgba(255, 255, 255, 0.5) !important;
                  }
                  .ime-input{
                    color: transparent !important;
                    background-color: transparent !important;
                  }
                  .current-line-background {
                    background-color: rgba(212, 212, 212, 1.0) !important;
                  }
                `}
              </style>
              <DictationCodeEditor
                ref={editorRef}
                key={resetKey}
                language={language}
                value={userCode}
                onChange={handleCodeChange}
                problemLines={problemLines}
                onLineCompleted={(correctCount) => {
                  setCompletedLines(prev => prev + 1);
                  setCurrentCorrect(0);
                }}
                onGameCompleted={handleGameCompleted}
                onCurrentLineCorrect={(count) => setCurrentCorrect(count)}
                onTypedCharsChange={setTypedChars}
                enableParticles={enableParticles}
                enableShake={enableShake}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 오른쪽 지표 버튼 영역 */}
      <div className="stats-bar">
        <div className="stat-item">
          {/* <DinoCharAnimation /> */}
          <ProgressDisplay progress={progress} />
        </div>
        <div className="stat-item">
          <span className="stat-label">CPM</span>
          <span className="stat-value">{cpm}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">진행도</span>
          <span className="stat-value">{progress}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">TIME</span>
          <span className="stat-value">{formatTime(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );
}

export default Dictation;