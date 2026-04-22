const BaseError = require('./BaseError');

/**
 * 컴파일 에러
 * 코드 컴파일 중 발생하는 에러
 */
class CompileError extends BaseError {
  constructor(message, details = null) {
    super(
      message || '컴파일 오류가 발생하였습니다.',
      400,
      'CE'
    );
    this.details = details;
  }

  static fromStderr(stderr, language) {
    return new CompileError(
      '컴파일 오류가 발생하였습니다.',
      {
        language,
        error: stderr,
        type: 'compilation_failed'
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

module.exports = CompileError;

