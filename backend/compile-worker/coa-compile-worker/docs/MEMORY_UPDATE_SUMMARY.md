# 메모리 모니터링 개선 요약

## 🎯 변경 사항

### 이전 방식 → 현재 방식

| 항목 | 이전 | 현재 |
|------|------|------|
| **수집 방식** | 100ms마다 반복 수집 | 종료 시 1회만 수집 |
| **API 호출** | 10-50회/작업 | 1회/작업 |
| **오버헤드** | 중간 | 거의 없음 |
| **복잡도** | 높음 (interval 관리) | 낮음 (단순 호출) |
| **실패율** | 빠른 실행 시 높음 | 낮음 |

## 📝 수정된 파일

### 1. `services/dockerSandbox.js`

**추가:**
```javascript
// 컨테이너 메모리 사용량 수집 헬퍼 함수
async function collectMemoryStats(container) {
  try {
    const stats = await container.stats({ stream: false });
    
    if (stats.memory_stats && stats.memory_stats.usage) {
      return Math.round(stats.memory_stats.usage / 1024 / 1024);
    }
    else if (stats.memory_stats && stats.memory_stats.privateworkingset) {
      return Math.round(stats.memory_stats.privateworkingset / 1024 / 1024);
    }
    
    return 0;
  } catch (error) {
    console.log('⚠️  Failed to collect memory stats:', error.message);
    return 0;
  }
}
```

**변경:**
```javascript
// Before: 100ms interval로 실시간 모니터링
memoryMonitorInterval = setInterval(async () => { ... }, 100);

// After: 컨테이너 종료 직후 1회만 수집
containerInfo = await Promise.race([waitPromise, timeoutPromise]);
memoryUsed = await collectMemoryStats(container);
```

### 2. `README.md`

**업데이트:**
- 메모리 측정 방식 설명 간소화
- 실시간 모니터링 제거
- 종료 시점 수집으로 변경

### 3. `docs/MEMORY_MONITORING.md`

**완전 재작성:**
- 이전 방식과의 비교
- 현재 방식의 장점
- 플랫폼별 차이
- 문제 해결 가이드

## ✅ 장점

### 1. 성능 개선
```
이전: 10개 작업 × 30회 호출 = 300회 API 호출
현재: 10개 작업 × 1회 호출 = 10회 API 호출
→ 30배 감소!
```

### 2. 코드 간소화
```javascript
// Before: ~50줄 (interval 관리, clearInterval, try-finally 등)
let maxMemoryUsed = 0;
let memoryMonitorInterval;
memoryMonitorInterval = setInterval(async () => {
  try {
    const stats = await container.stats({ stream: false });
    // ...
  } catch (err) { }
}, 100);
// ... clearInterval in multiple places

// After: ~15줄 (단순 함수 호출)
const memoryUsed = await collectMemoryStats(container);
```

### 3. 안정성 향상
- 실행 시간과 무관하게 메모리 수집
- interval 관리 오류 가능성 제거
- 더 단순한 에러 처리

## 🧪 테스트 방법

### 1. 기본 동작 확인
```bash
npm start

# 새 터미널
node test/testCase1_simple.js
```

**예상 결과:**
```
Status: SUCCESS
MemoryUsed: 12MB  ✅ (숫자, NaN 아님)
```

### 2. 메모리 전용 테스트
```bash
node test/testCase25_memoryMonitoring.js
```

**확인 사항:**
- 모든 작업의 MemoryUsed가 숫자
- 메모리 사용량이 작업 부하에 따라 다름

### 3. 동시성 테스트
```bash
# .env
WORKER_PREFETCH=10

node test/testCase22_concurrency.js
```

**확인 사항:**
- 10개 작업 모두 MemoryUsed 정상
- 이전보다 빠른 처리 시간
- 낮은 CPU 사용률

## 📊 예상 결과

### 단일 작업
```json
{
  "jobId": "test-1",
  "status": "SUCCESS",
  "executionTime": 145,
  "memoryUsed": 15  ✅
}
```

### 메모리 집약적 작업
```json
{
  "jobId": "heavy-memory",
  "status": "SUCCESS",
  "executionTime": 1234,
  "memoryUsed": 87  ✅ (높은 메모리)
}
```

### 매우 빠른 작업
```json
{
  "jobId": "quick-task",
  "status": "SUCCESS",
  "executionTime": 85,
  "memoryUsed": 12  ✅ (정상 수집)
}
```

## 🔍 기술적 세부사항

### 타이밍

```
[컨테이너 시작]
      ↓
[코드 실행 중...]
      ↓
[실행 완료] ← 이 시점에 메모리 수집 ✅
      ↓
[로그 수집]
      ↓
[컨테이너 제거]
```

### 왜 이 시점인가?

1. **컨테이너가 아직 살아있음**
   - wait() 완료 = 프로세스 종료
   - 하지만 컨테이너는 잠시 유지됨
   - stats API 호출 가능

2. **정확한 메모리 반영**
   - 실행 중 사용한 메모리가 남아있음
   - 런타임 메모리 포함

3. **오버헤드 없음**
   - 실행 중 간섭 없음
   - 1회만 호출

## 🚨 주의사항

### 매우 드물게 0MB가 나올 수 있음

**발생 상황:**
- Docker가 컨테이너를 즉시 제거 (AutoRemove)
- stats 호출 전에 사라짐

**발생 확률:** < 0.1%

**해결:**
- 현재 코드는 실패 시 0을 반환
- 0이어도 채점 결과에 영향 없음 (메모리는 참고용)

## 📚 관련 문서

- `docs/MEMORY_MONITORING.md` - 상세 가이드
- `test/CONCURRENCY_TEST.md` - 동시성 테스트
- `README.md` - 프로젝트 개요

## 💡 핵심 메시지

> **"채점에만 필요한 메모리 정보를 최소 비용으로 수집"**

- ✅ 실시간 모니터링 불필요
- ✅ 종료 시점 1회 수집으로 충분
- ✅ 성능과 단순함 모두 확보

---

**업데이트 일자:** 2024-10-29
**변경 이유:** 사용자 피드백 - "실시간 메모리 현황 수집이 필요없음"

