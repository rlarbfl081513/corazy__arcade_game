const BaseError = require('./BaseError');

/**
 * 유효성 검증 에러
 * 입력 데이터 검증 실패 시 발생
 */
class ValidationError extends BaseError {
  constructor(message, fields = null) {
    super(
      message || '입력 데이터가 유효하지 않습니다.',
      400,
      'VALIDATION_ERROR'
    );
    this.fields = fields;
  }

  static missingField(fieldName) {
    return new ValidationError(
      `필수 필드가 누락되었습니다: ${fieldName}`,
      { [fieldName]: 'required' }
    );
  }

  static invalidLanguage(language) {
    return new ValidationError(
      `지원하지 않는 언어입니다: ${language}`,
      { language: 'unsupported' }
    );
  }

  static invalidInput(field, reason) {
    return new ValidationError(
      `잘못된 입력입니다: ${field}`,
      { [field]: reason }
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields
    };
  }
}

module.exports = ValidationError;

