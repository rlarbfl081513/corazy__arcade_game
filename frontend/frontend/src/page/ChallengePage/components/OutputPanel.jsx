import React, { useState, useEffect } from "react";
import './OutputPanel.css'; // 탭 스타일 CSS (반드시 필요)

// 1. 분리한 자식 컴포넌트들을 import 합니다.
import OverallStatusHeader from '@/page/ChallengePage/components/outputPanel/OverallStatusHeader';
import TestCaseTabs from '@/page/ChallengePage/components/outputPanel/TestCaseTabs';
import TestCaseDetails from '@/page/ChallengePage/components/outputPanel/TestCaseDetails';

function OutputPanel ({testResults, finalResult, isLoading, connectionStatus, isReady, progress}) {

    // [핵심] 현재 선택된 테스트 케이스(객체)를 저장할 state
    const [selectedCase, setSelectedCase] = useState(null);

    // testResults (전체 채점 결과) prop이 변경될 때마다 실행
    useEffect(() => {
        if (testResults && Array.isArray(testResults) && testResults.length > 0) {
            const currentCaseExists = selectedCase && testResults.some(tc => tc.testCase === selectedCase.testCase);
            if (!currentCaseExists) {
                setSelectedCase(testResults[0]);
            }
        } else {
            setSelectedCase(null);
        }
    }, [testResults, selectedCase]);


    // [수정] 콘텐츠 영역 렌더링 로직
    const renderContent = () => {
        // 1. 채점 중이지만 아직 결과가 없는 경우 (로딩)
        if (isLoading && (!testResults || testResults.length === 0)) {
            return (
                <div className="test-modal-content">
                    <div className="loading-section">
                        {progress && progress.message ? (
                            <p>{progress.message}</p>
                        ) : (
                            <p>채점 중입니다...</p>
                        )}
                        <div className="spinner"></div>
                    </div>
                </div>
            );
        }

        // 2. 테스트 결과가 하나라도 있는 경우 (채점 시작됨)
        if (testResults && testResults.length > 0) {
            return (
                <>
                    <TestCaseTabs
                        results={testResults}
                        activeCaseId={selectedCase?.testCase}
                        onTabClick={setSelectedCase}
                    />
                    <TestCaseDetails
                        details={selectedCase}
                    />
                </>
            );
        }

        // 3. 연결은 되었지만 아직 채점 시작 전 (준비 완료)
        if (isReady) {
            return (
                <div className="output-status-message">
                    <div className="status-icon ready">✅</div>
                    <p>{connectionStatus || "채점 준비 완료"}</p>
                    <p className="sub-message">채점을 시작합니다...</p>
                </div>
            );
        }
        
        // 4. WebSocket 연결 중
        if (connectionStatus) {
             return (
                <div className="output-status-message">
                    <div className="status-icon connecting">🔌</div>
                    <p>{connectionStatus}</p>
                    <div className="loading-spinner"></div>
                </div>
            );
        }

        // 5. 초기 상태 (아무것도 실행 안 함)
        return (
            <div className="test-results-content initial">
                <p>코드를 작성하고 'Run' 버튼을 눌러 테스트를 실행하세요.</p>
            </div>
        );
    };

    // 2. 컴포넌트의 return 문은 '하나'만 존재합니다.
    return (
        <div className="output-section">
            
            {/* ▼ "늘 보이는 영역" (헤더) - [요구사항 1] 자식 컴포넌트 ▼ */}
            <OverallStatusHeader
                total={finalResult?.total_test_cases} 
                success={finalResult?.passed_test_cases}
                fail={finalResult?.failed_test_cases}
            />
            
            {/* ▼ "상태에 따라 바뀌는 영역" (콘텐츠) ▼ */}
            <div className="content-area">
                {renderContent()}
            </div>
        </div>
    );
}

export default OutputPanel;
