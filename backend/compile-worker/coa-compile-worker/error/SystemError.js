const BaseError = require('./BaseError');

/**
 * 시스템 에러
 * 시스템 레벨에서 발생하는 에러
 */
class SystemError extends BaseError {
  constructor(message, details = null) {
    super(
      message || '시스템 오류가 발생하였습니다.',
      500,
      'SE'
    );
    this.details = details;
  }

  static fromDockerError(error) {
    return new SystemError(
      '도커 컨테이너 실행 중 오류가 발생하였습니다.',
      {
        originalError: error.message,
        type: 'docker_error'
      }
    );
  }

  static fromFileSystemError(error) {
    return new SystemError(
      '파일 시스템 오류가 발생하였습니다.',
      {
        originalError: error.message,
        type: 'filesystem_error'
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

module.exports = SystemError;

