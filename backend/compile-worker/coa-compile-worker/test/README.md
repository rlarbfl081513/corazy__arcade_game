# Test Cases

COA Compile Server의 테스트 케이스 모음입니다.

## 📋 테스트 케이스 목록

### 기본 테스트
| 파일 | 설명 | 언어 | 기대 결과 |
|------|------|------|----------|
| `insertTestJob.js` | 기본 Hello World | JavaScript | SUCCESS |
| `testCase1_simple.js` | 간단한 출력 | JavaScript | SUCCESS |

### 입력 처리 테스트
| 파일 | 설명 | 언어 | 기대 결과 |
|------|------|------|----------|
| `testCase2_withInput.js` | JS 입력 처리 (readline) | JavaScript | SUCCESS |
| `testCase12_pythonInput.js` | Python 입력 처리 | Python | SUCCESS |
| `testCase13_cInput.js` | C 언어 입력 처리 (scanf) | C | SUCCESS |
| `testCase14_javaInput.js` | Java 입력 처리 (Scanner) | Java | SUCCESS |
| `testCase17_multiline.js` | 여러 줄 입력 처리 | Python | SUCCESS |

### 에러 처리 테스트
| 파일 | 설명 | 언어 | 기대 결과 |
|------|------|------|----------|
| `testCase3_error.js` | 런타임 에러 (RE) | JavaScript | RE |
| `testCase4_timeout.js` | 무한루프 타임아웃 (TLE) | JavaScript | TLE |
| `testCase9_compileError.js` | 컴파일 에러 (CE) | C++ | CE |
| `testCase10_memoryLimit.js` | 메모리 초과 (MLE) | JavaScript | MLE |
| `testCase11_validation.js` | 입력 검증 에러 | - | VALIDATION_ERROR |

### 언어별 테스트
| 파일 | 설명 | 언어 | 기대 결과 |
|------|------|------|----------|
| `testCase5_python.js` | Python 기본 기능 | Python | SUCCESS |
| `testCase6_c.js` | C 언어 기본 기능 | C | SUCCESS |
| `testCase7_cpp.js` | C++ STL 사용 | C++ | SUCCESS |
| `testCase8_java.js` | Java Collections | Java | SUCCESS |

### 고급 기능 테스트
| 파일 | 설명 | 모드 | 기대 결과 |
|------|------|------|----------|
| `testCase15_judgeMode.js` | Judge 모드 (구 JSON, S3 필요) | judge | AC 또는 WA |
| `testCase16_longOutput.js` | 긴 출력 처리 | run | SUCCESS |
| `testCase18_judgeSample.js` | Judge 모드 - Sample (.in/.ans) | judge | AC |
| `testCase19_judgeEvaluate.js` | Judge 모드 - Evaluate (.in/.ans) | judge | AC |
| `testCase20_judgeWrongAnswer.js` | Judge 모드 - Wrong Answer | judge | WA |
| `testCase21_judgeMultipleProblems.js` | Judge 모드 - 여러 문제 | judge | AC |

## 🚀 실행 방법

### 1. 모든 테스트 실행

```bash
npm run test:all
```

### 2. 단일 테스트 실행

```bash
# 특정 테스트케이스 실행
node test/testCase1_simple.js

# 또는
npm run test:queue
```

### 3. 카테고리별 실행

```bash
# 기본 테스트만
node test/testCase1_simple.js

# 에러 테스트만
node test/testCase3_error.js
node test/testCase4_timeout.js
node test/testCase9_compileError.js
```

## 📊 테스트 결과 확인

테스트 실행 후 서버 콘솔에서 다음 정보를 확인할 수 있습니다:

```
📊 Execution Result:
   Status: SUCCESS (정상적으로 실행되었습니다.)
   Success: true
   Execution Time: 150ms
   Memory Used: 25MB
   Total Processing Time: 200ms
```

