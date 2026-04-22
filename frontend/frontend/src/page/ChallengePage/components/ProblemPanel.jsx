import React from "react";
import './ProblemPanel.css';
import solvedIcon from '@/assets/icon/solved.png'
import KatexRenderer from "@/components/KatexRenderer";

function ProblemPanel({challenge}) {

   // level 값에 따라 보여줄 JSX를 객체로 미리 정의
    const levelComponents = {
        'EASY': <div className="option level-tag easy line">Easy</div>,
        'MEDIUM': <div className="option level-tag medium line">Medium</div>,
        'HARD': <div className="option level-tag hard line">Hard</div>,
        'VERY HARD': <div className="option level-tag very-hard line">Hard</div>,
    };

    if (!challenge) {
        return (
        <div className="problem-section">
            <div className="problem">
            <span className='title'>Loading...</span>
            <p>문제를 불러오는 중입니다...</p>
            </div>
        </div>
        );
    }

    // 입출력 예시 리스트
    const exampleElements = (challenge.examplesList || []).map((ex, index) => (
        <div key={ex.id} className="example-case">
            <div className="input-box small-box">
                <div className='input-title'>입력 # {index + 1}</div>
                <div className='input-title'>
                    <KatexRenderer text={ex.input} />
                </div>
            </div>
            <div className="divide-line"></div>
            <div className="output-box small-box">
                <div className='output-title'>출력 # {index + 1}</div>
                <div className='output-title'>
                    <KatexRenderer text={ex.output} />
                </div>
            </div>
        </div>
    ));


    return (
        <>
        <div className="problem-section">    
            {/* 문제 설명 */}
            <div className="box">
                <div className="pro-name">
                    <div className="big title">{challenge.title}</div>
                    {challenge.isSolved === true && (
                        <img src={solvedIcon} className="option" />
                    )}
                </div>
 
                 {/* 선택한 언어와 알고리즘 */}
                <div className="box">
                    <div className="content options">
                        {levelComponents[challenge.level] || (
                            <div className="option level-tag unknown">미분류</div>
                        )}

                        <div className="option">{challenge.language}</div>
                        <div className="option">{challenge.algorithm}</div>
                    </div>
                </div>
                <div className="content">
                    <div className="option info">
                        <KatexRenderer text={challenge.problemInfo} />
                    </div>
                </div>
            </div>
            {/* 입력 사항 */}
            <div className="box">
                <div className="title">입력</div>
                <div className="content">
                    <KatexRenderer text={challenge.inputDescription} />
                </div>
            </div>
            {/* 출력 사항 */}
            <div className="box">
                <div className="title">출력</div>
                <div className="content">
                    <KatexRenderer text={challenge.outputDescription} />
                </div>
            </div>
            {/* 제한 사항 */}
            <div className="box">
                <div className="title">제한 사항</div>
                <div className="content">
                    <KatexRenderer text={challenge.limitations} />
                </div>
            </div>
            {/* 입출력 예 */}
            <div className="box">
                <div className="title">입출력 예</div>
                <div className="content">
                    {exampleElements}
                </div>
            </div>
        </div>
        </>
    );
}

export default ProblemPanel;