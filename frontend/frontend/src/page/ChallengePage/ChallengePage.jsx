import { useRef, useState, useMemo, useEffect, useLocation } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import "./ChallengePage.css";
import BaseModal from "@/components/BaseModal";
import ResetModal from "./components/modal/ResetModal";
import RealSubmitModal from "@/page/ChallengePage/components/modal/RealSubmitModal";
import { useTheme } from "@/components/ThemeProvider";
import { enqueueSubmission, getProblemInfo } from "@/api/problemApi";
import useSubmissionWebSocket from "@/hooks/useSubmissionWebSocket";

// 스플릿 화면 구현
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// 화면 구성 패널
import ProblemPanel from "./components/ProblemPanel";
import EditorPanel, { SAVE_STATUS, DEFAULT_CODE_TEMPLATES } from "./components/EditorPanel";
import OutputPanel from "./components/OutputPanel";
import cancelIcon from "@/assets/icon/cancel.png";
import backIcon from "@/assets/icon/back.png";
import submitIcon from "@/assets/icon/submit.png";

// 환경설정 및 BGM
import useGameSettings from '@/hooks/useGameSettings';

const LANG_TO_MONACO = {
  'Java': 'java',
  'Python': 'python',
  'C++': 'cpp',
  'Javascript': 'javascript',
  'JavaScript': 'javascript'
};

