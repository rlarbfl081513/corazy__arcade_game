import React from "react";
import ReactDOM from 'react-dom';

function BaseModal({ isOpen, onClose, children }) {
    if (!isOpen) {
        return null;
    }

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* 닫기 버튼 */}
                {/* <button className="modal-close-btn" onClick={onClose}>&times;</button> */}
                {/* 채울 공간 */}
                {children}
            </div>
        </div>
        ,document.getElementById('modal-root')
    );
}

export default BaseModal;