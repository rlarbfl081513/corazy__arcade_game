import { useState } from 'react';
import './ProblemGameStartModal.css';
import OptionButtons from '@/components/buttons/OptionButtons';
import { getAlgorithms } from '@/api/problemApi';
import { getLanguages } from '@/api/problemApi';

/**
 * 방 생성 모달 컴포넌트
 * - 방 이름, 문제 번호, 문제 제목, 언어, 최대 인원 입력
 */
function CreateBattleRoomModal({ isOpen, onClose, onBattle }) {

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="header-box">
          <div className="icon-box"></div>
          <h2>Create Battle Room</h2>
          <div className="icon-box">
            <button className="modal-btn-cancel-icon" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* 버튼 영역 */}
        {/* <div className="modal-buttons">
          <button className="modal-btn-confirm">
            방 만들기
          </button>
        </div> */}
      </div>
    </div>
  );
}

export default CreateBattleRoomModal;
