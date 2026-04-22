// TestCaseDetails.jsx
import React from 'react';
import './TestCaseDetails.css';

function TestCaseDetails({ details }) {
  // 선택된 케이스가 없으면(null) 아무것도 그리지 않음
  if (!details) {
    return (
        <div className="test-case-details-initial">
            <p>상단의 테스트 케이스 탭을 선택하여 상세 결과를 확인하세요.</p>
        </div>
    );
  }

  // Fail 케이스를 세분화
  const hasError = details.errorMessage && details.errorMessage.trim() !== '';
  const isFail = details.status === 'Fail' || details.status === 'FAILURE';

  // 선택된 케이스의 상태에 따라 다른 UI를 반환
  return (
    <div className="test-case-details">
      {isFail ? (
        <pre className="content fail-output">
          {hasError ? (
            // 2번 케이스: 컴파일 실패 또는 런타임 에러 - 오류 메시지만 표시
            <>
              <div className="value">
                <span className="content" style={{ color: 'red', fontWeight: 'bold' }}>실행 오류가 발생했습니다.</span>
              </div>
              <div className="value">
                <span className="content" style={{ color: 'red' }}>{details.errorMessage}</span>
              </div>
            </>
          ) : (
            // 1번 케이스: 컴파일 성공했으나 정답 틀림 - 입력값, 기댓값, 실행결과 표시
            <>
              <div className="value">
                <span className="title">입력값</span>
                <span className="content">{details.input}</span>
              </div>
              <div className="value">
                <span className="title">기댓값</span>
                <span className="content">{details.expectation}</span>
              </div>
              <div className="value">
                <span className="title">실행결과</span>
                <span className="content">{details.output || '(출력 없음)'}</span>
              </div>
            </>
          )}
        </pre>
      ) : (
        <pre className="content success-output">
          <div className="value">
            <span className="title">입력값</span>
            <span className="content">{details.input}</span>
          </div>
          <div className="value">
            <span className="title">기댓값</span>
            <span className="content">{details.expectation}</span>
          </div>
          <div className="value">
            <span className="title">실행결과</span>
            <span className="content">{details.output}</span>
          </div>
        </pre>
      )}
    </div>
  );
}

export default TestCaseDetails;
