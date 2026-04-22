import apiClient from './clientApi';
import { ENDPOINTS } from './endpointsApi';
import { handleApiError } from '@/utils/errorHandler';

/**
 * Dictation API 서비스
 * - 받아쓰기 생성, 조회, 수정, 삭제
 */

/**
 * 받아쓰기 생성
 * @param {Object} dictationData - 받아쓰기 데이터
 * @param {number} dictationData.programmingLanguageId - 프로그래밍 언어 ID (required)
 * @param {number} dictationData.algorithmId - 알고리즘 ID (optional, XOR with algorithmName)
 * @param {string} dictationData.algorithmName - 알고리즘 이름 (optional, XOR with algorithmId, max 100)
 * @param {string} dictationData.title - 제목 (required, max 100)
 * @param {string} dictationData.content - 코드 내용 (required, raw source code)
 * @returns {Promise<Object>} 생성된 받아쓰기
 */
export const createDictation = async (dictationData) => {
  try {
    // XOR 유효성 검사
    const hasAlgorithmId = dictationData.algorithmId !== undefined && dictationData.algorithmId !== null;
    const hasAlgorithmName = dictationData.algorithmName !== undefined && dictationData.algorithmName !== null;

    if (hasAlgorithmId && hasAlgorithmName) {
      throw new Error('algorithmId와 algorithmName 중 하나만 제공해야 합니다.');
    }

    if (!hasAlgorithmId && !hasAlgorithmName) {
      throw new Error('algorithmId 또는 algorithmName 중 하나를 제공해야 합니다.');
    }

    const response = await apiClient.post(ENDPOINTS.DICTATION.CREATE, dictationData);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '받아쓰기 생성에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 받아쓰기 단건 조회
 * @param {number} id - 받아쓰기 ID
 * @returns {Promise<Object>} 받아쓰기 상세 정보
 */
export const getDictationById = async (id) => {
  try {
    const response = await apiClient.get(ENDPOINTS.DICTATION.GET_BY_ID(id));
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '받아쓰기 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 받아쓰기 목록 조회
 * @param {Object} params - 조회 파라미터
 * @param {number} params.programmingLanguageId - 프로그래밍 언어 ID (optional)
 * @returns {Promise<Array>} 받아쓰기 목록
 */
export const getDictationList = async (params = {}) => {
  try {
    const response = await apiClient.get(ENDPOINTS.DICTATION.GET_LIST, { params });
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '받아쓰기 목록 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 받아쓰기 수정
 * @param {number} id - 받아쓰기 ID
 * @param {Object} updateData - 수정 데이터
 * @param {string} updateData.title - 제목 (required, max 100)
 * @param {string} updateData.content - 코드 내용 (required, raw source code)
 * @returns {Promise<Object>} 수정된 받아쓰기
 */
export const updateDictation = async (id, updateData) => {
  try {
    const response = await apiClient.put(ENDPOINTS.DICTATION.UPDATE(id), updateData);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '받아쓰기 수정에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 받아쓰기 삭제
 * @param {number} id - 받아쓰기 ID
 * @returns {Promise<void>}
 */
export const deleteDictation = async (id) => {
  try {
    await apiClient.delete(ENDPOINTS.DICTATION.DELETE(id));
  } catch (error) {
    const errorMessage = handleApiError(error, '받아쓰기 삭제에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 랜덤 받아쓰기 조회 (백엔드에서 랜덤 선택)
 * @param {number} programmingLanguageId - 프로그래밍 언어 ID (required)
 * @returns {Promise<Object>} 랜덤 받아쓰기 (단일 객체)
 */
export const getRandomDictation = async (programmingLanguageId = null) => {
  try {
    if (!programmingLanguageId) {
      throw new Error('programmingLanguageId가 필요합니다.');
    }

    const params = { programmingLanguageId };
    const response = await apiClient.get(ENDPOINTS.DICTATION.GET_LIST, { params });

    // 백엔드가 이미 랜덤으로 선택된 단일 객체를 반환
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '랜덤 받아쓰기 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

/**
 * 프로그래밍 언어와 알고리즘에 따른 타자연습 목록 조회
 * @param {number} programmingLanguageId - 프로그래밍 언어 ID (required)
 * @param {number} algorithmId - 알고리즘 ID (required)
 * @returns {Promise<Array>} - 타자연습 리스트 (객체 배열)
 */

/////////////////////////////////////////////////////////////////
export const getDictationByLangAlgo = async ({
  langId = null,
  algoId = null,
} = {}) => {
  try {
    const url = ENDPOINTS.DICTATION.GET_BY_LANG_ALGO(langId, algoId);
    console.log(url);

    const params = {
      programmingLanguageId: langId,
      algorithmId: algoId,
    };

    const response = await apiClient.get(url);
    const data = response.data;

    return data;
  } catch (error) {
    const errorMessage = handleApiError(error, '타자연습 목록 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

export const getProblemList = async ({
    algorithmIds = null,
    languageIds = null,
    titlePrefix = null,
    page=0,
    limit = 20
    } ={}) => {
    try {
        const url = ENDPOINTS.PROBLEM.GET_PROBLEM_LIST;

        const params = {
            limit : limit,
            offset : page*limit,
        };

        // 필터값이 있는 경우에만 params추가
        if (algorithmIds && algorithmIds.length > 0) {
            params.algorithm_ids = algorithmIds.join(',');
        }
        if (languageIds && languageIds.length > 0) {
            params.language_ids = languageIds.join(',');
        }
        if (titlePrefix) {
            params.titlePrefix = titlePrefix;
        }

        // { params } 객체를 넘기면 apiCLient가 알아서 쿼리 스트링으로 만들어줌
        // (예: .../list?limit=20&offset=0&algorithm_ids=1,2)
        const response = await apiClient.get(url,{params});

        // apiClient(Axios)는 자동으로 .json() 처리
        const data = response.data;
        console.log(`전체 ${data.total}개 중 ${data.items.length}개 조회`);
        return data;

    } catch (error) {
        const errorMessage = handleApiError(error,"문제 조회 실패");
        throw new Error(errorMessage);
    }
};

/**
 * 받아쓰기 알고리즘 목록 조회
 * @returns {Promise<Array>} 받아쓰기 알고리즘 목록
 */
export const getDictationAlgorithms = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.DICTATION.GET_ALGORITHMS);
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error, '받아쓰기 알고리즘 목록 조회에 실패했습니다.');
    throw new Error(errorMessage);
  }
};

export default {
  createDictation,
  getDictationById,
  getDictationList,
  updateDictation,
  deleteDictation,
  getRandomDictation,
  getDictationByLangAlgo,
  getDictationAlgorithms,
};
