/**
 * 채점 상태 코드에 따른 사용자 메시지 매핑
 *
 * 원칙:
 * - AC만 성공으로 판정
 * - 테스트케이스 통과 개수 등 힌트가 될 만한 정보는 제공하지 않음
 * - 성공/실패를 명확히 구분
 */

export const STATUS_MESSAGES = {
  // 성공
  AC: {
    title: "성공!",
    message: "모든 테스트를 통과했습니다!",
    type: "success",
  },

  // 실패 상태들
  WA: {
    title: "실패!",
    message: "출력 결과가 올바르지 않습니다.",
    type: "fail",
  },

  TLE: {
    title: "실패!",
    message: "시간 제한을 초과했습니다.",
    type: "fail",
  },

  MLE: {
    title: "실패!",
    message: "메모리 제한을 초과했습니다.",
    type: "fail",
  },

  RE: {
    title: "실패!",
    message: "런타임 오류가 발생했습니다.",
    type: "fail",
  },

  CE: {
    title: "실패!",
    message: "컴파일 오류가 발생했습니다.",
    type: "fail",
  },

  SE: {
    title: "실패!",
    message: "시스템 오류가 발생했습니다.",
    type: "fail",
  },
};

/**
 * 상태 코드에 따른 메시지 가져오기
 * @param {string} status - 상태 코드 (AC, WA, TLE, MLE, RE, CE, SE)
 * @returns {object} - { title, message, type }
 */
export function getStatusMessage(status) {
  return (
    STATUS_MESSAGES[status] || {
      title: "실패!",
      message: "채점 결과를 확인할 수 없습니다.",
      type: "fail",
    }
  );
}

/**
 * 상태 코드가 성공인지 확인
 * @param {string} status - 상태 코드
 * @returns {boolean} - AC만 true
 */
export function isSuccess(status) {
  return status === "AC";
}

/**
 * 상태 코드의 상세 설명 (개발자용)
 */
export const STATUS_DESCRIPTIONS = {
  AC: "Accepted - 정답",
  WA: "Wrong Answer - 오답",
  TLE: "Time Limit Exceeded - 시간 초과",
  MLE: "Memory Limit Exceeded - 메모리 초과",
  RE: "Runtime Error - 런타임 에러",
  CE: "Compile Error - 컴파일 에러",
  SE: "System Error - 시스템 에러",
};
