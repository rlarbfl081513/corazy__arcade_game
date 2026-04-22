const BaseError = require('./BaseError');

/**
 * S3 관련 에러
 * S3 작업 중 발생하는 에러
 */
class S3Error extends BaseError {
  constructor(message, details = null) {
    super(
      message || 'S3 작업 중 오류가 발생하였습니다.',
      500,
      'S3_ERROR'
    );
    this.details = details;
  }

  static notFound(problemId) {
    return new S3Error(
      `문제 ${problemId}의 테스트케이스를 찾을 수 없습니다.`,
      {
        problemId,
        type: 'not_found'
      }
    );
  }

  static downloadFailed(bucket, key, originalError) {
    return new S3Error(
      'S3에서 파일 다운로드에 실패하였습니다.',
      {
        bucket,
        key,
        originalError: originalError.message,
        type: 'download_failed'
      }
    );
  }

  static uploadFailed(bucket, key, originalError) {
    return new S3Error(
      'S3에 파일 업로드에 실패하였습니다.',
      {
        bucket,
        key,
        originalError: originalError.message,
        type: 'upload_failed'
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

module.exports = S3Error;

