/**
 * API 에러 핸들러
 * - 에러 메시지 추출 및 사용자 친화적 메시지 반환
 */

export const getErrorMessage = (error) => {
  // 네트워크 에러
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
    return '네트워크 연결을 확인해주세요.';
  }

  // 타임아웃 에러
  if (error.code === 'ECONNABORTED') {
    return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
  }

  // HTTP 에러
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // 백엔드에서 보낸 에러 메시지
    if (data?.message) {
      // SQL 에러 패턴 감지 (임시 처리)
      const message = data.message;

      // 중복 닉네임 에러 (SQL 에러 패턴)
      if (message.includes("Duplicate entry") && message.includes("nickname")) {
        return '이미 사용 중인 닉네임입니다.';
      }

      return message;
    }

    // 에러 코드별 메시지 (백엔드 명세)
    const errorCode = data?.code || data?.errorCode;
    if (errorCode) {
      switch (errorCode) {
        // 사용자 관련 에러
        case 'USER-400-01':
          return '닉네임은 필수입니다.';
        case 'USER-400-02':
          return '닉네임은 2자 이상 20자 이하여야 합니다.';
        case 'USER-400-03':
          return '닉네임은 한글, 영문, 숫자, 밑줄만 허용됩니다.';
        case 'USER-409-01':
          return '이미 사용 중인 닉네임입니다.';

        // 구글 로그인 관련 에러
        case 'AUTH-400-01':
          return '인가 코드는 필수입니다.';
        case 'AUTH-400-02':
          return '닉네임은 필수입니다.';
        case 'AUTH-500-01':
          return 'Google 액세스 토큰 요청에 실패했습니다.';
        case 'AUTH-500-02':
          return 'Google 사용자 정보 요청에 실패했습니다.';

        default:
          break;
      }
    }

    // 상태 코드별 기본 메시지
    switch (status) {
      case 400:
        return '잘못된 요청입니다.';
      case 401:
        return '로그인이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 409:
        return '이미 사용 중인 닉네임입니다.';
      case 500:
        return '서버 오류가 발생했습니다.';
      default:
        return `오류가 발생했습니다. (${status})`;
    }
  }

  // 기타 에러
  return error.message || '알 수 없는 오류가 발생했습니다.';
};

/**
 * 에러 핸들러 함수
 * - 에러 로깅 및 메시지 반환
 */
export const handleApiError = (error, customMessage = null) => {
  const errorMessage = customMessage || getErrorMessage(error);

  // 콘솔 로깅 (개발 환경에서만)
  if (import.meta.env.VITE_ENV === 'development') {
    console.error('[API Error]', {
      message: errorMessage,
      error,
      response: error.response?.data,
    });
  }

  return errorMessage;
};

export default {
  getErrorMessage,
  handleApiError,
};
