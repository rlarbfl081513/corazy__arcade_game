# Worker FastAPI 통합 테스트 가이드

## 개요

이 문서는 FastAPI 컴파일 서버와 Worker 간의 통합 테스트를 수행하는 방법을 설명합니다.

## 사전 준비

### 1. 필수 서비스 실행

다음 서비스들이 실행 중이어야 합니다:

```bash
# RabbitMQ
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin \
  rabbitmq:3-management

# Redis
docker run -d --name redis \
  -p 6379:6379 \
  redis:latest

# MySQL (FastAPI용)
docker run -d --name mysql \
  -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=app \
  -e MYSQL_USER=app \
  -e MYSQL_PASSWORD=app \
  mysql:8.0
```

### 2. 환경 설정 확인

#### FastAPI 서버 (.env)
```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin
RABBITMQ_QUEUE_NAME=WorkerQueue

REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Worker (.env)
```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin
RABBITMQ_QUEUE=WorkerQueue

REDIS_HOST=localhost
REDIS_PORT=6379
```

## 테스트 시나리오

### 시나리오 1: SAMPLE 모드 (단순 실행)

#### 1단계: FastAPI 서버 시작

```bash
cd coa-compile-server
python -m uvicorn app.main:app --reload --port 8000
```

#### 2단계: Worker 시작

```bash
cd coa-compile-worker
node src/app.js
```

#### 3단계: 테스트 작업 제출

```bash
# FastAPI 서버에 POST 요청
curl -X POST "http://localhost:8000/api/algorithm/enqueue" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1000,
    "code": "print(\"Hello World\")",
    "language": "python",
    "mode": "SAMPLE",
    "input": ""
  }'
```

**응답 예시:**
```json
{
  "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "작업이 큐에 추가되었습니다"
}
```

#### 4단계: WebSocket으로 실시간 결과 확인

```bash
# Python WebSocket 클라이언트 실행
python test_websocket.py 550e8400-e29b-41d4-a716-446655440000
```

또는 직접 Node.js 스크립트로 Redis Pub/Sub 구독:

```bash
cd coa-compile-worker
node test/subscribeResult.js 550e8400-e29b-41d4-a716-446655440000
```

### 시나리오 2: EVALUATE 모드 (채점)

#### 1단계: S3에 테스트 데이터 준비

S3 버킷에 다음과 같은 구조로 테스트 데이터를 업로드합니다:

```
s3://your-bucket/problems/1000/evaluate/
  ├── 1.in
  ├── 1.ans
  ├── 2.in
  ├── 2.ans
  └── ...
```

#### 2단계: 테스트 작업 제출

```bash
curl -X POST "http://localhost:8000/api/algorithm/enqueue" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1000,
    "code": "a, b = map(int, input().split())\nprint(a + b)",
    "language": "python",
    "mode": "EVALUATE",
    "input": ""
  }'
```

#### 3단계: 실시간 채점 결과 확인

```bash
python test_websocket.py <submission_uuid>
```

**예상 출력:**
```
[10:30:45.123] 📨 메시지 #1 수신:
   타입: progress
   진행: 0/5
   메시지: 채점 시작
   ⏳ 진행 중...

[10:30:46.234] 📨 메시지 #2 수신:
   타입: testcase
   테스트케이스 #1: AC
   실행 시간: 123ms
   메모리: 12.5MB

[10:30:46.345] 📨 메시지 #3 수신:
   타입: progress
   진행: 1/5
   메시지: 테스트케이스 1/5 처리 완료
   ⏳ 진행 중...

...

[10:30:50.678] 📨 메시지 #11 수신:
   타입: result
   📊 최종 결과:
   상태: AC
   점수: 100점
   통과: 5/5
   메시지: 5/5 테스트케이스 통과

[10:30:50.789] 📨 메시지 #12 수신:
   타입: complete
   ✅ 완료:
   메시지: 채점이 완료되었습니다

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 채점이 완료되었습니다.
   총 수신 메시지: 12개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 시나리오 3: Worker 직접 테스트 (기존 방식)

Worker만 단독으로 테스트하려면:

```bash
cd coa-compile-worker

# SAMPLE 모드 테스트
node test/testCase1_simple.js

# EVALUATE 모드 테스트 (S3 필요)
node test/testCase19_judgeEvaluate.js

# Redis Pub/Sub 구독
node test/subscribeResult.js <submission_uuid>
```

## 메시지 형식

### FastAPI → RabbitMQ → Worker

