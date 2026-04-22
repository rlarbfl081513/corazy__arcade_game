import apiClient from './clientApi';
import { ENDPOINTS } from './endpointsApi';
import { handleApiError } from '@/utils/errorHandler';

/**
 * Ranking API 서비스
 * - 게임 결과 저장
 * - 랭킹 목록 조회 (Cursor 기반 페이지네이션)
 */

/**
 * 게임 결과 저장
 * - Authorization header를 통해 사용자 인증 (Bearer token)
 * @param {Object} resultData - 게임 결과 데이터
 * @param {number} resultData.dictationId - 받아쓰기 ID
 * @param {number} resultData.cpm - CPM (Characters Per Minute)
 * @param {number} resultData.wpm - WPM (Words Per Minute)
 * @param {number} resultData.acc - 정확도 (%)
 * @returns {Promise<Object>} 저장된 결과
 */
export const saveGameResult = async (resultData) => {
  try {
    const response = await apiClient.post(ENDPOINTS.RANKING.SAVE_RESULT, resultData);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '게임 결과 저장에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 랭킹 목록 조회 (Cursor 기반 페이지네이션)
 * @param {Object} params - 조회 파라미터
 * @param {string} params.cursor - 다음 페이지 커서 (Base64 인코딩) - 첫 페이지는 null
 * @param {number} params.pageSize - 페이지 크기 (기본값: 10, 범위: 1~50)
 * @returns {Promise<Object>} 랭킹 목록 및 페이지네이션 정보
 */
export const getRankingList = async ({ cursor = null, pageSize = 10 } = {}) => {
  try {
    const params = {};

    if (cursor) {
      params.cursor = cursor;
    }

    if (pageSize) {
      params.pageSize = Math.min(Math.max(pageSize, 1), 50); // 1~50 범위 제한
    }

    const response = await apiClient.get(ENDPOINTS.RANKING.GET_LIST, { params });
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '랭킹 목록 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 내 랭킹 조회
 * - Authorization header를 통해 사용자 인증 (Bearer token)
 * @returns {Promise<Object>} 내 랭킹 정보
 * @returns {number} return.rank - 순위
 * @returns {number} return.userId - 사용자 ID
 * @returns {string} return.userNickname - 사용자 닉네임
 * @returns {number} return.dictationId - 받아쓰기 ID
 * @returns {number} return.bestCpm - 최고 CPM
 * @returns {number} return.bestWpm - 최고 WPM
 * @returns {number} return.bestAccuracy - 최고 정확도
 * @returns {string} return.createdAt - 생성일시
 * @returns {string} return.updatedAt - 수정일시
 */
export const getMyRank = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.RANKING.MY_RANK);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '내 랭킹 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 전체 랭킹 목록 조회 (모든 페이지 가져오기)
 * - 무한 스크롤 구현 시 사용하지 않음
 * - 전체 랭킹이 필요한 경우에만 사용
 * @param {number} maxPages - 최대 페이지 수 (기본값: 10)
 * @returns {Promise<Array>} 전체 랭킹 배열
 */
export const getAllRankings = async (maxPages = 10) => {
  try {
    const allRankings = [];
    let nextCursor = null;
    let pageCount = 0;

    while (pageCount < maxPages) {
      const response = await getRankingList({ cursor: nextCursor, pageSize: 50 });

      allRankings.push(...response.rankings);

      if (!response.hasNext || !response.nextCursor) {
        break;
      }

      nextCursor = response.nextCursor;
      pageCount++;
    }

    return allRankings;
  } catch (error) {
    const errorMessage = handleApiError(error, '전체 랭킹 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

export default {
  saveGameResult,
  getRankingList,
  getMyRank,
  getAllRankings,
};
