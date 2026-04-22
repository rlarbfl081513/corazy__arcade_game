import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from './Toast';
import { registerToast } from '@/utils/toastManager';

const ToastContext = createContext(null);

/**
 * Toast Provider 컴포넌트
 * - 앱 최상위에서 감싸서 사용
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * 토스트 추가
   * @param {string} message - 메시지
   * @param {string} type - success, error, warning, info, sound
   * @param {number} duration - 표시 시간 (ms)
   */
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random(); // 고유 ID 생성
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  /**
   * 토스트 제거
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * 편의 함수들
   */
  const toast = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    sound: (message, duration) => showToast(message, 'sound', duration),
  };

  /**
   * 전역 toast 함수 등록 (컴포넌트 외부에서도 사용 가능하도록)
   */
  useEffect(() => {
    registerToast(toast);
  }, [toast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Toast Hook
 * @returns {Object} { success, error, warning, info, sound }
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export default ToastContext;
