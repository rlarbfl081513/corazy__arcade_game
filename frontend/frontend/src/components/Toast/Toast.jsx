import { useEffect, useState } from 'react';
import './Toast.css';

/**
 * Toast 컴포넌트
 * @param {Object} props
 * @param {string} props.id - 토스트 고유 ID
 * @param {string} props.message - 표시할 메시지
 * @param {string} props.type - 토스트 타입 (success, error, warning, info)
 * @param {number} props.duration - 표시 시간 (ms)
 * @param {Function} props.onClose - 닫기 콜백
 */
function Toast({ id, message, type = 'info', duration = 3000, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 자동으로 사라지는 타이머
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    // 애니메이션 완료 후 제거
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'sound':
        return '♪';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast ${type} ${isExiting ? 'exiting' : ''}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose} aria-label="닫기">
        ×
      </button>
    </div>
  );
}

export default Toast;
