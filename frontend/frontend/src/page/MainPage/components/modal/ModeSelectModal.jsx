import React from "react";
import './ModeSelectModal.css';

function ModeSelectModal ({isOpen, onClose, onRelay, onBattle}) {

    const handleClose = () => {
        // setSelectedLanguage('');
        // setSelectedAlgorithm('');
        onClose();
    };
    
    return (
        <>
        <div className="modal-overlay">
            <div className="mode-select-modal">
                <div className="header-box">
                    <div className="icon-box"></div>
                    <div className="title">Game Mode</div>
                    <div className="icon-box">
                        <button className="modal-btn-cancel-icon" onClick={handleClose}>
                        <span class="material-symbols-outlined">close</span>
                        </button>   
                    </div>
                </div>        
                <div className="mode-list">
                    <button onClick={onRelay}>relay mode</button>
                    <button onClick={onBattle}>battle mode</button>
                </div>
            </div>
        </div>
        
        </>
    );
}

export default ModeSelectModal;