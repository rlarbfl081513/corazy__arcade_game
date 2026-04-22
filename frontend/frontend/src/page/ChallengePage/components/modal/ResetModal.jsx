import React from "react";
import './ResetModal.css';

function ResetModal ({onClose, onConfirm}) {
    return (
        <>
        <div className="reset-modal">
            <div className="modal-content">
                <div className="title">정말 초기화 하시겠습니까?</div>
                <div className="content">확인을 누르면 작성된 코드가 모두 삭제됩니다.</div>
            </div>
            <div className="modal-btn">
                <button className="cancel" onClick={onClose}>Cancel</button>
                <button className="confrim" onClick={onConfirm}>Comfirm</button>
            </div>
           
        </div>
        </>
    );
}

export default ResetModal;