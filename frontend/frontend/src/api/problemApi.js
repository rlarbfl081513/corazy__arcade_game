import { handleApiError } from '@/utils/errorHandler';
import apiClient from './clientApi';
import { ENDPOINTS } from './endpointsApi';


/**
 * 문제 목록을 조회합니다. (필터링 및 페이지네이션 포함)
 * @param {object} options - 조회 옵션
 * @param {number[]} [options.algorithmIds] - 필터링할 알고리즘 ID 배열
 * @param {number[]} [options.languageIds] - 필터링할 언어 ID 배열
 * @param {string} [options.titlePrefix] - 검색할 제목 (앞 글자)
 * @param {number} [options.page] - 페이지 번호 (0부터 시작)
 * @param {number} [options.limit] - 페이지 당 항목 수
 * @returns {Promise<object>} API 응답 (total, items)
 */

// 언어 목록
export const getLanguages = async() => {
    try {
        const url = ENDPOINTS.PROBLEM.GET_LANG_LIST;
        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        const errorMessage = handleApiError(error, "언어 조회 실패");
        throw new Error(errorMessage);
    }
};

// 알고리즘 목록
export const getAlgorithms = async() => {
    try {
        const url = ENDPOINTS.PROBLEM.GET_ALGO_LIST;
        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        const errorMessage = handleApiError(error, "알고리즘 조회 실패");
        throw new Error(errorMessage);
    }
};

// 필터링된 문제목록 조회
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

// 문제 상세 조회
export const getProblemInfo = async ({ problemId = null } = {}) => {
    try {
        const url = ENDPOINTS.PROBLEM.GET_BY_PROBLEMID;
        const params = {
            problem_number : problemId,
        };

        const response = await apiClient.get(url, {params})
        return response.data;
    } catch (error) {
    const errorMessage = handleApiError(error, "문제번호:",problemId, "문제 정보 조회 실패");
    throw new Error(errorMessage);
  }
};

// 랜덤 문제 조회 (언어별)
export const getRandomProblem = async ({ languageId, algorithmIds = null } = {}) => {
    try {
        const url = ENDPOINTS.PROBLEM.GET_RANDOM_PROBLEM;
        const params = {
            language_id: languageId,
        };

        // 알고리즘 필터가 있는 경우 추가
        if (algorithmIds && algorithmIds.length > 0) {
            params.algorithm_ids = algorithmIds.join(',');
        }

        const response = await apiClient.get(url, { params });
        return response.data;
    } catch (error) {
        const errorMessage = handleApiError(error, "랜덤 문제 조회 실패");
        throw new Error(errorMessage);
    }
};


// 채점하기

/**
 * 코드를 채점 큐에 제출합니다. (테스트 또는 최종 제출)
 * @param {object} payload - API 요청 Body
 * @param {number} payload.problem_id - 문제 번호
 * @param {string} payload.code - 제출할 소스 코드
 * @param {string} payload.language - 프로그래밍 언어 (예: 'python', 'java', 'cpp', 'javascript')
 * @param {string} payload.mode - 실행 모드 ('EVALUATE' 또는 'SAMPLE')
 * @param {string} [payload.input] - SAMPLE 모드에서 사용할 입력 값 (옵션)
 * @returns {Promise<object>} API 응답 (submission_uuid 포함)
 */
export const enqueueSubmission = async ({
  problem_id,
  code,
  language,
  mode,
  input = null,
}) => {
  try {
   
    const url = ENDPOINTS.PROBLEM.POST_JUDGE; 

    const body = {
      problem_id,
      code,
      language,
      mode,
    };

    // SAMPLE 모드일 때만 input을 추가합니다.
    if (mode === 'SAMPLE' && input !== null) {
      body.input = input;
    }

    // GET이 아닌 POST 요청을 보냅니다.
    const response = await apiClient.post(url, body);
    
    // { submission_uuid: "...", status: "queued", ... } 객체를 반환합니다.
    return response.data;

  } catch (error) {
    const errorMessage = handleApiError(error, "코드 제출 실패");
    throw new Error(errorMessage);
  }
};