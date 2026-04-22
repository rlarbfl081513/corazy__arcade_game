import apiClient from './clientApi';
import { ENDPOINTS } from './endpointsApi';
import { handleApiError } from '@/utils/errorHandler';
import {
  setUserInfo,
  getUserInfo,
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearAuth,
} from '@/utils/storage';

/**
 * Auth API 서비스
 * - JWT 토큰 기반 인증
 * - 게스트 로그인, 구글 로그인, 토큰 갱신 지원
 */

/**
 * 게스트 로그인 (닉네임만으로 로그인)
 * @param {string} nickname - 사용자 닉네임 (2-20자)
 * @returns {Promise<Object>} { userId, nickname, accessToken, refreshToken }
 */
export const guestLogin = async (nickname) => {
  try {
    const response = await apiClient.post(ENDPOINTS.AUTH.GUEST_LOGIN, {
      nickname,
    });

    const { userId, nickname: returnedNickname, accessToken, refreshToken } = response.data;

    // 토큰과 사용자 정보를 로컬 스토리지에 저장
    setTokens(accessToken, refreshToken);
    setUserInfo({
      userId: userId,
      nickname: returnedNickname
    });

    console.log('[Auth] Guest login - saved userInfo:', { userId, nickname: returnedNickname });

    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

/**
 * 구글 로그인
 * @param {string} authParam - Google OAuth code 또는 sessionToken
 * @param {string} [nickname] - 사용자 닉네임 (2-20자, 선택적)
 * @returns {Promise<Object>} { isNewUser, userId, nickname, accessToken, refreshToken }
 */
export const googleLogin = async (authParam, nickname = null) => {
  try {
    const requestBody = {};

    // authParam이 sessionToken인지 code인지 판단
    // sessionToken은 'temp_' 등으로 시작하거나, nickname이 있으면 sessionToken으로 간주
    if (nickname) {
      // 닉네임이 있으면 sessionToken 사용
      requestBody.sessionToken = authParam;
      requestBody.nickname = nickname;
    } else {
      // 닉네임이 없으면 code 사용 (첫 요청)
      requestBody.code = authParam;
    }

    const response = await apiClient.post(ENDPOINTS.AUTH.GOOGLE_LOGIN, requestBody);

    const { userId, nickname: returnedNickname, accessToken, refreshToken, isNewUser } = response.data;

    // 토큰과 사용자 정보를 로컬 스토리지에 저장
    setTokens(accessToken, refreshToken);
    setUserInfo({
      userId: userId,
      nickname: returnedNickname
    });

    console.log('[Auth] Google login - saved userInfo:', { userId, nickname: returnedNickname });

    return {
      isNewUser: isNewUser || false,
      userId,
      nickname: returnedNickname,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    // NICKNAME_REQUIRED 에러는 별도로 처리하기 위해 그대로 throw
    const errorCode = error.response?.data?.error || error.response?.data?.errorCode;

    if (errorCode === 'NICKNAME_REQUIRED') {
      throw error; // 원본 에러 객체 그대로 전달
    }

    // 그 외 에러는 로깅 후 원본 에러 전달
    handleApiError(error, '구글 로그인에 실패했습니다.');
    throw error;
  }
};

/**
 * 토큰 갱신 (Refresh Token으로 새 Access Token 발급)
 * @returns {Promise<Object>} { userId, nickname, accessToken, refreshToken }
 */
export const reissueToken = async () => {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error('Refresh Token이 없습니다.');
    }

    const response = await apiClient.post(ENDPOINTS.AUTH.REISSUE_TOKEN, {
      refreshToken,
    });

    const {
      userId,
      nickname: returnedNickname,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    } = response.data;

    // 새로운 토큰으로 교체 (Refresh Token Rotation)
    setTokens(newAccessToken, newRefreshToken);
    setUserInfo({
      userId: userId,
      nickname: returnedNickname
    });

    console.log('[Auth] Token reissued - saved userInfo:', { userId, nickname: returnedNickname });

    return response.data;
  } catch (error) {
    // 토큰 갱신 실패 시 로그아웃 처리
    clearAuth();
    const errorMessage = handleApiError(
      error,
      '토큰 갱신에 실패했습니다. 다시 로그인해주세요.'
    );
    throw new Error(errorMessage);
  }
};

/**
 * 자동 로그인 체크
 * - 로컬 스토리지에 accessToken이 있으면 자동 로그인 성공
 * @returns {boolean} 자동 로그인 가능 여부
 */
export const checkAutoLogin = () => {
  const accessToken = getAccessToken();
  const userInfo = getUserInfo();
  return !!(accessToken && userInfo && userInfo.nickname);
};

/**
 * 로그아웃
 * - 로컬 스토리지의 모든 인증 정보 삭제
 */
export const logout = () => {
  clearAuth();
  console.log('로그아웃 완료');
};

export default {
  guestLogin,
  googleLogin,
  reissueToken,
  checkAutoLogin,
  logout,
};