### 상태 코드
- `SUCCESS`: 정상 실행
- `CE`: Compile Error (컴파일 에러)
- `RE`: Runtime Error (런타임 에러)
- `TLE`: Time Limit Exceeded (시간 초과)
- `MLE`: Memory Limit Exceeded (메모리 초과)
- `SE`: System Error (시스템 에러)
- `VALIDATION_ERROR`: 입력 검증 실패

## 🔧 테스트 전 준비사항

### 1. 환경변수 설정

테스트는 `.env` 파일의 RabbitMQ 설정을 사용합니다:

```bash
# .env 파일에서 설정
RABBITMQ_HOST=your-rabbitmq-host
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin
RABBITMQ_QUEUE=WorkerQueue
```

로컬 테스트를 위해 RabbitMQ가 필요하다면:

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin \
  rabbitmq:3-management
```

그 후 `.env`에서:
```bash
RABBITMQ_HOST=localhost
```

### 2. 서버 실행

```bash
npm start
```

### 3. S3 설정 (Judge 모드 테스트 시)

Judge 모드 테스트를 실행하려면 S3에 테스트케이스가 있어야 합니다:

**새 파일 구조** (권장):
```
s3://bucket-name/problems/1000/
  ├── info.json
  ├── sample/
  │   ├── 1.in
  │   └── 1.ans
  └── evaluate/
      ├── 1.in
      ├── 1.ans
      ├── 2.in
      └── 2.ans
```

**업로드 방법**:
```bash
cd test/s3-sample-data
aws s3 sync problems/ s3://your-s3-bucket-name/problems/
```

**구 JSON 형식** (하위 호환성):
```
s3://bucket-name/problems/1000/testcases.json
```

## 📝 새로운 테스트 추가하기

새로운 테스트케이스를 추가하려면:

1. `test/testCaseN_name.js` 파일 생성
2. 다음 템플릿 사용:

```javascript
console.log("Test Case N: Description");

const amqp = require('amqplib/callback_api');
const config = require('./config');

amqp.connect(config.rabbitmq.url, function(error0, connection) {
  if (error0) throw error0;

  connection.createChannel(function(error1, channel) {
    if (error1) throw error1;

    var queue = config.rabbitmq.queue;
    channel.assertQueue(queue, { durable: false });

    const jobData = {
      jobId: "test-00N",
      problemId: N,
      mode: "run",  // 또는 "judge"
      code: "your code here",
      language: "javascript",  // javascript, python, c, cpp, java
      input: "optional input"  // 선택사항
    };
    
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData)));
    console.log(" [x] Sent job:", jobData.jobId);
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});
```

3. `runAllTests.js`의 `testFiles` 배열에 추가

## 🐛 문제 해결

### 테스트가 실패하는 경우

1. **RabbitMQ 연결 실패**
   - RabbitMQ가 실행 중인지 확인
   - 포트 5672가 열려있는지 확인

2. **서버가 메시지를 받지 못함**
   - 서버가 실행 중인지 확인
   - 큐 이름이 일치하는지 확인 (WorkerQueue)

3. **Docker 이미지 없음**
   - 첫 실행 시 이미지를 다운로드하므로 시간이 걸릴 수 있음
   - 서버 로그에서 이미지 pull 진행상황 확인

4. **S3/Redis 연결 실패**
   - `.env` 파일에 올바른 자격증명이 있는지 확인
   - 해당 서비스가 선택사항이므로 경고만 출력됨

## 📈 테스트 커버리지

현재 테스트 커버리지:

- ✅ 5개 언어 지원 (JS, Python, C, C++, Java)
- ✅ 입력 처리 (모든 언어)
- ✅ 에러 처리 (CE, RE, TLE, MLE)
- ✅ 입력 검증
- ✅ Judge 모드
- ✅ 긴 출력/입력 처리

## 🔍 추가 테스트 아이디어

향후 추가할 수 있는 테스트:

- [ ] 동시 다중 작업 처리
- [ ] 매우 큰 입력 파일 (1MB+)
- [ ] 특수 문자 처리
- [ ] 다양한 인코딩 테스트
- [ ] 네트워크 제한 테스트
- [ ] CPU 제한 테스트

