# Error Classes

프로젝트의 커스텀 에러 클래스들을 정의합니다.

## 구조

```
error/
├── BaseError.js          # 기본 에러 클래스
├── CompileError.js       # 컴파일 에러
├── RuntimeError.js       # 런타임 에러
├── TimeoutError.js       # 시간 초과 에러
├── MemoryError.js        # 메모리 초과 에러
├── SystemError.js        # 시스템 에러
├── S3Error.js            # S3 관련 에러
├── RedisError.js         # Redis 관련 에러
├── ValidationError.js    # 유효성 검증 에러
└── index.js             # Export
```

## 사용 방법

### 1. 기본 사용

```javascript
const { CompileError, RuntimeError } = require('../error');

// 컴파일 에러 발생
throw CompileError.fromStderr(stderr, language);

// 런타임 에러 발생
throw RuntimeError.fromExecution(stderr, exitCode);
```

### 2. 에러 정보 추출

```javascript
try {
  // 작업 수행
} catch (error) {
  if (error instanceof BaseError) {
    console.log(error.status);      // 'CE', 'RE', 'TLE' 등
    console.log(error.message);     // 에러 메시지
    console.log(error.toJSON());    // JSON 형태로 변환
  }
}
```

### 3. 커스텀 에러 생성

```javascript
// 직접 생성
const error = new TimeoutError('시간 초과', 5000);

// 정적 메서드 사용
const error = TimeoutError.fromLimit(5000);
```

## 에러 타입

| 에러 클래스 | 상태 코드 | Status | 설명 |
|------------|----------|--------|------|
| CompileError | 400 | CE | 컴파일 오류 |
| RuntimeError | 400 | RE | 런타임 오류 |
| TimeoutError | 408 | TLE | 시간 초과 |
| MemoryError | 413 | MLE | 메모리 초과 |
| SystemError | 500 | SE | 시스템 오류 |
| S3Error | 500 | S3_ERROR | S3 작업 실패 |
| RedisError | 500 | REDIS_ERROR | Redis 작업 실패 |
| ValidationError | 400 | VALIDATION_ERROR | 입력 검증 실패 |

## 예제

### CompileError

```javascript
// stderr로부터 생성
const error = CompileError.fromStderr(stderr, 'cpp');
```

### TimeoutError

```javascript
// 시간 제한으로부터 생성
const error = TimeoutError.fromLimit(5000);
```

### S3Error

```javascript
// 테스트케이스를 찾을 수 없을 때
throw S3Error.notFound(problemId);

// 다운로드 실패 시
throw S3Error.downloadFailed(bucket, key, originalError);
```

### ValidationError

```javascript
// 필수 필드 누락
throw ValidationError.missingField('jobId');

// 지원하지 않는 언어
throw ValidationError.invalidLanguage('ruby');
```

