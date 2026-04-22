import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearAuth } from '@/utils/storage';
import showToast from '@/utils/toastManager';

/**
 * Axios 인스턴스 생성
 * - 기본 URL: 환경 변수에서 가져옴
 * - 타임아웃: 10초
 * - 기본 헤더: JSON
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CORS 인증 정보 포함
});

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
// 토큰 갱신 대기 중인 요청들
let failedQueue = [];

/**
 * 대기 중인 요청 처리
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * 요청 인터셉터
 * - Authorization 헤더 추가
 * - 요청 로깅
 */
apiClient.interceptors.request.use(
  (config) => {
    // Authorization 헤더 추가 (토큰 갱신 요청과 로그인 요청은 제외)
    const accessToken = getAccessToken();
    const isAuthRequest =
      config.url?.includes('/auth/reissue-token') ||
      config.url?.includes('/user/guest') ||
      config.url?.includes('/auth/google/login');

    if (accessToken && !isAuthRequest) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 요청 로깅 (개발 환경에서만)
    if (import.meta.env.VITE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * - 성공 응답: 데이터 반환
 * - 401 에러: 토큰 갱신 후 재시도
 * - 에러 응답: 에러 로깅
 */
apiClient.interceptors.response.use(
  (response) => {
    // 응답 로깅 (개발 환경에서만)
    if (import.meta.env.VITE_ENV === 'development') {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 에러 로깅
    console.error('[API Response Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });

    // 401 에러이고, 재시도하지 않은 요청이며, 토큰 갱신 요청이 아닌 경우
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/reissue-token')
    ) {
      // 이미 토큰 갱신 중인 경우
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // Refresh Token이 없으면 로그아웃 처리
        clearAuth();
        processQueue(new Error('인증이 만료되었습니다. 다시 로그인해주세요.'), null);
        isRefreshing = false;
        showToast.error('로그인이 만료되었습니다. 다시 로그인해주세요.', 4000);
        // 로그인 페이지로 리다이렉트 (필요시)
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        return Promise.reject(error);
      }

      try {
        // 토큰 갱신 요청 (순환 참조를 피하기 위해 직접 axios 사용)
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/reissue-token`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // 새 토큰 저장
        setTokens(newAccessToken, newRefreshToken);

        // 대기 중인 요청들 처리
        processQueue(null, newAccessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        processQueue(refreshError, null);
        clearAuth();
        isRefreshing = false;
        showToast.error('세션이 만료되었습니다. 다시 로그인해주세요.', 4000);
        // 로그인 페이지로 리다이렉트 (필요시)
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
