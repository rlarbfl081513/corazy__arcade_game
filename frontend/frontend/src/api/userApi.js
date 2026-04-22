import apiClient from './clientApi';
import { ENDPOINTS } from './endpointsApi';
import { handleApiError } from '@/utils/errorHandler';
import { setUserInfo, getUserInfo } from '@/utils/storage';

/**
 * User API 서비스
 * - 닉네임 수정
 */

/**
 * 닉네임 수정
 * @param {string} newNickname - 새로운 닉네임 (2-20자)
 * @returns {Promise<void>} 수정 성공 시 204 No Content (반환값 없음)
 * @throws {Error} 400 - 닉네임 유효성 오류
 * @throws {Error} 401 - 인증 실패
 * @throws {Error} 409 - 이미 사용 중인 닉네임
 */
export const modifyNickname = async (newNickname) => {
  try {
    // 닉네임 유효성 검사 (2-20자)
    if (!newNickname || newNickname.trim().length === 0) {
      throw new Error('닉네임을 입력해주세요.');
    }

    const trimmedNickname = newNickname.trim();

    if (trimmedNickname.length < 2) {
      throw new Error('닉네임은 2자 이상이어야 합니다.');
    }

    if (trimmedNickname.length > 20) {
      throw new Error('닉네임은 20자 이하로 입력해주세요.');
    }

    // 닉네임 형식 검사: 한글, 영문, 숫자, 밑줄만 허용
    const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
    if (!nicknameRegex.test(trimmedNickname)) {
      throw new Error('닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.');
    }

    // API 호출 (204 No Content 응답)
    await apiClient.post(ENDPOINTS.USER.MODIFY_NICKNAME(encodeURIComponent(trimmedNickname)));

    // 로컬 스토리지의 사용자 정보 업데이트
    const userInfo = getUserInfo() || {};
    setUserInfo({ ...userInfo, nickname: trimmedNickname });

    console.log('닉네임 변경 성공:', trimmedNickname);
  } catch (error) {
    // 409 에러: 중복 닉네임
    if (error.response?.status === 409) {
      throw new Error('이미 사용 중인 닉네임입니다.');
    }

    // 401 에러: 인증 실패 (자동으로 토큰 갱신 시도됨)
    if (error.response?.status === 401) {
      throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
    }

    const errorMessage = handleApiError(error, '닉네임 수정에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

export default {
  modifyNickname,
};
