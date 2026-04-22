import React, { useEffect } from 'react';
import BaseModal from '@/components/BaseModal';
import useGameStore from '@/stores/gameStore';
import './GameModal.css';

/**
 * 제출 결과 모달 (오답일 때)
 * - 2초간 표시 후 자동으로 닫힘
 * - 계속 게임 진행 가능
 */
function SubmitResultModal({ isOpen, data }) {
  const clearSubmissionResult = useGameStore((state) => state.clearSubmissionResult);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        clearSubmissionResult();
      }, 2000); // 2초 후 모달 닫기

      return () => clearTimeout(timer);
    }
  }, [isOpen, clearSubmissionResult]);

  if (!isOpen || !data) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={clearSubmissionResult}>
      <div className="game-modal submit-result-modal">
        <div className="modal-icon failure">❌</div>
        <h2 className="modal-title">{data.result || '틀렸습니다'}</h2>
        <p className="modal-message">{data.message || '다시 도전해보세요'}</p>
      </div>
    </BaseModal>
  );
}

export default SubmitResultModal;
