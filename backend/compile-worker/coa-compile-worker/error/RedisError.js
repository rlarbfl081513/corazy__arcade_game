const BaseError = require('./BaseError');

/**
 * Redis 관련 에러
 * Redis 작업 중 발생하는 에러
 */
class RedisError extends BaseError {
  constructor(message, details = null) {
    super(
      message || 'Redis 작업 중 오류가 발생하였습니다.',
      500,
      'REDIS_ERROR'
    );
    this.details = details;
  }

  static connectionFailed(originalError) {
    return new RedisError(
      'Redis 연결에 실패하였습니다.',
      {
        originalError: originalError.message,
        type: 'connection_failed'
      }
    );
  }

  static saveFailed(key, originalError) {
    return new RedisError(
      'Redis에 데이터 저장에 실패하였습니다.',
      {
        key,
        originalError: originalError.message,
        type: 'save_failed'
      }
    );
  }

  static getFailed(key, originalError) {
    return new RedisError(
      'Redis에서 데이터 조회에 실패하였습니다.',
      {
        key,
        originalError: originalError.message,
        type: 'get_failed'
      }
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details
    };
  }
}

module.exports = RedisError;

