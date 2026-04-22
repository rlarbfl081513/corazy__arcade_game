const { publish } = require('../utils/redisClient');

/**
 * Redis 채널에 메시지 발행
 * @param {string} submissionUuid - 제출 UUID
 * @param {Object} message - 메시지 데이터
 * @returns {Promise<number>} - 구독자 수
 */
async function publishMessage(submissionUuid, message) {
  const channel = `compile:${submissionUuid}`;
  const subscriberCount = await publish(channel, {
    submission_uuid: submissionUuid,
    ...message
  });
  return subscriberCount;
}

/**
 * 진행 상황 메시지 발행
 * @param {string} submissionUuid - 제출 UUID
 * @param {number} current - 현재 진행 상황
 * @param {number} total - 전체 개수
 * @param {string} message - 메시지
 */
async function publishProgress(submissionUuid, current, total, message) {
  try {
    const subscriberCount = await publishMessage(submissionUuid, {
      type: 'progress',
      current,
      total,
      message
    });
    console.log(`  📊 Progress: ${current}/${total} - ${message} (${subscriberCount} subscribers)`);  // ✅ 로깅
  } catch (error) {
    console.error('⚠️  Failed to publish progress:', error.message);
  }
}

/**
 * 테스트케이스 결과 메시지 발행
 * @param {string} submissionUuid - 제출 UUID
 * @param {Object} result - 테스트케이스 결과
 */
async function publishTestCase(submissionUuid, result) {
  try {
    const subscriberCount = await publishMessage(submissionUuid, {
      type: 'testcase',
      result
    });
    console.log(`  ✓ Test Case ${result.test_case_number}: ${result.status} (${subscriberCount} subscribers)`);  // ✅ 로깅
  } catch (error) {
    console.error('⚠️  Failed to publish testcase:', error.message);
  }
}

/**
 * 테스트케이스 결과 메시지 일괄 발행
 * @param {string} submissionUuid - 제출 UUID
 * @param {Array<Object>} results - 테스트케이스 결과 배열
 */
async function publishTestCaseBatch(submissionUuid, results) {
  try {
    const subscriberCount = await publishMessage(submissionUuid, {
      type: 'testcase_batch',
      results // 'result'가 아닌 'results'로 배열 전송
    });
    console.log(`  ✓✓ Test Case Batch: ${results.length} items (${subscriberCount} subscribers)`);
  } catch (error) {
    console.error('⚠️  Failed to publish testcase batch:', error.message);
  }
}

/**
 * 최종 결과 메시지 발행
 * @param {string} submissionUuid - 제출 UUID
 * @param {Object} result - 최종 결과
 */
async function publishResult(submissionUuid, result) {
  try {
    const subscriberCount = await publishMessage(submissionUuid, {
      type: 'result',
      result
    });
    console.log(`  📋 Final Result: ${result.status} (${subscriberCount} subscribers)`);  // ✅ 로깅
  } catch (error) {
    console.error('⚠️  Failed to publish result:', error.message);
  }
}

/**
 * 에러 메시지 발행
 * @param {string} submissionUuid - 제출 UUID
 * @param {string} error - 에러 메시지
 * @param {string} errorType - 에러 타입
 * @param {Object} details - 상세 정보
 */
async function publishError(submissionUuid, error, errorType = 'SystemError', details = {}) {
  try {
    const subscriberCount = await publishMessage(submissionUuid, {  // ✅ 구독자 수 받기
      type: 'error',
      error,
      error_type: errorType,
      details
    });
    console.log(`  ❌ Error: ${errorType} - ${error} (${subscriberCount} subscribers)`);  // ✅ 로깅
  } catch (err) {
    console.error('⚠️  Failed to publish error:', err.message);
  }
}

/**
 * 완료 메시지 발행 (필수!)
 * @param {string} submissionUuid - 제출 UUID
 * @param {string} message - 완료 메시지
 */
async function publishComplete(submissionUuid, message = '채점이 완료되었습니다') {
  try {
    const subscriberCount = await publishMessage(submissionUuid, {  // ✅ 구독자 수 받기
      type: 'complete',
      message
    });
    console.log(`  ✅ Complete: ${message} (${subscriberCount} subscribers)`);  // ✅ 로깅
  } catch (error) {
    console.error('⚠️  Failed to publish complete:', error.message);
  }
}

module.exports = {
  publishProgress,
  publishTestCase,
  publishTestCaseBatch, // 추가
  publishResult,
  publishError,
  publishComplete
};
