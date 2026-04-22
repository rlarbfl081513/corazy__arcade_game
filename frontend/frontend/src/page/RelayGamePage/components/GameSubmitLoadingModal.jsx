import React, { useEffect, useRef } from 'react';
import './GameSubmitLoadingModal.css';
import loadingFaceDefault from '@/page/RelayGamePage/assests/loadingFaceDefault.png';
import nervousFace from '@/page/RelayGamePage/assests/nervousFace.png';

function GameSubmitLoadingModal({ roomName }) {
    const svgRef = useRef(null);
    const frontGroupRef = useRef(null);

    useEffect(() => {
        const svg = svgRef.current;
        const frontGroup = frontGroupRef.current;

        if (!svg || !frontGroup) return;

        // 1. ViewBox 동적 설정 (원본 코드 로직 유지)
        try {
            const box = svg.getBBox();
            // box가 0일 경우를 대비해 기본값 설정 혹은 예외처리
            if (box.width > 0 && box.height > 0) {
                svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
            } else {
                // BBox 계산 실패 시 대략적인 좌표 하드코딩 (원본 좌표 기반)
                svg.setAttribute("viewBox", "80 200 400 250");
            }
        } catch (e) {
            console.warn("SVG BBox Error:", e);
        }

        const lines = frontGroup.querySelectorAll('line');

        // 2. 애니메이션 함수
        const run = () => {
            lines.forEach((currLine, i) => {
                const length = currLine.getTotalLength(); // 길이 계산

                // 스타일 주입 (애니메이션 시작)
                setTimeout(() => {
                    currLine.setAttribute(
                        'style',
                        `stroke: #ff4d4f;
                         stroke-dasharray: ${length}px;
                         stroke-dashoffset: ${length}px;
                         animation: dash 0.1s ease-out forwards 0.1s;
                         animation-delay: ${0.06 * i}s`
                    );
                }, i);

                // 스타일 제거 (초기화)
                setTimeout(() => {
                    currLine.removeAttribute("style");
                }, (100 * (i + 2)) - ((i + 1) * 20));
            });
        };

        // 3. 실행 및 반복 설정
        run(); // 최초 실행
        const intervalId = setInterval(run, 2000); // 2초마다 반복

        // 뒷정리
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="loading-container">
            <div className="loading-box">
                <img className="loading-face default" src={nervousFace} alt="loading character"/>
                <div className="loading-title">
                </div>
                <div className="lodaing-animation">
                    <div className="loading-info">
                        <div className="loading-num">100</div>
                        <div className="loading-title-box">
                            <div className="judging">
                                <div className="circle"></div>
                                JUDGING
                            </div>
                            <div className="percent">PER</div>

                        </div>
                    </div>
                    {/* 기존 heartbeat-line 안에 새로운 SVG 구조 삽입 */}
                    <div className="heartbeat-line">
                        <svg id="loader" ref={svgRef} xmlns="http://www.w3.org/2000/svg">
                            <g id="back">
                                <line x1="88.5" x2="237" y1="316" y2="317"/>
                                <line x1="237" x2="244" y1="317" y2="290"/>
                                <line x1="244" x2="261" y1="290" y2="403"/>
                                <line x1="261" x2="275" y1="403" y2="225"/>
                                <line x1="275" x2="285" y1="225" y2="335"/>
                                <line x1="296.5" x2="454.5" y1="317" y2="317"/>
                                <line x1="286" x2="295" y1="334" y2="317"/>
                            </g>

                            <g id="front" ref={frontGroupRef}>
                                <line x1="88.5" x2="237" y1="316" y2="317"/>
                                <line x1="237" x2="244" y1="317" y2="290"/>
                                <line x1="244" x2="261" y1="290" y2="403"/>
                                <line x1="261" x2="275" y1="403" y2="225"/>
                                <line x1="275" x2="285" y1="225" y2="335"/>
                                <line x1="286" x2="295" y1="334" y2="317"/>
                                <line x1="296.5" x2="454.5" y1="317" y2="317"/>
                            </g>
                        </svg>
                    </div>
                </div>
                <div className="loading-text">
                    "{roomName || '우리'}" 팀의 소중한 코드를<br />
                    정답과 꼼꼼하게 비교하고 있습니다.
                </div>
            </div>
        </div>
    );
}

export default GameSubmitLoadingModal;
