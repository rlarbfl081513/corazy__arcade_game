# 🚀 동시성(Concurrency) 테스트 가이드

비동기 처리 성능을 테스트하는 방법을 설명합니다.

## 📋 테스트 케이스 목록

| 파일 | 설명 | 작업 수 |
|------|------|---------|
| `testCase22_concurrency.js` | 동일 작업 동시 실행 | 10개 |
| `testCase23_concurrencyMixed.js` | 다양한 언어 혼합 실행 | 8개 |
| `testCase24_performance.js` | 순차 vs 병렬 성능 비교 | 5개 |

## 🔧 설정 방법

### 1. 순차 처리 (Sequential) - 기본값

`.env` 파일:
```bash
WORKER_PREFETCH=1
```

- 한 번에 하나의 작업만 처리
- 작업이 순서대로 완료됨
- 안전하지만 느림

### 2. 병렬 처리 (Concurrent)

`.env` 파일:
```bash
WORKER_PREFETCH=5
```

- 최대 5개의 작업을 동시에 처리
- 작업이 동시에 실행됨
- 빠르지만 리소스 사용량 증가

## 🧪 테스트 실행 방법

### Step 1: 순차 처리 테스트

```bash
# 1. .env 설정
WORKER_PREFETCH=1

# 2. 서버 시작
npm start

# 3. 새 터미널에서 테스트 실행
node test/testCase24_performance.js
```

**예상 결과:**
```
Job 1: 시작 → 완료
Job 2: 시작 → 완료
Job 3: 시작 → 완료
...
총 시간: ~10-15초 (순차적)
```

### Step 2: 병렬 처리 테스트

```bash
# 1. .env 수정
WORKER_PREFETCH=5

# 2. 서버 재시작 (Ctrl+C 후 다시 시작)
npm start

# 3. 동일한 테스트 실행
node test/testCase24_performance.js
```

**예상 결과:**
```
Job 1, 2, 3, 4, 5: 동시 시작 → 거의 동시 완료
총 시간: ~2-4초 (병렬)
```

## 📊 개별 테스트 설명

### Test 22: 기본 동시성 테스트

```bash
node test/testCase22_concurrency.js
```

**목적:** 동일한 JavaScript 작업 10개를 동시에 실행

**확인 사항:**
- PREFETCH=1: 작업이 순서대로 실행됨
- PREFETCH=5: 5개씩 묶음으로 실행됨
- PREFETCH=10: 모든 작업이 동시에 실행됨

**서버 로그 예시 (PREFETCH=5):**
```
📨 Job Received: concurrent-1
📨 Job Received: concurrent-2
📨 Job Received: concurrent-3
📨 Job Received: concurrent-4
📨 Job Received: concurrent-5
✅ Job completed: concurrent-1
📨 Job Received: concurrent-6  ← 하나 완료되면 다음 시작
✅ Job completed: concurrent-2
📨 Job Received: concurrent-7
...
```

### Test 23: 혼합 언어 동시성

```bash
node test/testCase23_concurrencyMixed.js
```

**목적:** 다양한 언어(JS, Python, C, C++) 작업을 동시에 실행

**확인 사항:**
- 다른 언어의 작업들이 섞여서 실행됨
- 각 언어의 컴파일/실행 시간 차이 확인
- C/C++은 컴파일 시간 때문에 더 오래 걸림

**예상 실행 시간:**
- JavaScript: ~100-200ms
- Python: ~200-300ms
- C/C++: ~500-1000ms (컴파일 포함)

### Test 24: 성능 비교

```bash
node test/testCase24_performance.js
```

**목적:** 순차 vs 병렬 처리의 성능 차이 측정

**비교 지표:**
| Metric | Sequential (P=1) | Concurrent (P=5) |
|--------|------------------|------------------|
| 총 시간 | ~10-15초 | ~2-4초 |
| CPU 사용률 | 낮음 (~20%) | 높음 (~80%) |
| 메모리 사용 | 낮음 | 중간 |
| 처리량 | 낮음 | 높음 |

