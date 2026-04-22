import React from "react";
import failCharacter from "@/assets/character/resultFail.png";
import PassCharacter from "@/assets/character/resultPass.png";
import Grading from "@/assets/character/grading.png";
import BaseButton from "@/components/buttons/BaseButton";
import { getStatusMessage, isSuccess } from "@/utils/statusMessages";
import "./RealSubmitModal.css";

function RealSubmitModal({ onClose, onExit, finalResult, progress, isReady }) {
  if (!finalResult) {
    // 진행률 계산 (소숫점 1자리에서 반올림하여 정수로 표시)
    let progressPercent = 0;
    let progressMessage = "채점 중입니다...";

    // 연결 상태 확인
    if (!isReady) {
      progressMessage = "채점 서버와 연결 중...";
    } else if (progress && progress.current && progress.total) {
      progressPercent = Math.round((progress.current / progress.total) * 100);
      progressMessage = `채점 중입니다... (${progressPercent}%)`;
    } else if (isReady) {
      progressMessage = "채점 서버와 연결 중...";
    }

    return (
      <div className="test-modal-content">
        <div className="loading-section">
          <img src={Grading} />
          <p>{progressMessage}</p>
          {progressPercent > 0 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 상태 코드에 따른 메시지 가져오기
  const statusInfo = getStatusMessage(finalResult.status);
  const success = isSuccess(finalResult.status);

  return (
    <div className="algorithm-result-modal">
      {success ? (
        <div className="result-box success">
          <img src={PassCharacter} alt="성공" />
          <div className="words">{statusInfo.title}</div>
          <p className="result-message">{statusInfo.message}</p>
        </div>
      ) : (
        <div className="result-box fail">
          <img src={failCharacter} alt="실패" />
          <div className="words">{statusInfo.title}</div>
          <p className="result-message">{statusInfo.message}</p>
        </div>
      )}

      <div className="btn-box">
        <BaseButton onClick={onClose}>Back to Algorithm</BaseButton>
        <BaseButton onClick={onExit}>Finish</BaseButton>
      </div>
    </div>
  );
}

export default RealSubmitModal;
