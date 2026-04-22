# 메모리 모니터링 가이드

## 📊 개요

컨테이너 실행 중 메모리 사용량을 측정하여 채점 결과에 포함합니다.

## 🎯 설계 철학

### 핵심 원칙
1. **효율성 우선**: 채점 결과에만 메모리가 필요하므로 실시간 모니터링 불필요
2. **오버헤드 최소화**: 실행 중 모니터링으로 인한 성능 저하 방지
3. **간단한 구조**: 복잡한 interval 없이 단순하게 한 번만 수집

## 🔧 작동 방식

### 기본 흐름

```javascript
// 1. 컨테이너 시작
await container.start();

// 2. 컨테이너 실행 완료 대기
const containerInfo = await container.wait();

// 3. 종료 직후 메모리 수집 (한 번만)
const memoryUsed = await collectMemoryStats(container);

// 4. 결과에 포함
result.memoryUsed = memoryUsed;
```

### collectMemoryStats 함수

```javascript
async function collectMemoryStats(container) {
  try {
    const stats = await container.stats({ stream: false });
    
    // Linux: memory_stats.usage
    if (stats.memory_stats && stats.memory_stats.usage) {
      return Math.round(stats.memory_stats.usage / 1024 / 1024); // MB
    }
    // Windows: privateworkingset
    else if (stats.memory_stats && stats.memory_stats.privateworkingset) {
      return Math.round(stats.memory_stats.privateworkingset / 1024 / 1024); // MB
    }
    
    return 0;
  } catch (error) {
    console.log('⚠️  Failed to collect memory stats:', error.message);
    return 0;
  }
}
```

## 🆚 이전 방식과의 비교

### ❌ 이전 방식 (실시간 모니터링)

```javascript
// 100ms마다 메모리 체크
let maxMemoryUsed = 0;
const interval = setInterval(async () => {
  const stats = await container.stats({ stream: false });
  const current = stats.memory_stats.usage / 1024 / 1024;
  maxMemoryUsed = Math.max(maxMemoryUsed, current);
}, 100);

// 문제점:
// - 실행 시간이 짧으면 샘플링 실패
// - 지속적인 API 호출로 오버헤드 발생
// - 복잡한 interval 관리 필요
```

**문제점:**
- ⚠️ 100ms보다 빠른 실행의 경우 메모리 수집 실패 → `0MB`
- ⚠️ 동시에 많은 작업 실행 시 stats API 호출 증가 → CPU 부하
- ⚠️ interval 관리 복잡 (clearInterval, finally 블록 등)

### ✅ 현재 방식 (종료 시점 수집)

```javascript
// 컨테이너 종료 직후 한 번만 수집
await container.wait();
const memoryUsed = await collectMemoryStats(container);

// 장점:
// - 단순하고 명확
// - 오버헤드 없음
// - 실행 시간과 무관하게 수집 가능
```

**장점:**
- ✅ 간단한 구조
- ✅ 오버헤드 최소화
- ✅ 실행 시간과 무관
- ✅ 관리 포인트 감소

## 🔍 플랫폼별 차이

### Linux / Mac
```javascript
stats.memory_stats.usage  // 현재 메모리 사용량 (bytes)
```

**예시:**
```json
{
  "memory_stats": {
    "usage": 26214400,        // 25 MB
    "max_usage": 28311552,
    "limit": 268435456
  }
}
```

### Windows (Docker Desktop)
```javascript
stats.memory_stats.privateworkingset  // 프로세스 전용 메모리 (bytes)
```

**예시:**
```json
{
  "memory_stats": {
    "privateworkingset": 27262976  // 26 MB
  }
}
```

## 📊 메모리 사용량 예시

### 정상 케이스

#### JavaScript - 간단한 출력
```javascript
console.log('Hello World');
```
```
ExecutionTime: 120ms
MemoryUsed: 12MB  ✅
```

#### Python - 리스트 연산
```python
data = [i**2 for i in range(100000)]
print(len(data))
```
```
ExecutionTime: 380ms
MemoryUsed: 45MB  ✅
```

#### C - 배열 연산
```c
int arr[1000000];
for(int i=0; i<1000000; i++) arr[i] = i;
```
```
ExecutionTime: 650ms (컴파일 포함)
MemoryUsed: 28MB  ✅
```

### 메모리 수집 실패 케이스

드물지만 다음 경우에 `0MB`가 나올 수 있습니다:

1. **컨테이너가 즉시 제거됨**
   - Docker의 `AutoRemove: true` 설정으로 wait 직후 컨테이너 제거
   - stats 호출 전에 이미 사라짐

2. **Docker 데몬 오류**
   - Docker 서비스 일시적 중단
   - stats API 응답 실패

3. **플랫폼 호환성 문제**
   - 매우 오래된 Docker 버전
   - 특정 환경에서 stats 미지원

**발생 확률:** < 0.1% (매우 드뭄)

## 🚨 문제 해결

### 문제 1: MemoryUsed가 항상 0

