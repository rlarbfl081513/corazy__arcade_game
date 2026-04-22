// TestCaseTabs.jsx
import React from 'react';
import './TestCaseTabs.css';
import outputFail from '@/assets/icon/outputFail.png';
import outputSuccess from '@/assets/icon/outputSuccess.png';

function TestCaseTabs({ results, activeCaseId, onTabClick }) {
  return (
    <div className="test-case-tabs">
      {results.map((caseResult) => (
        <button
          key={caseResult.testCase}
          className={`tab-btn ${caseResult.status.toLowerCase()} ${
            activeCaseId === caseResult.testCase ? 'active' : ''
          }`}
          onClick={() => onTabClick(caseResult)} // 클릭 시 부모의 state 변경
        >
          {caseResult.status === 'Fail' ? (
            // 실패 시 체크박스 디자인
            <div className="case-img case-fail"><img className='tabImg' src={outputFail}/></div>
          ) : (
            <div className="case-img case-success"><img className='tabImg' src={outputSuccess}/></div>
          )}
          <div className="case"> Case {caseResult.testCase}</div>
         
        </button>
      ))}
    </div>
  );
}

export default TestCaseTabs;