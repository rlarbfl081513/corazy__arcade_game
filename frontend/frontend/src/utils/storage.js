/**
 * 로컬 스토리지 관리 유틸리티
 * - JWT 토큰 관리 (accessToken, refreshToken)
 * - 사용자 정보 관리 (userId, nickname)
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo',
};

/**
 * 사용자 정보 저장
 * @param {Object} userInfo - { userId, nickname }
 */
export const setUserInfo = (userInfo) => {
  localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
};

/**
 * 사용자 정보 가져오기
 * @returns {Object|null} { userId, nickname } or null
 */
export const getUserInfo = () => {
  const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * Access Token 저장
 * @param {string} token - JWT Access Token
 */
export const setAccessToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Access Token 가져오기
 * @returns {string|null} Access Token or null
 */
export const getAccessToken = () => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Refresh Token 저장
 * @param {string} token - JWT Refresh Token
 */
export const setRefreshToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Refresh Token 가져오기
 * @returns {string|null} Refresh Token or null
 */
export const getRefreshToken = () => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Access Token과 Refresh Token을 한번에 저장
 * @param {string} accessToken - JWT Access Token
 * @param {string} refreshToken - JWT Refresh Token
 */
export const setTokens = (accessToken, refreshToken) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * 모든 인증 정보 삭제 (로그아웃)
 */
export const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);
};

export default {
  setUserInfo,
  getUserInfo,
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  setTokens,
  clearAuth,
};