## 📈 성능 측정 팁

### 1. 시간 측정

서버 로그에서 시간 확인:
```
📨 [2024-01-01T12:00:00.000Z] Job Received
✅ Job completed successfully
   Total Processing Time: 1234ms
```

### 2. CPU/메모리 모니터링

**Windows:**
```powershell
# 작업 관리자 열기
taskmgr

# 또는 PowerShell
Get-Process node | Select-Object CPU, WS
```

**Linux/Mac:**
```bash
# htop 설치 및 실행
htop

# 또는
top -p $(pgrep -f "node.*app.js")
```

### 3. Docker 컨테이너 모니터링

```bash
# 실행 중인 컨테이너 확인
docker ps

# 컨테이너 리소스 사용량
docker stats
```

## ⚙️ 권장 설정값

### 개발 환경
```bash
WORKER_PREFETCH=3
```
- 적당한 동시성
- 디버깅 가능
- 리소스 효율적

### 프로덕션 환경 (소형)
```bash
WORKER_PREFETCH=5
```
- CPU 코어 수에 맞춤 (4-8 코어)
- 안정적인 처리

### 프로덕션 환경 (대형)
```bash
WORKER_PREFETCH=10
```
- 많은 CPU 코어 (16+ 코어)
- 높은 처리량 필요 시

### 주의사항
```bash
# ❌ 너무 높은 값은 피하기
WORKER_PREFETCH=100  # 메모리 부족, 시스템 불안정
```

## 🎯 최적 설정 찾기

### 1. 점진적 증가

```bash
# Step 1
WORKER_PREFETCH=1  → 기준 성능 측정

# Step 2
WORKER_PREFETCH=3  → 성능 개선 확인

# Step 3
WORKER_PREFETCH=5  → 안정성 확인

# Step 4
WORKER_PREFETCH=10 → 한계 테스트
```

### 2. 병목 구간 확인

**CPU 병목:**
```
- 증상: CPU 100%, 메모리 낮음
- 해결: PREFETCH 유지, CPU 업그레이드
```

**메모리 병목:**
```
- 증상: 메모리 부족, Swap 사용
- 해결: PREFETCH 감소, 메모리 증설
```

**네트워크 병목 (S3, Redis):**
```
- 증상: CPU/메모리 낮음, 대기 시간 김
- 해결: 캐싱, 연결 풀 증가
```

## 📝 결과 기록 템플릿

```markdown
## 테스트 결과

**환경:**
- CPU: 8 cores
- RAM: 16GB
- Docker: 20.10.x

**테스트 1: testCase24_performance.js**
- PREFETCH=1: 총 12.5초
- PREFETCH=3: 총 5.2초
- PREFETCH=5: 총 3.8초
- PREFETCH=10: 총 3.5초

**결론:**
- PREFETCH=5가 최적 (성능 vs 리소스)
- 10 이상은 개선 미미
```

## 🚨 문제 해결

### 문제 1: "메모리 부족" 에러

**증상:**
```
Error: ENOMEM: not enough memory
```

**해결:**
1. PREFETCH 값 감소
2. Docker 메모리 제한 증가
3. 시스템 메모리 확인

### 문제 2: 작업이 실행되지 않음

**증상:**
```
👀 Waiting for messages...
(아무 반응 없음)
```

**해결:**
1. RabbitMQ 연결 확인
2. 큐 이름 확인
3. 메시지가 전송되었는지 확인

### 문제 3: Docker 컨테이너 쌓임

**증상:**
```
docker ps -a  # 많은 Exited 컨테이너
```

**해결:**
```bash
# 중지된 컨테이너 정리
docker container prune -f

# 자동 정리 확인 (코드에 AutoRemove 설정됨)
```

## 📚 추가 자료

- [RabbitMQ Prefetch 문서](https://www.rabbitmq.com/consumer-prefetch.html)
- [Docker 리소스 제한](https://docs.docker.com/config/containers/resource_constraints/)
- [Node.js 클러스터링](https://nodejs.org/api/cluster.html)