function Challenge() {
  const navigate = useNavigate();
  const { problemId } = useParams();
  const [challenge, setChallenge] = useState(null);

  const { allSettings } = useGameSettings();
  const [activeMode, setActiveMode] = useState('challenge');
  const currentModeSettings = allSettings?.[activeMode] || {};
  const enableParticles = currentModeSettings.particles ?? true;
  const enableShake = currentModeSettings.shake ?? false;

  // 데이터 불러오기 및 가공
  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        // 1. ID로 상세 문제 조회
        const response = await getProblemInfo({ problemId: problemId });
        
        const info = response.info;
        const testcases = response.testcases;

        const searchParams = new URLSearchParams(location.search);
        const langFromUrl = searchParams.get('lang');

        // URL 값이 있으면 그거 쓰고, 없으면 기본값 Javascript
        const defaultLang = langFromUrl || 'Javascript';
        const monacoLang = LANG_TO_MONACO[defaultLang] || 'javascript';

        // 3. UI에 맞는 형태로 데이터 가공 (ModalManager가 하던 일)
        const mappedData = {
          id: info.problemId,
          title: info.title,
          problemInfo: info.description,
          level: info.difficulty,
          inputDescription: info.inputDescription,
          outputDescription: info.outputDescription,
          limitations: `시간: ${info.timeLimit}ms, 메모리: ${info.memoryLimit}MB`,
          examplesList: testcases?.testCases || [],
          language: defaultLang,
          algorithm: info.algorithm || '알고리즘',
          monacoLanguage: monacoLang,
          isSolved: false
        };

        setChallenge(mappedData); 

      } catch (error) {
        console.error("문제 로딩 실패", error);
        alert("문제를 불러올 수 없습니다.");
        navigate('/main');
      }
    };
    
    if (problemId) fetchProblemData();
  }, [problemId, navigate, location.search]);



  // 모달
  const [modalType, setModalType] = useState(null);
  const [testResult, setTestResult] = useState(undefined);
  const [fianlResult, setFinalResult] = useState(undefined);
  const [saveStatus, setSaveStatus] = useState(null);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // 에디터 내용 바뀔때마다 unsaved로 상태 변경
    editor.onDidChangeModelContent(() => {
      setSaveStatus(SAVE_STATUS.UNSAVED);
    });
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setModalType(null);
    // 모달 닫았을때 결과값은 초기화
    setFinalResult(null);
  };

  // 중간에 저장할 수 있는 버튼
  const handleSaveCode = async () => {
    console.log("코드가 저장되었습니다.");

    if (!editorRef.current) return;

    // 눌렀을때 '저장중'
    setSaveStatus(SAVE_STATUS.SAVING);

    try {
      // 저장 성공 시 '저장됨' 상태됨

      // 테스트
      // 1.5초간 API 호출을 흉내내는 Promise
      console.log("임시 저장 시작 (1.5초 대기)...");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("임시 저장 성공");

      // const code = editorRef.current.getValue();
      // await saveCodeToApi(code);
      setSaveStatus(SAVE_STATUS.SAVED);
    } catch (error) {
      // 저장 실패 시 '수정됨' 상테로
      console.log("저장 실패", error);
      setSaveStatus(SAVE_STATUS.UNSAVED);
    }
  };

  // --- 7. WebSocket 훅(Hook) 사용 ---
  const [submissionUuid, setSubmissionUuid] = useState(null);
  const [isEvaluateMode, setIsEvaluateMode] = useState(false);
  const {
    progress, // 진행률 (예: 3/10)
    testCases, // 테스트케이스 결과 배열 (API의 'testcase' 메시지)
    finalResult, // 최종 채점 결과 (API의 'result' 메시지)
    error, // WebSocket 에러
    isComplete, // 완료 여부
    isReady, // 준비 여부
  } = useSubmissionWebSocket(submissionUuid); // UUID를 state로 관리

  // --- 8. (중요) 데이터 매핑 ---
  // WebSocket 훅이 반환한 `testCases` 배열을
  // `TestCaseTabs` 컴포넌트가 이해할 수 있는 형식으로 변환합니다.
  const mappedTestCases = useMemo(() => {
    if (!testCases) return [];

    return testCases.map((tc) => ({
      testCase: tc.test_case_number,
      status: tc.status === "AC" ? "Success" : "Fail", // 'AC' -> 'Success'
      input: tc.input,
      expectation: tc.expected_output,
      output: tc.actual_output,
      errorMessage: tc.error_message, // 컴파일/런타임 에러 메시지
    }));
  }, [testCases]); // testCases 배열이 바뀔 때만 이 코드가 실행됩니다.

  // --- 9. OutputPanel에 보낼 로딩 상태 ---
  // 'running' 상태를 progress나 submissionUuid로 관리합니다.
  const isLoading = submissionUuid && !isComplete && !error;

  // 연결 상태 메시지
  const connectionStatus = submissionUuid
    ? isReady
      ? "✅ 채점 준비 완료"
      : "🔌 연결 중..."
    : null;

  // --- 10. 테스트 코드 제출하기 (mockApi -> enqueueSubmission) ---
  const onTestSubmit = async () => {
    if (!editorRef.current) return;

    const currentCode = editorRef.current.getValue();

    if (!currentCode || currentCode.trim() === "") {
      alert("코드를 작성해주세요.");
      return;
    }

    try {
      const data = await enqueueSubmission({
        problem_id: challenge.id,
        code: currentCode,
        language: challenge.monacoLanguage,
        mode: "SAMPLE",
      });

      setIsEvaluateMode(false);
      setSubmissionUuid(data.submission_uuid);
    } catch (apiError) {
      console.error("테스트 제출 API 실패:", apiError);
    }
  };

  // --- 11. 최종 제출 (mockApi -> enqueueSubmission) ---
  const onRealSubmit = async () => {
    if (!editorRef.current) return;

    const currentCode = editorRef.current.getValue();

    if (!currentCode || currentCode.trim() === "") {
      alert("코드를 작성해주세요.");
      return;
    }

    setModalType("real");

    try {
      const data = await enqueueSubmission({
        problem_id: challenge.id,
        code: currentCode,
        language: challenge.monacoLanguage,
        mode: "EVALUATE",
      });

      setIsEvaluateMode(true);
      setSubmissionUuid(data.submission_uuid);
    } catch (apiError) {
      console.error("최종 제출 API 실패:", apiError);
    }
  };

  // 초기화 버튼
  const handleResetEditor = () => {
    setModalType("reset");
  };

  const onConfirmReset = () => {
    // 언어별 기본 코드 템플릿으로 리셋
    const defaultCode = DEFAULT_CODE_TEMPLATES[challenge?.monacoLanguage] || "";
    editorRef.current.setValue(defaultCode);
    closeModal();
  };

    // 디버깅: 챌린지 정보 출력
  useEffect(() => {
    if (challenge) {
      console.log('=== Challenge Page Debug ===');
      console.log('선택한 언어:', challenge.language);
      console.log('선택한 알고리즘:', challenge.algorithm);
      console.log('문제 번호:', challenge.id);
      console.log('Monaco 언어 ID:', challenge.monacoLanguage);
      console.log('============================');
    }
  }, [challenge]);

  if (!challenge) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '20% '}}>문제를 불러오는 중입니다...</div>;
  }

  const { theme } = useTheme();

  return (
    <div className="ChallengePage">
      <div className="container">
        {/* 메인 화면 구성 */}
        <div className="main-container" data-theme={theme}>
          <div className="main-title">
            <div className="sub">
              <img src={backIcon} className="icon to-home" onClick={() => navigate('/main')} />
            </div>
            <div className="sub">
              <div className="big title">{challenge.title}</div>
            </div>
            <div className="sub">
              <img src={cancelIcon} className="icon to-home" onClick={() => navigate('/main')} />
            </div>
          </div>
          <PanelGroup direction="horizontal" className="main-panel row-section">
            {/* 왼쪽 : 문제나오는 화면 + 게임 요소*/}
            <Panel defaultSize={30} minSize={0}>
              <PanelGroup direction="vertical" className="col-section">
                {/* 문제 화면 */}
                <Panel minSize={0} className="scrollable-panel">
                  <ProblemPanel challenge={challenge} />
                </Panel>

                {/* 혹시 시간이 된다면 테스트 결과에따른 게임적 효과 넣을 공간 */}
                {/* 조절 핸들 */}
                {/* <PanelResizeHandle className='handle col-handle'> */}
                {/* <div className="col-dash"></div>
                                    <div className="col-move-handel"></div>
                                </PanelResizeHandle> */}
                {/* 게임요소 들어갈 공간 화면 */}
                {/* <Panel minSize={0} className='scrollable-panel'>
                                    <CharacterPanel />
                                </Panel> */}
              </PanelGroup>
            </Panel>

            {/* 조절 핸들 */}
            <PanelResizeHandle className="handle row-handle">
              <div className="row-dash"></div>
              <div className="row-move-handel">
                <div
                  className="circle"
                  style={{
                    borderRadius: "20px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#dcdcdcff",
                  }}
                ></div>
                <div
                  className="circle"
                  style={{
                    borderRadius: "20px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#dcdcdcff",
                  }}
                ></div>
                <div
                  className="circle"
                  style={{
                    borderRadius: "20px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#dcdcdcff",
                  }}
                ></div>
              </div>
            </PanelResizeHandle>

            {/* 오른쪽 : 에디터와 테케 화면 */}
            <Panel defaultSize={70} minSize={0}>
              <PanelGroup direction="vertical" className="col-section">
                {/* 에디터 화면 */}
                <Panel
                  defaultSize={50}
                  minSize={0}
                  className="scrollable-panel"
                >
                  <EditorPanel
                    language={challenge?.monacoLanguage}
                    onMount={handleEditorDidMount}
                    onTestSubmit={onTestSubmit}
                    handleResetEditor={handleResetEditor}
                    onSaveCode={handleSaveCode}
                    saveStatus={saveStatus}
                    enableParticles={enableParticles}
                    enableShake={enableShake}
                  />
                </Panel>

                {/* 조절 핸들 */}
                <PanelResizeHandle className="handle col-handle">
                  <div className="col-dash"></div>
                  <div className="col-move-handel">
                    <div
                      className="circle"
                      style={{
                        borderRadius: "20px",
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#dcdcdcff",
                      }}
                    ></div>
                    <div
                      className="circle"
                      style={{
                        borderRadius: "20px",
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#dcdcdcff",
                      }}
                    ></div>
                    <div
                      className="circle"
                      style={{
                        borderRadius: "20px",
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#dcdcdcff",
                      }}
                    ></div>
                  </div>
                </PanelResizeHandle>

                {/* 테케 나오는 화면 */}
                <Panel
                  defaultSize={30}
                  minSize={0}
                  className="scrollable-panel"
                >
                  <OutputPanel
                    testResults={isEvaluateMode ? [] : mappedTestCases}
                    finalResult={finalResult}
                    isLoading={isLoading}
                    connectionStatus={connectionStatus}
                    isReady={isReady}
                    progress={progress}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
          <div className="submit-btn">
            <button className="btn real-submit-btn" onClick={onRealSubmit}>
              {/* <img src={submitIcon} className='btn-icon'/> */}
              <div className="icon-name">Submit</div>
            </button>
          </div>
        </div>

        {/* 모달 */}
        <div id="modal-root"></div>
        {/* 모달타입이 있으면 해당 모달 오픈 */}
        <BaseModal isOpen={modalType !== null} onClose={closeModal}>
          {modalType === "real" && (
            <RealSubmitModal
              onClose={closeModal}
              onExit={() => navigate('/main')}
              finalResult={finalResult}
              progress={progress}
              isReady={isReady}
            />
          )}
          {modalType === "reset" && (
            <ResetModal onClose={closeModal} onConfirm={onConfirmReset} />
          )}
        </BaseModal>
      </div>
    </div>
  );
}

export default Challenge;
