/**
 * 기본 에러 클래스
 * 모든 커스텀 에러의 베이스 클래스
 */
class BaseError extends Error {
  constructor(message, statusCode, status) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = status;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };
  }
}

module.exports = BaseError;