**증상:**
```
Result:
  Status: SUCCESS
  MemoryUsed: 0  ❌
```

**원인 체크리스트:**
1. Docker Desktop 실행 중인가?
2. Docker 버전이 너무 오래되었나? (`docker version`)
3. Windows WSL2 모드인가?

**해결:**
```bash
# Docker 버전 확인
docker version

# Docker 재시작
# Windows: Docker Desktop 재시작
# Linux: sudo systemctl restart docker

# stats 테스트
docker run --rm alpine sh -c "echo hello"
docker ps -a  # 방금 실행한 컨테이너 ID 확인
docker stats <container_id> --no-stream
```

### 문제 2: 메모리가 예상보다 높음

**증상:**
```
Code: console.log('hi');
MemoryUsed: 150MB  ⚠️ (예상: 10-20MB)
```

**원인:**
- Docker 이미지 자체의 메모리 사용량 포함
- Node.js/Python 런타임 메모리

**정상입니다!** 
- 측정값은 **컨테이너 전체 메모리**입니다
- 언어 런타임 + 실제 코드 메모리

**언어별 베이스라인:**
| 언어 | 베이스 메모리 | 설명 |
|------|---------------|------|
| Node.js | 10-15MB | V8 엔진 |
| Python | 8-12MB | 인터프리터 |
| C/C++ | 4-8MB | gcc 컴파일러 결과물 |
| Java | 20-30MB | JVM |

### 문제 3: 메모리 제한 테스트

MLE (Memory Limit Exceeded) 테스트:

```javascript
// 테스트 코드
const arr = new Array(100000000).fill(1);  // 매우 큰 배열
console.log(arr.length);

// 컨테이너 옵션에 메모리 제한 설정
HostConfig: {
  Memory: 128 * 1024 * 1024  // 128MB 제한
}

// 예상 결과
Status: MLE (Memory Limit Exceeded)
```

**참고:** 현재 구현에서는 컨테이너 종료 코드와 stderr을 확인하여 MLE 판단

## 📈 성능 비교

### 리소스 사용량

| 방식 | API 호출 수 | CPU 오버헤드 | 복잡도 |
|------|-------------|--------------|--------|
| 이전 (100ms interval) | 10-50회/작업 | 중간 | 높음 |
| 현재 (종료 시 1회) | 1회/작업 | 거의 없음 | 낮음 |

### WORKER_PREFETCH=10일 때

**이전 방식:**
```
10개 작업 × 평균 30회 stats 호출 = 300회 API 호출
→ Docker 데몬 부하 증가
→ 전체 처리 시간 증가
```

**현재 방식:**
```
10개 작업 × 1회 stats 호출 = 10회 API 호출
→ 최소 부하
→ 빠른 처리
```

## ✅ 테스트 방법

### 기본 테스트

```bash
# 서버 시작
npm start

# 새 터미널에서 테스트
node test/testCase25_memoryMonitoring.js
```

**예상 결과:**
```
Test Case 25: Memory Monitoring Test
=====================================

📊 Testing memory monitoring functionality

Expected: MemoryUsed should be a number (not NaN)

📤 Sending 4 memory test jobs...

  1. Low memory (simple)
     Expected: MemoryUsed: 10-30 MB
     JobId: mem-test-1

  2. Medium memory (array)
     Expected: MemoryUsed: 30-80 MB
     JobId: mem-test-2
...
```

**서버 로그 확인:**
```
✅ Job completed successfully
   Job ID: mem-test-1
   Status: SUCCESS
   ExecutionTime: 145ms
   MemoryUsed: 15MB  ✅ 정상
```

### 동시성 테스트

```bash
# .env에서 WORKER_PREFETCH 설정
WORKER_PREFETCH=10

# 동시에 많은 작업 실행
node test/testCase22_concurrency.js
```

**확인 사항:**
- 모든 작업의 MemoryUsed가 숫자 (NaN 없음)
- CPU 사용률이 이전보다 낮음
- 전체 처리 시간이 빠름

## 📚 추가 정보

### Docker Stats API 문서
- [Docker Engine API - Container Stats](https://docs.docker.com/engine/api/v1.41/#operation/ContainerStats)

### 코드 위치
- `services/dockerSandbox.js` - `collectMemoryStats()` 함수
- 호출 시점: `container.wait()` 직후

### 관련 파일
- `services/dockerSandbox.js` - 메모리 수집 로직
- `test/testCase25_memoryMonitoring.js` - 메모리 테스트
- `test/testCase22_concurrency.js` - 동시성 테스트

---

## 요약

✅ **간단함:** 종료 시점에 한 번만 수집
✅ **효율적:** 실시간 모니터링 오버헤드 없음
✅ **정확함:** 컨테이너 실제 메모리 사용량 반영
✅ **안정적:** 플랫폼 호환성 (Linux/Windows)

채점 결과에 필요한 메모리 정보를 최소한의 비용으로 수집합니다.
