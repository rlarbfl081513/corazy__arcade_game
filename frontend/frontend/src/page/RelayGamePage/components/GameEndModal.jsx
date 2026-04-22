import React from 'react';
import BaseModal from '@/components/BaseModal';
import './GameModal.css';

/**
 * 게임 종료 모달
 * - 정답으로 게임 종료: 문제를 해결한 유저 정보 표시
 * - 중단으로 게임 종료: 퇴장한 유저 정보 표시
 * - 확인 버튼으로 메인페이지 이동
 */
function GameEndModal({ isOpen, data, onConfirm }) {
  if (!isOpen || !data) return null;

  // 게임이 중단되었는지 확인 (누군가 게임 중 퇴장)
  const isAborted = data.action === 'GAME_ABORTED';
  const icon = isAborted ? '⚠️' : '🎉';
  const title = isAborted ? '게임 중단' : '게임 종료';
  const message = data.message || `${data.currentTurnNickname}님이 문제를 해결했습니다!`;

  return (
    <BaseModal isOpen={isOpen} onClose={() => {}}>
      <div className="game-modal game-end-modal">
        <div className={`modal-icon ${isAborted ? 'warning' : 'success'}`}>{icon}</div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <button className="modal-confirm-btn" onClick={onConfirm}>
          확인
        </button>
      </div>
    </BaseModal>
  );
}

export default GameEndModal;
