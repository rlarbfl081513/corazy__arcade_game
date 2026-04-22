import apiClient from './clientApi';
import { ENDPOINTS } from './endpointsApi';
import { handleApiError } from '@/utils/errorHandler';

/**
 * Relay API 서비스 (대기방)
 * - 방 목록 조회
 * - 방 생성/입장/퇴장
 * - 방 상세 정보 조회
 */

/**
 * 방 목록 조회
 * @returns {Promise<Object>} 방 목록
 * @returns {boolean} return.success - 성공 여부
 * @returns {string} return.message - 메시지
 * @returns {Array} return.data - 방 목록 배열
 * @returns {string} return.data[].roomId - 방 고유 ID (UUID)
 * @returns {string} return.data[].roomName - 방 이름
 * @returns {string} return.data[].hostNickname - 방장 닉네임
 * @returns {number} return.data[].problemNumber - 문제 번호
 * @returns {string} return.data[].problemTitle - 문제 제목
 * @returns {string} return.data[].languageName - 프로그래밍 언어명
 * @returns {number} return.data[].maxParticipants - 최대 참여 인원 (2-4)
 * @returns {number} return.data[].currentParticipants - 현재 참여 인원
 * @returns {string} return.data[].status - 방 상태 (WAITING, IN_PROGRESS, COMPLETED)
 * @returns {string} return.data[].createdAt - 방 생성 시각 (ISO 8601)
 */
export const getRoomList = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.RELAY.GET_ROOMS);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '방 목록 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 방 상세 조회
 * @param {string} roomId - 방 고유 ID
 * @returns {Promise<Object>} 방 상세 정보
 */
export const getRoomDetail = async (roomId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.RELAY.GET_ROOM_DETAIL(roomId));
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '방 정보 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 방 생성
 * @param {Object} roomData - 방 생성 데이터
 * @param {string} roomData.roomName - 방 이름
 * @param {string} roomData.languageName - 프로그래밍 언어명
 * @param {number} roomData.maxParticipants - 최대 참여 인원 (2-4)
 * @returns {Promise<Object>} 생성된 방 정보
 */
export const createRoom = async (roomData) => {
  try {
    const response = await apiClient.post(ENDPOINTS.RELAY.CREATE_ROOM, roomData);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '방 생성에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 방 입장
 * @param {string} roomId - 방 고유 ID
 * @returns {Promise<Object>} 입장 결과
 */
export const joinRoom = async (roomId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.RELAY.JOIN_ROOM(roomId));
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '방 입장에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 방 퇴장
 * @param {string} roomId - 방 고유 ID
 * @returns {Promise<Object>} 퇴장 결과
 */
export const leaveRoom = async (roomId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.RELAY.LEAVE_ROOM(roomId));
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '방 퇴장에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 방 삭제 (방장만 가능)
 * @param {string} roomId - 방 고유 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteRoom = async (roomId) => {
  try {
    const response = await apiClient.delete(ENDPOINTS.RELAY.DELETE_ROOM(roomId));
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '방 삭제에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 준비 상태 토글 (일반 참여자만 가능)
 * @param {string} roomId - 방 고유 ID
 * @returns {Promise<Object>} 준비 상태 변경 결과
 */
export const toggleReady = async (roomId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.RELAY.TOGGLE_READY(roomId));
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '준비 상태 변경에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 게임 시작 (방장만 가능)
 * @param {string} roomId - 방 고유 ID
 * @param {number} problemNumber - 문제 번호 (필수)
 * @param {string} problemTitle - 문제 제목 (선택)
 * @returns {Promise<Object>} 게임 시작 결과
 */
export const startGame = async (roomId, problemNumber, problemTitle = null) => {
  try {
    const body = {
      problemNumber: problemNumber,
    };

    // problemTitle이 있으면 추가
    if (problemTitle) {
      body.problemTitle = problemTitle;
    }

    const response = await apiClient.post(ENDPOINTS.RELAY.START_GAME(roomId), body);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '게임 시작에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 턴 완료 (현재 턴 사용자만 가능)
 * @param {string} roomId - 방 고유 ID
 * @returns {Promise<Object>} 턴 완료 결과
 */
export const completeTurn = async (roomId) => {
  try {
    const response = await apiClient.post(ENDPOINTS.RELAY.COMPLETE_TURN(roomId));
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '턴 완료에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 코드 업데이트 (현재 턴 사용자만 가능)
 * @param {string} roomId - 방 고유 ID
 * @param {string} code - 작성한 코드
 * @returns {Promise<Object>} 코드 업데이트 결과
 */
export const updateCode = async (roomId, code) => {
  try {
    const response = await apiClient.put(ENDPOINTS.RELAY.UPDATE_CODE(roomId), {
      code: code,
    });
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '코드 업데이트에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 채점 결과 제출 (현재 턴 사용자만 가능)
 * @param {string} roomId - 방 고유 ID
 * @param {Object} resultData - 채점 결과 데이터
 * @param {boolean} resultData.isCorrect - 정답 여부 (필수)
 * @param {string} resultData.result - 채점 결과 텍스트 (선택)
 * @param {string} resultData.message - 추가 메시지 (선택)
 * @returns {Promise<Object>} 채점 결과 제출 응답
 */
export const submitResult = async (roomId, resultData) => {
  try {
    const response = await apiClient.post(ENDPOINTS.RELAY.SUBMIT_RESULT(roomId), resultData);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '채점 결과 제출에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 게임 종료 후 활동 데이터 전송
 * @param {string} roomId - 방 고유 ID
 * @param {Object} activityData - 집계된 활동 데이터
 * @param {number} activityData.totalKeystrokes - 총 키 입력 수
 * @param {number} activityData.totalIdleTime - 총 유휴 시간 (초)
 * @returns {Promise<Object>} API 응답
 */
export const sendActivityData = async (roomId, activityData) => {
  try {
    const response = await apiClient.post(ENDPOINTS.RELAY.SEND_ACTIVITY(roomId), activityData);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '활동 데이터 전송에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 최종 게임 결과 조회 (기여도 포함)
 * @param {string} roomId - 방 고유 ID
 * @returns {Promise<Object>} 게임 결과 데이터
 */
export const getGameResult = async (roomId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.RELAY.GET_GAME_RESULT(roomId));
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '게임 결과 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

export default {
  getRoomList,
  getRoomDetail,
  createRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
  toggleReady,
  startGame,
  completeTurn,
  updateCode,
  submitResult,
  sendActivityData,
  getGameResult,
};
