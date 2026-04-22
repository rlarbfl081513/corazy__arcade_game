const BaseError = require('./BaseError');

/**
 * 메모리 초과 에러
 * 메모리 사용량 제한 초과
 */
class MemoryError extends BaseError {
  constructor(message, memoryUsed = null, memoryLimit = null) {
    super(
      message || '메모리 사용량이 제한을 초과하였습니다.',
      413,
      'MLE'
    );
    this.memoryUsed = memoryUsed;
    this.memoryLimit = memoryLimit;
  }

  static fromLimit(memoryUsed, memoryLimit) {
    return new MemoryError(
      `메모리 사용량(${memoryUsed}MB)이 제한(${memoryLimit}MB)을 초과하였습니다.`,
      memoryUsed,
      memoryLimit
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      memoryUsed: this.memoryUsed,
      memoryLimit: this.memoryLimit
    };
  }
}

module.exports = MemoryError;

