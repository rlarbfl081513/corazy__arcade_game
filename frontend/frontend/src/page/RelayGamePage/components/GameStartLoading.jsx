import { useState, useEffect } from 'react';
import './GameStartLoading.css';
import meeting from '@/page/RelayGamePage/assests/meeting.png';
import turning from '@/page/RelayGamePage/assests/turning.png';
import { AnimatePresence, motion } from 'framer-motion';


function GameStartLoading({ onComplete }) {
  const [currentPhase, setCurrentPhase] = useState(0);

  // 보여줄 텍스트 정의
  const phase0Text = "이제 곧 시작합니다.\n자신의 턴에 맞추어 코드를 작성해주세요.";
  const phase1Text = "앞으로 3분간 전략회의 시간이 주어집니다!";

  useEffect(() => {
    console.log('[GameStartLoading] 마운트됨, 타이머 시작');

    // 5초 후 Phase 1로
    const timer1 = setTimeout(() => {
      console.log('[GameStartLoading] 5초 경과 - Phase 1로 전환');
      setCurrentPhase(1);
    }, 5000);

    // 10초 후 onComplete 호출
    const timer2 = setTimeout(() => {
      console.log('[GameStartLoading] 10초 경과 - onComplete 호출');
      onComplete();
    }, 10000);

    return () => {
      console.log('[GameStartLoading] 언마운트 - 타이머 정리');
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열 - 마운트 시 딱 한 번만 실행

  return (
    <div className="game-start-loading-backdrop">
      <div className="game-start-loading-modal">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="phase-wrapper"
          >
            <img src={currentPhase === 0 ? turning : meeting} alt="" />
            <div className="modal-p">
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {currentPhase === 0 ? phase0Text : phase1Text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GameStartLoading;