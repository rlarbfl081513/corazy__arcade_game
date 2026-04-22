/**
 * API 엔드포인트 상수 정의
 * - 모든 API URL을 중앙에서 관리
 * - 기능 추가 시 여기에 엔드포인트 추가
 */

export const ENDPOINTS = {
  // Ranking API (Dictation)
  RANKING: {
    SAVE_RESULT: '/api/ranking/dictation/result',
    GET_LIST: '/api/ranking/dictation/list',
    MY_RANK: '/api/ranking/dictation/my-rank',
  },

  // User API
  USER: {
    MODIFY_NICKNAME: (nickname) => `/api/auth/modify/nickname/${nickname}`,
  },

  // Auth API
  AUTH: {
    // 게스트 로그인 (JWT 토큰 발급)
    GUEST_LOGIN: '/api/auth/guest',
    // 구글 로그인
    GOOGLE_LOGIN: '/api/auth/google/login',
    // 토큰 갱신
    REISSUE_TOKEN: '/api/auth/reissue-token',
    // Legacy: 이전 닉네임 기반 로그인
    LOGIN_WITH_NICKNAME: (nickname) => `/api/mvp1/nickname?nickname=${nickname}`,
  },

  // Dictation API
  DICTATION: {
    CREATE: '/api/dictations',
    GET_BY_ID: (id) => `/api/dictations/${id}`,
    GET_BY_LANG_ALGO: (programmingLanguageId, algorithmId) => `/api/dictations/dictation?programmingLanguageId=${programmingLanguageId}&algorithmId=${algorithmId}`,
    GET_LIST: '/api/dictations',
    UPDATE: (id) => `/api/dictations/${id}`,
    DELETE: (id) => `/api/dictations/${id}`,
    GET_ALGORITHMS: '/api/dictations/algorithms',
  },

  // Chating API
  CHAT_BOARD : {
    // 최근 채팅 100개 조회
    GET_BY_ROOMID : (roomId) => `/api/messages/${roomId}`
  },

  // algorithm API
  PROBLEM : {
    // 문제 불러오기
    GET_PROBLEM_LIST : `/api/problem/list`,
    // 언어 부르기
    GET_LANG_LIST : `/api/problem/languages`,
    // 알고리즘 부르기
    GET_ALGO_LIST : `/api/problem/algorithms`,
    // 단일 문제 불러오기
    GET_BY_PROBLEMID : `/api/problem/info`,
    // 랜덤 문제 조회
    GET_RANDOM_PROBLEM : `/api/problem/random`,
    // 채점 하기
    POST_JUDGE : `/api/algorithm/enqueue`,
  },

  // Relay API (대기방)
  RELAY: {
    // 방 목록 조회
    GET_ROOMS: '/api/relay/rooms',
    // 방 생성
    CREATE_ROOM: '/api/relay/rooms',
    // 방 상세 조회
    GET_ROOM_DETAIL: (roomId) => `/api/relay/rooms/${roomId}`,
    // 방 입장
    JOIN_ROOM: (roomId) => `/api/relay/rooms/${roomId}/join`,
    // 방 퇴장
    LEAVE_ROOM: (roomId) => `/api/relay/rooms/${roomId}/leave`,
    // 방 삭제 (방장만)
    DELETE_ROOM: (roomId) => `/api/relay/rooms/${roomId}`,
    // 준비 상태 토글 (일반 참여자만)
    TOGGLE_READY: (roomId) => `/api/relay/rooms/${roomId}/ready`,
    // 게임 시작 (방장만)
    START_GAME: (roomId) => `/api/relay/rooms/${roomId}/start`,
    // 턴 완료 (현재 턴 사용자만)
    COMPLETE_TURN: (roomId) => `/api/relay/rooms/${roomId}/turn/complete`,
    // 코드 업데이트 (현재 턴 사용자만)
    UPDATE_CODE: (roomId) => `/api/relay/rooms/${roomId}/code`,
    // 채점 결과 제출 (현재 턴 사용자만)
    SUBMIT_RESULT: (roomId) => `/api/relay/rooms/${roomId}/submit`,
    // 활동 데이터 전송 (게임 종료 후)
    SEND_ACTIVITY: (roomId) => `/api/relay/rooms/${roomId}/activity`,
    // 최종 게임 결과 조회 (기여도 포함)
    GET_GAME_RESULT: (roomId) => `/api/relay/rooms/${roomId}/result`,
  },

  // TODO: 추가 API 엔드포인트
};

export default ENDPOINTS;
