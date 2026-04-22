const redis = require('redis');

let redisClient = null;

/**
 * Redis 클라이언트 초기화
 * @param {Object} config - Redis 설정
 * @returns {Promise<Object>} - Redis 클라이언트
 */
async function initializeRedis(config = {}) {
  const {
    host = process.env.REDIS_HOST || 'localhost',
    port = process.env.REDIS_PORT || 6379,
    password = process.env.REDIS_PASSWORD,
    db = process.env.REDIS_DB || 0
  } = config;

  const clientConfig = {
    socket: {
      host,
      port: parseInt(port)
    },
    database: parseInt(db)
  };

  if (password) {
    clientConfig.password = password;
  }

  redisClient = redis.createClient(clientConfig);

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✓ Connected to Redis');
  });

  await redisClient.connect();
  console.log('✓ Redis client initialized');
  
  return redisClient;
}

/**
 * Redis에 값 저장
 * @param {string} key - 키
 * @param {any} value - 값 (객체는 자동으로 JSON 변환)
 * @param {number} ttl - TTL (초 단위, 선택사항)
 */
async function set(key, value, ttl = null) {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }

  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  
  if (ttl) {
    await redisClient.setEx(key, ttl, stringValue);
  } else {
    await redisClient.set(key, stringValue);
  }
}

/**
 * Redis에서 값 조회
 * @param {string} key - 키
 * @param {boolean} parseJSON - JSON 파싱 여부
 * @returns {Promise<any>} - 값
 */
async function get(key, parseJSON = true) {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }

  const value = await redisClient.get(key);
  
  if (value === null) {
    return null;
  }

  if (parseJSON) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  return value;
}

/**
 * Redis에서 키 삭제
 * @param {string} key - 키
 */
async function del(key) {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }

  await redisClient.del(key);
}

/**
 * Redis에 해시 저장
 * @param {string} key - 키
 * @param {Object} hash - 해시 객체
 */
async function hSet(key, hash) {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }

  // 객체 값들을 문자열로 변환
  const stringHash = {};
  for (const [field, value] of Object.entries(hash)) {
    stringHash[field] = typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  await redisClient.hSet(key, stringHash);
}

/**
 * Redis에서 해시 조회
 * @param {string} key - 키
 * @returns {Promise<Object>} - 해시 객체
 */
async function hGetAll(key) {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }

  const hash = await redisClient.hGetAll(key);
  
  // JSON 파싱 시도
  const parsedHash = {};
  for (const [field, value] of Object.entries(hash)) {
    try {
      parsedHash[field] = JSON.parse(value);
    } catch {
      parsedHash[field] = value;
    }
  }

  return parsedHash;
}

/**
 * Redis 연결 종료
 */
async function disconnect() {
  if (redisClient) {
    await redisClient.quit();
    console.log('✓ Redis client disconnected');
  }
}

/**
 * Redis 채널에 메시지 발행 (Pub/Sub)
 * @param {string} channel - 채널명 (예: compile:uuid)
 * @param {Object|string} message - 발행할 메시지
 * @returns {Promise<number>} - 메시지를 받은 구독자 수
 */
async function publish(channel, message) {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }

  const messageStr = typeof message === 'object' 
    ? JSON.stringify(message) 
    : String(message);
  
  const subscriberCount = await redisClient.publish(channel, messageStr);
  console.log(`✓ Published to ${channel} (${subscriberCount} subscribers)`);
  
  if (subscriberCount === 0) {
    console.warn(`There has no subscribers`)
  }
  
  return subscriberCount;
}

/**
 * Redis 연결 대기 함수
 * @param {string} submissionUuid - 제출 식별 uuid
 * @param {number} maxWaitMs - 최대 대기 시간
 * @returns {Promise<boolean>} - 준비 완료 여부
 */
async function waitForWebSocketReady(submissionUuid, maxWaitMs=3000) {
  const key = `ws_ready:${submissionUuid}`;
  const checkInterval = 100 // 100ms마다 확인
  const maxAttempts = Math.floor(maxWaitMs / checkInterval);

  console.log(`⏳ Waiting for WebSocket ready: ${submissionUuid} (max ${maxWaitMs}ms)`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Redis ws_ready 확인
      const value = await get(key, false);

      if (value === '1') {
        const elapsedMs = i * checkInterval;
        console.log(`✓ WebSocket is ready after ${elapsedMs}ms`);
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));

    } catch (error) {
      console.warn(`⚠️  Redis check error: ${error.message}`);
    }
  }

    // 타임아웃
  console.warn(`⚠️  WebSocket not ready after ${maxWaitMs}ms, proceeding anyway`);
  return false;
}

/**
 * Redis 클라이언트 반환
 */
function getRedisClient() {
  return redisClient;
}

module.exports = {
  initializeRedis,
  set,
  get,
  del,
  hSet,
  hGetAll,
  publish,
  disconnect,
  getRedisClient,
  waitForWebSocketReady
};

