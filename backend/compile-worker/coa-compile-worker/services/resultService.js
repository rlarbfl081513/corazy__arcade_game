const { set, get, hSet, hGetAll } = require('../utils/redisClient');
const { RedisError } = require('../error');

// Redis 키 패턴
const RESULT_KEY_PREFIX = 'result:';
const JOB_KEY_PREFIX = 'job:';

// TTL 설정 (초 단위)
const RESULT_TTL = 3600; // 1시간
const JOB_TTL = 7200; // 2시간

/**
 * 채점 결과를 Redis에 저장
 * @param {string} jobId - 작업 ID
 * @param {Object} result - 채점 결과
 * @returns {Promise<void>}
 */
async function saveResult(jobId, result) {
  const key = `${RESULT_KEY_PREFIX}${jobId}`;
  
  const resultData = {
    jobId,
    timestamp: Date.now(),
    ...result
  };

  try {
    await set(key, resultData, RESULT_TTL);
    console.log(`✓ Result saved to Redis: ${jobId}`);
  } catch (error) {
    console.error(`Failed to save result to Redis: ${jobId}`, error.message);
    throw RedisError.saveFailed(key, error);
  }
}

/**
 * Redis에서 채점 결과 조회
 * @param {string} jobId - 작업 ID
 * @returns {Promise<Object|null>} - 채점 결과 또는 null
 */
async function getResult(jobId) {
  const key = `${RESULT_KEY_PREFIX}${jobId}`;
  
  try {
    const result = await get(key, true);
    return result;
  } catch (error) {
    console.error(`Failed to get result from Redis: ${jobId}`, error.message);
    throw RedisError.getFailed(key, error);
  }
}

/**
 * 작업 상태를 Redis에 저장 (진행중, 완료 등)
 * @param {string} jobId - 작업 ID
 * @param {string} status - 상태 (PENDING, RUNNING, COMPLETED, FAILED)
 * @param {Object} metadata - 추가 메타데이터
 * @returns {Promise<void>}
 */
async function saveJobStatus(jobId, status, metadata = {}) {
  const key = `${JOB_KEY_PREFIX}${jobId}`;
  
  const jobData = {
    jobId,
    status,
    updatedAt: Date.now(),
    ...metadata
  };

  try {
    await set(key, jobData, JOB_TTL);
    console.log(`✓ Job status saved: ${jobId} -> ${status}`);
  } catch (error) {
    console.error(`Failed to save job status: ${jobId}`, error.message);
  }
}

/**
 * Redis에서 작업 상태 조회
 * @param {string} jobId - 작업 ID
 * @returns {Promise<Object|null>} - 작업 상태 또는 null
 */
async function getJobStatus(jobId) {
  const key = `${JOB_KEY_PREFIX}${jobId}`;
  
  try {
    const job = await get(key, true);
    return job;
  } catch (error) {
    console.error(`Failed to get job status from Redis: ${jobId}`, error.message);
    return null;
  }
}

/**
 * 채점 결과를 해시로 저장 (세부 정보 포함)
 * @param {string} jobId - 작업 ID
 * @param {Object} result - 채점 결과
 * @returns {Promise<void>}
 */
async function saveDetailedResult(jobId, result) {
  const key = `${RESULT_KEY_PREFIX}${jobId}:details`;
  
  try {
    await hSet(key, result);
    console.log(`✓ Detailed result saved to Redis: ${jobId}`);
  } catch (error) {
    console.error(`Failed to save detailed result to Redis: ${jobId}`, error.message);
    throw RedisError.saveFailed(key, error);
  }
}

/**
 * Redis에서 상세 채점 결과 조회
 * @param {string} jobId - 작업 ID
 * @returns {Promise<Object|null>} - 상세 채점 결과 또는 null
 */
async function getDetailedResult(jobId) {
  const key = `${RESULT_KEY_PREFIX}${jobId}:details`;
  
  try {
    const result = await hGetAll(key);
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error(`Failed to get detailed result from Redis: ${jobId}`, error.message);
    throw RedisError.getFailed(key, error);
  }
}

module.exports = {
  saveResult,
  getResult,
  saveJobStatus,
  getJobStatus,
  saveDetailedResult,
  getDetailedResult
};

