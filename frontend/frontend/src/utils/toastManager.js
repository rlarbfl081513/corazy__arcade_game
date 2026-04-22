/**
 * 전역 Toast 매니저
 * - 컴포넌트 외부(API 클라이언트 등)에서도 Toast를 표시할 수 있도록 함
 */

let toastFunction = null;

/**
 * Toast 함수 등록 (ToastProvider에서 호출)
 */
export const registerToast = (toast) => {
  toastFunction = toast;
};

/**
 * Toast 표시
 */
export const showToast = {
  success: (message, duration) => {
    if (toastFunction) {
      toastFunction.success(message, duration);
    } else {
      console.warn('Toast not registered. Message:', message);
    }
  },
  error: (message, duration) => {
    if (toastFunction) {
      toastFunction.error(message, duration);
    } else {
      console.error('Toast not registered. Error:', message);
    }
  },
  warning: (message, duration) => {
    if (toastFunction) {
      toastFunction.warning(message, duration);
    } else {
      console.warn('Toast not registered. Warning:', message);
    }
  },
  info: (message, duration) => {
    if (toastFunction) {
      toastFunction.info(message, duration);
    } else {
      console.info('Toast not registered. Info:', message);
    }
  },
};

export default showToast;
