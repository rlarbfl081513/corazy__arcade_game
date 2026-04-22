const BaseError = require('./BaseError');

/**
 * 런타임 에러
 * 코드 실행 중 발생하는 에러
 */
class RuntimeError extends BaseError {
  constructor(message, details = null) {
    super(
      message || '런타임 오류가 발생하였습니다.',
      400,
      'RE'
    );
    this.details = details;
  }

  static fromExecution(stderr, exitCode) {
    // stderr 내용 분석
    const errorAnalysis = {
      error: stderr,
      exitCode,
      type: 'runtime_exception'
    };

    // 일반적인 런타임 에러 패턴 분석
    if (stderr.includes('Segmentation fault') || stderr.includes('SIGSEGV')) {
      errorAnalysis.likelyReason = 'Segmentation fault (메모리 접근 오류)';
    } else if (stderr.includes('IndexError') || stderr.includes('out of bounds')) {
      errorAnalysis.likelyReason = 'Array/List index out of bounds';
    } else if (stderr.includes('ZeroDivisionError') || stderr.includes('division by zero')) {
      errorAnalysis.likelyReason = 'Division by zero';
    } else if (stderr.includes('NameError') || stderr.includes('ReferenceError')) {
      errorAnalysis.likelyReason = 'Undefined variable or function';
    } else if (stderr.includes('TypeError')) {
      errorAnalysis.likelyReason = 'Type error';
    } else if (stderr.includes('ValueError')) {
      errorAnalysis.likelyReason = 'Invalid value';
    } else if (stderr.includes('RecursionError') || stderr.includes('stack overflow')) {
      errorAnalysis.likelyReason = 'Stack overflow (무한 재귀)';
    } else if (stderr.includes('MemoryError')) {
      errorAnalysis.likelyReason = 'Memory allocation failed';
    } else if (exitCode === 139) {
      errorAnalysis.likelyReason = 'Segmentation fault (exit code 139)';
    } else if (exitCode === 137) {
      errorAnalysis.likelyReason = 'Process killed (exit code 137 - possibly OOM)';
    }

    console.log('   [RuntimeError] Analysis:', errorAnalysis.likelyReason || 'Unknown runtime error');

    return new RuntimeError(
      '런타임 오류가 발생하였습니다.',
      errorAnalysis
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details
    };
  }
}

module.exports = RuntimeError;

