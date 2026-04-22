import React from "react";
import './ProblemListModal.css'; // (이 CSS 파일에 .problem-list-content 등의 스타일이 있어야 합니다)
import solvedIcon from '@/assets/icon/solved.png'

/**
 * (수정)
 * BaseModal을 사용하는 대신, GameStartModal처럼
 * modal-overlay와 modal-content <div>를 직접 렌더링합니다.
 */
function ProblemListModal({ 
    isOpen, 
    onClose, 
    onSelectProblem,

    // 데이터 props
    problems, 
    total,
    isLoading,
    error,
    
    // 페이지네이션 props
    page, 
    limit,
    onNextPage,
    onPrevPage
}){
    
    if (!isOpen) return null;

    // level 값에 따라 보여줄 JSX를 객체로 미리 정의
    const levelComponents = {
        'EASY': <div className="option level-tag easy line">Easy</div>,
        'MEDIUM': <div className="option level-tag medium line">Medium</div>,
        'HARD': <div className="option level-tag hard line">Hard</div>,
        'VERY HARD': <div className="option level-tag very-hard line">Hard</div>,
    };


    return(
        <div className="modal-overlay">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                
                <div className="header-box">
                    <div className="icon-box"></div>
                    <h2>{'문제'} 목록</h2>
                    <div className="icon-box">
                        <button className="modal-btn-cancel-icon" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                <div className="problem-list-content">
                    <ul className="problem-list">
                        {problems && problems.length > 0 ? (
                            problems.map((prob) => (
                                <li key={prob.id}>
                                    <button
                                        className="problem-item-btn"
                                        onClick={() => onSelectProblem(prob)}
                                    >
                                        <div className="problem-info">
                                            <div className="box">
                                                {prob.isSolved === true ? (
                                                    <img src={solvedIcon} className="solved-badge" />
                                                ) : (
                                                    <img className="unsolved-badge" />
                                                )}
                                                <span className="problem-title">{prob.title}</span>
                                            </div>
                                            {/* <div className="box">
                                                {levelComponents[prob.diffculty] || (
                                                    <div className="option level-tag unknown">미분류</div>
                                                )}
                                               
                                            </div> */}

                                        </div>
                                        
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="no-problem">선택 가능한 문제가 없습니다.</li>
                        )}
                    </ul>
                </div>

            </div> 
        </div> 
    );
}

export default ProblemListModal;

