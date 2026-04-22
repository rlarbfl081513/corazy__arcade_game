/**
 * 커스텀 에러 클래스 Export
 */

const BaseError = require('./BaseError');
const CompileError = require('./CompileError');
const RuntimeError = require('./RuntimeError');
const TimeoutError = require('./TimeoutError');
const MemoryError = require('./MemoryError');
const SystemError = require('./SystemError');
const S3Error = require('./S3Error');
const RedisError = require('./RedisError');
const ValidationError = require('./ValidationError');

module.exports = {
  BaseError,
  CompileError,
  RuntimeError,
  TimeoutError,
  MemoryError,
  SystemError,
  S3Error,
  RedisError,
  ValidationError
};

