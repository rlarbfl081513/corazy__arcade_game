const BaseError = require('./BaseError');

/**
 * 타임아웃 에러
 * 실행 시간 제한 초과
 */
class TimeoutError extends BaseError {
  constructor(message, timeLimit = null) {
    super(
      message || '실행 시간이 제한을 초과하였습니다.',
      408,
      'TLE'
    );
    this.timeLimit = timeLimit;
  }

  static fromLimit(timeLimit) {
    return new TimeoutError(
      `실행 시간이 제한(${timeLimit}ms)을 초과하였습니다.`,
      timeLimit
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeLimit: this.timeLimit
    };
  }
}

module.exports = TimeoutError;