```json
{
  "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "problem_id": 1000,
  "code": "print('Hello')",
  "language": "python",
  "mode": "EVALUATE",  // 또는 "SAMPLE"
  "input": ""  // SAMPLE 모드에서만 사용
}
```

### Worker → Redis Pub/Sub → FastAPI WebSocket

#### Progress 메시지
```json
{
  "submission_uuid": "...",
  "type": "progress",
  "current": 1,
  "total": 5,
  "message": "테스트케이스 1/5 처리 완료"
}
```

#### TestCase 메시지
```json
{
  "submission_uuid": "...",
  "type": "testcase",
  "result": {
    "test_case_number": 1,
    "status": "AC",
    "input": "1 2",
    "expected_output": "3",
    "actual_output": "3",
    "execution_time": 123,
    "memory_usage": 12.5,
    "error_message": null
  }
}
```

#### Result 메시지
```json
{
  "submission_uuid": "...",
  "type": "result",
  "result": {
    "status": "AC",
    "score": 100,
    "total_test_cases": 5,
    "passed_test_cases": 5,
    "failed_test_cases": 0,
    "total_execution_time": 1234,
    "max_memory_usage": 15.3,
    "message": "5/5 테스트케이스 통과"
  }
}
```

#### Error 메시지
```json
{
  "submission_uuid": "...",
  "type": "error",
  "error": "컴파일 에러",
  "error_type": "CompileError",
  "details": {}
}
```

#### Complete 메시지 (필수!)
```json
{
  "submission_uuid": "...",
  "type": "complete",
  "message": "채점이 완료되었습니다"
}
```

## 트러블슈팅

### 문제 1: RabbitMQ 연결 실패

**증상:**
```
❌ RabbitMQ 연결 실패: ECONNREFUSED
```

**해결:**
```bash
# RabbitMQ가 실행 중인지 확인
docker ps | grep rabbitmq

# 로그 확인
docker logs rabbitmq

# 재시작
docker restart rabbitmq
```

### 문제 2: Redis Pub/Sub 메시지 수신 안됨

**증상:**
WebSocket이나 subscribeResult.js에서 메시지를 받지 못함

**해결:**
```bash
# Redis 연결 확인
redis-cli ping

# Worker 로그에서 publish 메시지 확인
# "✓ Published to compile:..." 로그가 있어야 함

# Redis 채널 모니터링
redis-cli
> PSUBSCRIBE compile:*
```

### 문제 3: Worker가 메시지를 처리하지 않음

**증상:**
RabbitMQ에 메시지가 쌓이지만 Worker가 처리하지 않음

**해결:**
```bash
# Worker 로그 확인
# "📨 Job Received" 로그가 있어야 함

# RabbitMQ 큐 확인
# http://localhost:15672 (admin/admin)
# Queues 탭에서 WorkerQueue의 메시지 수 확인

# 메시지 형식 확인
# submission_uuid, problem_id, mode 필드가 올바른지 확인
```

### 문제 4: WebSocket 연결 끊김

**증상:**
```
❌ WebSocket 에러: Connection closed
```

**해결:**
- FastAPI 서버가 실행 중인지 확인
- submission_uuid가 올바른지 확인
- Redis Pub/Sub이 정상 작동하는지 확인
- complete 메시지가 발행되었는지 확인 (Worker 로그)

## 성공 기준

✅ **통합 테스트 성공 체크리스트:**

1. [ ] FastAPI 서버가 정상적으로 시작됨
2. [ ] Worker가 RabbitMQ에 연결됨
3. [ ] enqueue API가 submission_uuid를 반환함
4. [ ] RabbitMQ에 메시지가 전송됨
5. [ ] Worker가 메시지를 수신하고 처리함
6. [ ] Worker가 Redis Pub/Sub으로 진행 상황을 발행함
7. [ ] WebSocket이 실시간으로 메시지를 수신함
8. [ ] complete 메시지가 마지막에 수신됨
9. [ ] WebSocket 연결이 정상적으로 종료됨
10. [ ] 모든 프로세스에서 에러가 없음

## 다음 단계

모든 테스트가 성공하면:

1. **프로덕션 배포 준비**
   - Docker Compose로 모든 서비스 통합
   - 환경 변수 관리 체계 구축
   - 모니터링 및 로깅 설정

2. **성능 테스트**
   - 동시 요청 처리 능력 테스트
   - Worker 스케일링 테스트
   - Redis/RabbitMQ 부하 테스트

3. **보안 강화**
   - CORS 설정 검토
   - 인증/인가 추가
   - Rate Limiting 구현

