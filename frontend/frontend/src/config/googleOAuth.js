/**
 * Google OAuth 설정
 */

export const GOOGLE_OAUTH_CONFIG = {
  // Google OAuth Client ID (환경 변수에서 가져오기)
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,

  // OAuth 인가 엔드포인트
  authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',

  // 리다이렉트 URI (콜백 페이지 URL)
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,

  // 요청할 스코프 (사용자 기본 정보만 요청)
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' '),

  // 응답 타입
  responseType: 'code',

  // 액세스 타입
  accessType: 'offline',

  // 승인 프롬프트
  prompt: 'consent',
};

/**
 * Google OAuth 로그인 URL 생성
 * @returns {string} Google OAuth 인가 URL
 */
export const getGoogleOAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: GOOGLE_OAUTH_CONFIG.responseType,
    scope: GOOGLE_OAUTH_CONFIG.scope,
    access_type: GOOGLE_OAUTH_CONFIG.accessType,
    prompt: GOOGLE_OAUTH_CONFIG.prompt,
  });

  return `${GOOGLE_OAUTH_CONFIG.authEndpoint}?${params.toString()}`;
};

export default GOOGLE_OAUTH_CONFIG;
