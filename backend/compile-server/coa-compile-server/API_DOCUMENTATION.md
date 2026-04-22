# COA Compile Server API Documentation

## 개요

COA Compile Server는 코드 컴파일 및 실행을 담당하는 FastAPI 기반 서버입니다.

- **Base URL**: `http://localhost:8000`
- **API Version**: `1.0.0`
- **Communication**: REST API + WebSocket

---

## 목차

1. [Algorithm API](#algorithm-api)
   - [POST /api/algorithm/enqueue](#post-apialgorithmenqueue)
   - [WebSocket /api/algorithm/ws/{submission_uuid}](#websocket-apialgorithmwssubmission_uuid)
2. [Problem API](#problem-api)
   - [GET /api/problem/list](#get-apiproblemlist)
   - [GET /api/problem/info](#get-apiprobleminfo)
3. [Error Codes](#error-codes)

---

## Algorithm API

### POST /api/algorithm/enqueue

코드 컴파일 작업을 큐에 추가하는 엔드포인트입니다.

#### 기능 설명
- 사용자가 제출한 코드를 RabbitMQ 큐에 추가
- Worker가 비동기로 컴파일 및 실행 처리
- 제출 UUID를 반환하여 WebSocket으로 결과 수신 가능

#### Request

**HTTP Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body Parameters**:

| 파라미터 | 타입 | 필수 | 설명 | 제약사항 |
|---------|------|------|------|---------|
| `submission_uuid` | string | ❌ | 제출 UUID (테스트용) | UUID v4 형식. 미제공 시 자동 생성 |
| `problem_id` | integer | ✅ | 문제 번호 | 1 이상의 양의 정수 |
| `code` | string | ✅ | 소스 코드 | 1~100,000자, 공백이 아닌 코드 |
| `language` | string | ✅ | 프로그래밍 언어 | `python`, `java`, `c`, `cpp`, `javascript` |
| `mode` | string | ✅ | 실행 모드 | `EVALUATE` (제출), `SAMPLE` (테스트) |
| `input` | string | ⚠️ | 테스트 입력 데이터 | `SAMPLE` 모드에서 필수 |

**언어 지원 목록**:
- `python`: Python
- `java`: Java
- `c`: C
- `cpp`: C++
- `javascript`: JavaScript

**실행 모드**:
- `EVALUATE`: 실제 제출 모드 (서버의 테스트케이스로 채점)
- `SAMPLE`: 테스트 모드 (사용자 제공 입력으로 실행)

#### Response

**Success (200 OK)**:

```json
{
  "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "작업이 큐에 추가되었습니다"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `submission_uuid` | string | 제출을 추적할 수 있는 고유 UUID |
| `status` | string | 작업 상태 (`queued`) |
| `message` | string | 응답 메시지 |

#### JavaScript 예시

##### 제출 모드 (EVALUATE)

```javascript
async function submitCode(problemId, code, language) {
  try {
    const response = await fetch('http://localhost:8000/api/algorithm/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem_id: problemId,
        code: code,
        language: language,
        mode: 'EVALUATE'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('제출 성공:', data);
    return data.submission_uuid;
  } catch (error) {
    console.error('제출 실패:', error);
    throw error;
  }
}

// 사용 예시
const submissionUuid = await submitCode(
  1000,
  'def solution():\n    return 42',
  'python'
);
```

##### 테스트 모드 (SAMPLE)

```javascript
async function testCode(problemId, code, language, input) {
  try {
    const response = await fetch('http://localhost:8000/api/algorithm/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem_id: problemId,
        code: code,
        language: language,
        mode: 'SAMPLE',
        input: input  // SAMPLE 모드에서 필수
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '요청 실패');
    }

    const data = await response.json();
    console.log('테스트 시작:', data);
    return data.submission_uuid;
  } catch (error) {
    console.error('테스트 실패:', error);
    throw error;
  }
}

// 사용 예시
const testUuid = await testCode(
  1000,
  'print(sum(map(int, input().split())))',
  'python',
  '1 2 3'
);
```

#### 오류 응답

| 상태 코드 | 오류 메시지 | 설명 | 해결 방법 |
|----------|------------|------|----------|
| `400` | `"코드가 비어있습니다"` | code 필드가 공백만 포함 | 유효한 코드 입력 |
| `400` | `"SAMPLE 모드에서는 input이 필수입니다"` | SAMPLE 모드인데 input 미제공 | input 파라미터 추가 |
| `422` | `Validation Error` | 필수 필드 누락 또는 타입 오류 | 요청 body 형식 확인 |
| `422` | `"language: Input should be 'python', 'java'..."` | 지원하지 않는 언어 | 지원 언어 목록 확인 |
| `500` | `"작업 큐 추가 실패: ..."` | RabbitMQ 연결 실패 등 서버 오류 | 서버 관리자에게 문의 |

---

### WebSocket /api/algorithm/ws/{submission_uuid}

실시간 채점 결과를 수신하는 WebSocket 엔드포인트입니다.

#### 기능 설명
- Redis Pub/Sub을 통해 Worker가 발행하는 채점 결과를 실시간 스트리밍
- 진행 상황, 테스트케이스 결과, 최종 결과를 순차적으로 수신
- `complete` 메시지 수신 시 자동으로 연결 종료

#### Request

**Protocol**: `WebSocket`

**URL**: `ws://localhost:8000/api/algorithm/ws/{submission_uuid}`

**Path Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `submission_uuid` | string | ✅ | `/enqueue`에서 받은 제출 UUID |

#### WebSocket 메시지 타입

##### 1. Progress Message (진행 상황)

```json
{
  "type": "progress",
  "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "current": 3,
  "total": 10,
  "message": "테스트케이스 3/10 처리 중..."
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | 메시지 타입 (`progress`) |
| `submission_uuid` | string | 제출 UUID |
| `current` | integer | 현재 처리 중인 테스트케이스 번호 |
| `total` | integer | 전체 테스트케이스 수 |
| `message` | string | 진행 메시지 |

##### 2. TestCase Message (테스트케이스 결과)

```json
{
  "type": "testcase",
  "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "test_case_number": 1,
    "status": "AC",
    "input": "1 2",
    "expected_output": "3",
    "actual_output": "3",
    "execution_time": 123.45,
    "memory_usage": 2048,
    "error_message": null
  }
}
```

**result 객체**:

| 필드 | 타입 | 설명 |
|------|------|------|
| `test_case_number` | integer | 테스트케이스 번호 |
| `status` | string | 결과 상태 (아래 표 참고) |
| `input` | string? | 입력 데이터 (공개 테스트케이스만) |
| `expected_output` | string? | 예상 출력 (공개 테스트케이스만) |
| `actual_output` | string? | 실제 출력 |
| `execution_time` | number? | 실행 시간 (밀리초) |
| `memory_usage` | integer? | 메모리 사용량 (KB) |
| `error_message` | string? | 에러 메시지 (오류 발생 시) |

**테스트케이스 상태 코드**:

| 코드 | 의미 | 설명 |
|------|------|------|
| `AC` | Accepted | 정답 |
| `WA` | Wrong Answer | 오답 |
| `TLE` | Time Limit Exceeded | 시간 초과 |
| `RE` | Runtime Error | 런타임 에러 |
| `MLE` | Memory Limit Exceeded | 메모리 초과 |
| `CE` | Compile Error | 컴파일 에러 |

##### 3. Result Message (최종 결과)

```json
{
  "type": "result",
  "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "status": "AC",
    "score": 100,
    "total_test_cases": 10,
    "passed_test_cases": 10,
    "failed_test_cases": 0,
    "total_execution_time": 1234.56,
    "max_memory_usage": 4096,
    "message": "모든 테스트케이스를 통과했습니다"
  }
}
```

**result 객체**:

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | string | 최종 채점 상태 (`AC`, `WA`, `TLE`, `RE`, `MLE`, `CE`, `PE`) |
| `score` | integer? | 점수 (0~100) |
| `total_test_cases` | integer | 전체 테스트케이스 수 |
| `passed_test_cases` | integer | 통과한 테스트케이스 수 |
| `failed_test_cases` | integer | 실패한 테스트케이스 수 |
| `total_execution_time` | number? | 총 실행 시간 (밀리초) |
| `max_memory_usage` | integer? | 최대 메모리 사용량 (KB) |
| `message` | string | 결과 메시지 |

##### 4. Error Message (에러)

```json
{
  "type": "error",
  "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "error": "컴파일 에러가 발생했습니다",
  "error_type": "CompileError",
  "details": {
    "line": 5,
    "message": "SyntaxError: invalid syntax"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | 메시지 타입 (`error`) |
| `submission_uuid` | string | 제출 UUID |
| `error` | string | 에러 메시지 |
| `error_type` | string? | 에러 타입 |
| `details` | object? | 상세 정보 |

##### 5. Complete Message (완료)

```json
{
  "type": "complete",
  "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "message": "채점이 완료되었습니다"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | 메시지 타입 (`complete`) |
| `submission_uuid` | string | 제출 UUID |
| `message` | string | 완료 메시지 |

> **참고**: `complete` 메시지 수신 후 WebSocket 연결이 자동으로 종료됩니다.

#### JavaScript 예시

```javascript
function connectWebSocket(submissionUuid) {
  const ws = new WebSocket(`ws://localhost:8000/api/algorithm/ws/${submissionUuid}`);

  ws.onopen = () => {
    console.log('WebSocket 연결 성공');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('메시지 수신:', message);

    switch (message.type) {
      case 'progress':
        handleProgress(message);
        break;

      case 'testcase':
        handleTestCase(message);
        break;

      case 'result':
        handleResult(message);
        break;

      case 'error':
        handleError(message);
        break;

      case 'complete':
        handleComplete(message);
        ws.close();
        break;

      default:
        console.warn('알 수 없는 메시지 타입:', message.type);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket 에러:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket 연결 종료');
  };

  return ws;
}

// 핸들러 함수 예시
function handleProgress(message) {
  const { current, total, message: msg } = message;
  console.log(`진행률: ${current}/${total} - ${msg}`);
  // UI 업데이트: 프로그레스 바 등
}

function handleTestCase(message) {
  const { result } = message;
  console.log(`테스트케이스 ${result.test_case_number}: ${result.status}`);
  // UI 업데이트: 테스트케이스 결과 표시
}

function handleResult(message) {
  const { result } = message;
  console.log(`최종 결과: ${result.status} (${result.score}점)`);
  console.log(`통과: ${result.passed_test_cases}/${result.total_test_cases}`);
  // UI 업데이트: 최종 결과 표시
}

function handleError(message) {
  console.error('에러 발생:', message.error);
  if (message.details) {
    console.error('상세:', message.details);
  }
  // UI 업데이트: 에러 메시지 표시
}

function handleComplete(message) {
  console.log('채점 완료:', message.message);
  // UI 업데이트: 완료 상태 표시
}

// 사용 예시
const submissionUuid = await submitCode(1000, 'print("Hello")', 'python');
const ws = connectWebSocket(submissionUuid);
```

#### React Hook 예시

```javascript
import { useEffect, useRef, useState } from 'react';

function useSubmissionWebSocket(submissionUuid) {
  const [progress, setProgress] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!submissionUuid) return;

    const ws = new WebSocket(`ws://localhost:8000/api/algorithm/ws/${submissionUuid}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'progress':
          setProgress(message);
          break;

        case 'testcase':
          setTestCases(prev => [...prev, message.result]);
          break;

        case 'result':
          setFinalResult(message.result);
          break;

        case 'error':
          setError(message);
          break;

        case 'complete':
          setIsComplete(true);
          ws.close();
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 에러:', error);
      setError({ error: 'WebSocket 연결 실패' });
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [submissionUuid]);

  return { progress, testCases, finalResult, error, isComplete };
}

// 컴포넌트에서 사용
function SubmissionResult({ submissionUuid }) {
  const { progress, testCases, finalResult, error, isComplete } =
    useSubmissionWebSocket(submissionUuid);

  if (error) {
    return <div>에러: {error.error}</div>;
  }

  return (
    <div>
      {progress && (
        <div>진행률: {progress.current}/{progress.total}</div>
      )}

      {testCases.map((tc) => (
        <div key={tc.test_case_number}>
          테스트케이스 {tc.test_case_number}: {tc.status}
        </div>
      ))}

      {finalResult && (
        <div>
          <h3>최종 결과: {finalResult.status}</h3>
          <p>점수: {finalResult.score}</p>
          <p>통과: {finalResult.passed_test_cases}/{finalResult.total_test_cases}</p>
        </div>
      )}

      {isComplete && <div>채점 완료!</div>}
    </div>
  );
}
```

---

## Problem API

### GET /api/problem/list

문제 목록을 조회하는 엔드포인트입니다.

#### 기능 설명
- 알고리즘 태그, 지원 언어, 제목 접두사로 필터링된 문제 목록 조회
- 각 문제의 알고리즘 및 지원 언어 정보 포함
- 페이징 지원 (limit, offset)

#### Request

**HTTP Method**: `GET`

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 | 기본값 | 제약사항 |
|---------|------|------|------|--------|---------|
| `algorithm_ids` | string | ❌ | 알고리즘 ID 목록 (쉼표 구분) | - | AND 조건 (모든 알고리즘 포함하는 문제) |
| `language_ids` | string | ❌ | 언어 ID 목록 (쉼표 구분) | - | OR 조건 (하나 이상의 언어 지원하는 문제) |
| `title_prefix` | string | ❌ | 제목 접두사 검색 | - | 최대 200자 |
| `limit` | integer | ❌ | 조회 개수 | 20 | 1~100 |
| `offset` | integer | ❌ | 페이징 오프셋 | 0 | 0 이상 |

**필터 조건 설명**:
- **algorithm_ids**: 지정된 **모든** 알고리즘을 포함하는 문제만 검색 (AND 조건)
  - 예: `algorithm_ids=1,2` → 알고리즘 1 **그리고** 2를 모두 가진 문제
- **language_ids**: 지정된 언어 중 **하나 이상**을 지원하는 문제 검색 (OR 조건)
  - 예: `language_ids=1,2` → Python **또는** Java를 지원하는 문제
- **title_prefix**: 제목이 해당 문자열로 시작하는 문제 검색
  - 예: `title_prefix=A+` → "A+B", "A+B+C" 등

#### Response

**Success (200 OK)**:

```json
{
  "total": 2,
  "items": [
    {
      "id": 1,
      "problem_number": 1000,
      "title": "A+B",
      "created_at": "2025-01-01T00:00:00",
      "updated_at": "2025-01-01T00:00:00",
      "algorithms": [
        {
          "id": 1,
          "name": "수학"
        },
        {
          "id": 2,
          "name": "구현"
        }
      ],
      "languages": [
        {
          "id": 1,
          "language": "python",
          "name": "Python 3"
        },
        {
          "id": 2,
          "language": "java",
          "name": "Java 11"
        }
      ]
    }
  ]
}
```

**Response 필드**:

| 필드 | 타입 | 설명 |
|------|------|------|
| `total` | integer | 필터 조건에 맞는 전체 문제 개수 |
| `items` | array | 문제 목록 |

**Problem 객체 (items 내부)**:

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | integer | 문제 고유 ID |
| `problem_number` | integer | 문제 번호 |
| `title` | string | 문제 제목 |
| `created_at` | string | 생성 일시 (ISO 8601) |
| `updated_at` | string | 수정 일시 (ISO 8601) |
| `algorithms` | array | 관련 알고리즘 목록 |
| `languages` | array | 지원 언어 목록 |

**Algorithm 객체**:

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | integer | 알고리즘 ID |
| `name` | string | 알고리즘 이름 |

**Language 객체**:

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | integer | 언어 ID |
| `language` | string | 언어 코드 (python, java, c, cpp, javascript) |
| `name` | string? | 언어 이름 (Python 3, Java 11 등) |

#### JavaScript 예시

##### 1. 모든 문제 조회

```javascript
async function getAllProblems(page = 0, limit = 20) {
  try {
    const response = await fetch(
      `http://localhost:8000/api/problem/list?limit=${limit}&offset=${page * limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`전체 ${data.total}개 중 ${data.items.length}개 조회`);
    return data;
  } catch (error) {
    console.error('문제 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
const problems = await getAllProblems(0, 20);
```

##### 2. 알고리즘 필터 (AND 조건)

```javascript
async function getProblemsWithAlgorithms(algorithmIds) {
  try {
    const ids = algorithmIds.join(',');
    const response = await fetch(
      `http://localhost:8000/api/problem/list?algorithm_ids=${ids}&limit=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`알고리즘 ${ids}를 모두 포함하는 문제: ${data.total}개`);
    return data;
  } catch (error) {
    console.error('문제 조회 실패:', error);
    throw error;
  }
}

// 사용 예시: 다이나믹 프로그래밍(1)과 그리디(3)를 모두 포함하는 문제
const problems = await getProblemsWithAlgorithms([1, 3]);
```

##### 3. 언어 필터 (OR 조건)

```javascript
async function getProblemsWithLanguages(languageIds) {
  try {
    const ids = languageIds.join(',');
    const response = await fetch(
      `http://localhost:8000/api/problem/list?language_ids=${ids}&limit=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`언어 ${ids} 중 하나 이상 지원하는 문제: ${data.total}개`);
    return data;
  } catch (error) {
    console.error('문제 조회 실패:', error);
    throw error;
  }
}

// 사용 예시: Python(1) 또는 Java(2)를 지원하는 문제
const problems = await getProblemsWithLanguages([1, 2]);
```

##### 4. 제목 접두사 검색

```javascript
async function searchProblemsByTitle(prefix) {
  try {
    const encodedPrefix = encodeURIComponent(prefix);
    const response = await fetch(
      `http://localhost:8000/api/problem/list?title_prefix=${encodedPrefix}&limit=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`"${prefix}"로 시작하는 문제: ${data.total}개`);
    return data;
  } catch (error) {
    console.error('문제 검색 실패:', error);
    throw error;
  }
}

// 사용 예시: "A+"로 시작하는 문제 검색
const problems = await searchProblemsByTitle('A+');
```

##### 5. 복합 조건 검색

```javascript
async function searchProblems({
  algorithmIds = null,
  languageIds = null,
  titlePrefix = null,
  page = 0,
  limit = 20
}) {
  try {
    const params = new URLSearchParams();

    if (algorithmIds && algorithmIds.length > 0) {
      params.append('algorithm_ids', algorithmIds.join(','));
    }

    if (languageIds && languageIds.length > 0) {
      params.append('language_ids', languageIds.join(','));
    }

    if (titlePrefix) {
      params.append('title_prefix', titlePrefix);
    }

    params.append('limit', limit.toString());
    params.append('offset', (page * limit).toString());

    const response = await fetch(
      `http://localhost:8000/api/problem/list?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '요청 실패');
    }

    const data = await response.json();
    console.log(`검색 결과: ${data.total}개 중 ${data.items.length}개 조회`);
    return data;
  } catch (error) {
    console.error('문제 검색 실패:', error);
    throw error;
  }
}

// 사용 예시 1: 다이나믹 프로그래밍(1) + Python(1) 지원 + 제목 "최" 시작
const result1 = await searchProblems({
  algorithmIds: [1],
  languageIds: [1],
  titlePrefix: '최',
  page: 0,
  limit: 20
});

// 사용 예시 2: 그래프(4), BFS(5) 모두 포함 + C++(4) 또는 Java(2) 지원
const result2 = await searchProblems({
  algorithmIds: [4, 5],
  languageIds: [2, 4],
  limit: 50
});
```

##### 6. 페이징 처리

```javascript
async function loadProblemsWithPagination() {
  const limit = 20;
  let page = 0;
  let hasMore = true;
  const allProblems = [];

  while (hasMore) {
    const data = await getAllProblems(page, limit);
    allProblems.push(...data.items);

    console.log(`페이지 ${page + 1}: ${data.items.length}개 로드`);

    // 더 이상 데이터가 없으면 종료
    if (allProblems.length >= data.total) {
      hasMore = false;
    }

    page++;
  }

  console.log(`총 ${allProblems.length}개 문제 로드 완료`);
  return allProblems;
}
```

##### 7. React 컴포넌트 예시

```javascript
import { useState, useEffect } from 'react';

function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 필터 상태
  const [algorithmIds, setAlgorithmIds] = useState([]);
  const [languageIds, setLanguageIds] = useState([]);
  const [titlePrefix, setTitlePrefix] = useState('');

  // 페이징 상태
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  useEffect(() => {
    loadProblems();
  }, [algorithmIds, languageIds, titlePrefix, page]);

  async function loadProblems() {
    setLoading(true);
    setError(null);

    try {
      const data = await searchProblems({
        algorithmIds,
        languageIds,
        titlePrefix: titlePrefix || null,
        page,
        limit
      });

      setProblems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div>
      <h1>문제 목록 ({total}개)</h1>

      {/* 필터 UI */}
      <div>
        <input
          type="text"
          placeholder="제목 검색"
          value={titlePrefix}
          onChange={(e) => {
            setTitlePrefix(e.target.value);
            setPage(0); // 필터 변경 시 첫 페이지로
          }}
        />
      </div>

      {/* 문제 목록 */}
      <ul>
        {problems.map((problem) => (
          <li key={problem.id}>
            <h3>
              {problem.problem_number}. {problem.title}
            </h3>
            <div>
              알고리즘: {problem.algorithms.map(a => a.name).join(', ')}
            </div>
            <div>
              지원 언어: {problem.languages.map(l => l.name || l.language).join(', ')}
            </div>
          </li>
        ))}
      </ul>

      {/* 페이징 버튼 */}
      <div>
        <button
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
        >
          이전
        </button>

        <span>페이지 {page + 1}</span>

        <button
          disabled={(page + 1) * limit >= total}
          onClick={() => setPage(p => p + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}
```

#### 오류 응답

| 상태 코드 | 오류 메시지 | 설명 | 해결 방법 |
|----------|------------|------|----------|
| `400` | `"잘못된 파라미터 형식: ..."` | algorithm_ids 또는 language_ids가 정수 변환 불가 | 쉼표로 구분된 정수 형식으로 전달 (예: "1,2,3") |
| `422` | `Validation Error` | 쿼리 파라미터 제약사항 위반 | limit은 1~100, offset은 0 이상 |
| `500` | `"서버 오류: ..."` | 데이터베이스 연결 실패 등 | 서버 로그 확인 또는 관리자에게 문의 |

---

### GET /api/problem/info

문제의 상세 정보를 S3에서 가져오는 엔드포인트입니다.

#### 기능 설명
- AWS S3 버킷 `corazyarcade-code-dataset`에서 문제 정보 조회
- `problems/{문제번호}/info.json`: 문제 설명, 입출력 설명, 제한사항
- `problems/{문제번호}/testcases.json`: 테스트케이스 목록
- `problems/{문제번호}/images/`: 문제에 사용된 이미지 파일들
- 두 JSON 파일을 읽어서 통합하여 반환

#### 특수 기능
1. **Latex 수식 지원**: `description`, `inputDescription`, `outputDescription`, `inputLimit`, `outputLimit` 필드에서 Latex 문법 사용 가능
   - 예: `$A+B$`, `$-10000 \\leq A, B \\leq 10000$`
2. **이미지 삽입 지원**: `[image:파일명.png]` 형식으로 이미지 참조
   - 이미지 파일은 S3의 `problems/{문제번호}/images/` 디렉토리에 위치
   - 예: `[image:figure1.png]`, `[image:tree-diagram.png]`
3. **이미지 목록**: `images` 배열에 사용된 모든 이미지 파일명 포함

#### Request

**HTTP Method**: `GET`

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 | 제약사항 |
|---------|------|------|------|---------|
| `problem_number` | integer | ✅ | 문제 번호 | 1 이상의 양의 정수 |

#### Response

**Success (200 OK)**:

```json
{
  "info": {
    "problemId": 1000,
    "title": "A+B",
    "description": "두 정수 $A$와 $B$를 입력받은 다음, $A+B$를 출력하는 프로그램을 작성하시오.\n\n다음 그림을 참고하세요.\n\n[image:figure1.png]",
    "inputDescription": "첫째 줄에 $A$와 $B$가 주어진다.",
    "outputDescription": "첫째 줄에 $A+B$를 출력한다.",
    "inputLimit": "$-10000 \\leq A, B \\leq 10000$",
    "outputLimit": "정수 형태로 출력",
    "timeLimit": 2000,
    "memoryLimit": 256,
    "difficulty": "Bronze V",
    "images": ["figure1.png"]
  },
  "testcases": {
    "problemId": 1000,
    "title": "A+B",
    "description": "두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.",
    "timeLimit": 2000,
    "memoryLimit": 256,
    "testCases": [
      {
        "input": "1 2",
        "output": "3"
      },
      {
        "input": "5 10",
        "output": "15"
      },
      {
        "input": "0 0",
        "output": "0"
      },
      {
        "input": "-1 1",
        "output": "0"
      },
      {
        "input": "100 200",
        "output": "300"
      }
    ],
    "images": []
  }
}
```

**Response 필드**:

**info 객체** (info.json):

| 필드 | 타입 | 설명 |
|------|------|------|
| `problemId` | integer | 문제 번호 |
| `title` | string | 문제 제목 |
| `description` | string | 문제 설명 (Latex 수식 및 이미지 포함 가능) |
| `inputDescription` | string? | 입력 형식 설명 (Latex 수식 및 이미지 포함 가능) |
| `outputDescription` | string? | 출력 형식 설명 (Latex 수식 및 이미지 포함 가능) |
| `inputLimit` | string? | 입력 값 제한 사항 (Latex 수식 사용 가능) |
| `outputLimit` | string? | 출력 값 제한 사항 |
| `timeLimit` | integer | 시간 제한 (밀리초) |
| `memoryLimit` | integer | 메모리 제한 (MB) |
| `difficulty` | string? | 난이도 (예: Bronze V, Silver III, Gold I) |
| `images` | array | 사용된 이미지 파일명 목록 (예: ["figure1.png", "tree.png"]) |

**testcases 객체** (testcases.json):

| 필드 | 타입 | 설명 |
|------|------|------|
| `problemId` | integer | 문제 번호 |
| `title` | string | 문제 제목 |
| `description` | string | 문제 설명 |
| `timeLimit` | integer | 시간 제한 (밀리초) |
| `memoryLimit` | integer | 메모리 제한 (MB) |
| `testCases` | array | 테스트케이스 목록 |
| `images` | array | 사용된 이미지 파일명 목록 |

**testCase 객체** (testCases 배열 내부):

| 필드 | 타입 | 설명 |
|------|------|------|
| `input` | string | 입력 데이터 |
| `output` | string | 예상 출력 |

#### JavaScript 예시

##### 1. 기본 사용

```javascript
async function getProblemInfo(problemNumber) {
  try {
    const response = await fetch(
      `http://localhost:8000/api/problem/info?problem_number=${problemNumber}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '문제 정보를 가져올 수 없습니다');
    }

    const data = await response.json();
    console.log('문제 정보:', data);
    return data;
  } catch (error) {
    console.error('문제 정보 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
const problemInfo = await getProblemInfo(1000);
console.log('제목:', problemInfo.info.title);
console.log('난이도:', problemInfo.info.difficulty);
console.log('테스트케이스 수:', problemInfo.testcases.testCases.length);
console.log('이미지 파일:', problemInfo.info.images);
```

##### 2. Latex 수식 및 이미지 처리

```javascript
// Latex 수식을 HTML로 변환하는 함수 (KaTeX 또는 MathJax 사용)
function renderLatex(text) {
  // KaTeX 예시 (라이브러리 설치 필요: npm install katex)
  // import katex from 'katex';

  // $...$ 형식의 인라인 수식 변환
  return text.replace(/\$([^\$]+)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { throwOnError: false });
    } catch (e) {
      return match;
    }
  });
}

// 이미지 참조를 실제 URL로 변환하는 함수
function processImages(text, problemNumber, images) {
  const baseUrl = `https://corazyarcade-code-dataset.s3.ap-northeast-2.amazonaws.com/problems/${problemNumber}/images`;

  return text.replace(/\[image:([^\]]+)\]/g, (match, filename) => {
    if (images.includes(filename)) {
      return `<img src="${baseUrl}/${filename}" alt="${filename}" />`;
    }
    return match;
  });
}

// 사용 예시
async function renderProblemDescription(problemNumber) {
  const data = await getProblemInfo(problemNumber);
  const { description, images } = data.info;

  // Latex 수식 렌더링
  let rendered = renderLatex(description);

  // 이미지 URL 변환
  rendered = processImages(rendered, problemNumber, images);

  return rendered;
}

const html = await renderProblemDescription(1000);
document.getElementById('problem-description').innerHTML = html;
```

##### 3. 테스트케이스 출력

```javascript
async function displayTestCases(problemNumber) {
  try {
    const data = await getProblemInfo(problemNumber);
    const testCases = data.testcases.testCases;

    console.log(`전체 테스트케이스: ${testCases.length}개`);

    testCases.forEach((tc, index) => {
      console.log(`\n테스트케이스 ${index + 1}:`);
      console.log('입력:', tc.input);
      console.log('출력:', tc.output);
    });

    return testCases;
  } catch (error) {
    console.error('테스트케이스 조회 실패:', error);
    throw error;
  }
}

// 사용 예시
const testCases = await displayTestCases(1000);
```

##### 4. React 컴포넌트 예시 (Latex 및 이미지 지원)

```javascript
import { useState, useEffect, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function ProblemDetail({ problemNumber }) {
  const [problemInfo, setProblemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProblemInfo();
  }, [problemNumber]);

  async function loadProblemInfo() {
    setLoading(true);
    setError(null);

    try {
      const data = await getProblemInfo(problemNumber);
      setProblemInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Latex 수식 및 이미지 처리
  const processContent = (text, images) => {
    if (!text) return '';

    // Latex 수식 변환
    let processed = text.replace(/\$([^\$]+)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // 이미지 URL 변환
    const baseUrl = `https://corazyarcade-code-dataset.s3.ap-northeast-2.amazonaws.com/problems/${problemNumber}/images`;
    processed = processed.replace(/\[image:([^\]]+)\]/g, (match, filename) => {
      if (images.includes(filename)) {
        return `<img src="${baseUrl}/${filename}" alt="${filename}" class="problem-image" />`;
      }
      return match;
    });

    return processed;
  };

  const renderedContent = useMemo(() => {
    if (!problemInfo) return {};

    const { info } = problemInfo;
    return {
      description: processContent(info.description, info.images),
      inputDescription: processContent(info.inputDescription, info.images),
      outputDescription: processContent(info.outputDescription, info.images),
      inputLimit: processContent(info.inputLimit, info.images),
      outputLimit: processContent(info.outputLimit, info.images),
    };
  }, [problemInfo, problemNumber]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;
  if (!problemInfo) return null;

  const { info, testcases } = problemInfo;

  return (
    <div className="problem-detail">
      <h1>{info.problemId}. {info.title}</h1>

      <div className="metadata">
        <span className="badge">{info.difficulty}</span>
        <span>시간 제한: {info.timeLimit}ms</span>
        <span>메모리 제한: {info.memoryLimit}MB</span>
      </div>

      <section className="problem-section">
        <h2>문제</h2>
        <div
          className="content"
          dangerouslySetInnerHTML={{ __html: renderedContent.description }}
        />
      </section>

      {info.inputDescription && (
        <section className="problem-section">
          <h2>입력</h2>
          <div
            className="content"
            dangerouslySetInnerHTML={{ __html: renderedContent.inputDescription }}
          />
        </section>
      )}

      {info.inputLimit && (
        <section className="problem-section">
          <h3>입력 제한</h3>
          <div
            className="content limit"
            dangerouslySetInnerHTML={{ __html: renderedContent.inputLimit }}
          />
        </section>
      )}

      {info.outputDescription && (
        <section className="problem-section">
          <h2>출력</h2>
          <div
            className="content"
            dangerouslySetInnerHTML={{ __html: renderedContent.outputDescription }}
          />
        </section>
      )}

      {info.outputLimit && (
        <section className="problem-section">
          <h3>출력 제한</h3>
          <div
            className="content limit"
            dangerouslySetInnerHTML={{ __html: renderedContent.outputLimit }}
          />
        </section>
      )}

      <section className="problem-section">
        <h2>예제</h2>
        {testcases.testCases.slice(0, 3).map((tc, index) => (
          <div key={index} className="example">
            <h3>예제 입력 {index + 1}</h3>
            <pre className="example-input">{tc.input}</pre>

            <h3>예제 출력 {index + 1}</h3>
            <pre className="example-output">{tc.output}</pre>
          </div>
        ))}
      </section>

      <div className="stats">
        <p>전체 테스트케이스: {testcases.testCases.length}개</p>
        {info.images.length > 0 && (
          <p>이미지: {info.images.join(', ')}</p>
        )}
      </div>
    </div>
  );
}
```

##### 5. 문제 정보와 코드 제출 통합

```javascript
async function submitWithProblemInfo(problemNumber, code, language) {
  try {
    // 1. 문제 정보 먼저 가져오기
    const problemInfo = await getProblemInfo(problemNumber);
    console.log(`"${problemInfo.info.title}" 문제 제출 중...`);
    console.log(`시간 제한: ${problemInfo.info.timeLimit}ms`);
    console.log(`메모리 제한: ${problemInfo.info.memoryLimit}MB`);

    // 2. 코드 제출
    const submissionUuid = await submitCode(problemNumber, code, language);
    console.log('제출 UUID:', submissionUuid);

    // 3. WebSocket 연결
    const ws = connectWebSocket(submissionUuid);

    return { submissionUuid, problemInfo, ws };
  } catch (error) {
    console.error('제출 실패:', error);
    throw error;
  }
}

// 사용 예시
const { submissionUuid, problemInfo, ws } = await submitWithProblemInfo(
  1000,
  'print(sum(map(int, input().split())))',
  'python'
);
```

#### S3 파일 구조

```text
corazyarcade-code-dataset/
└── problems/
    └── 1000/
        ├── info.json          # 문제 기본 정보
        ├── testcases.json     # 테스트케이스 목록
        └── images/            # 이미지 디렉토리
            ├── figure1.png
            ├── tree-diagram.png
            └── graph.jpg
```

#### 이미지 URL 규칙

- **S3 Base URL**: `https://corazyarcade-code-dataset.s3.ap-northeast-2.amazonaws.com`
- **이미지 경로**: `/problems/{problemId}/images/{filename}`
- **전체 URL 예시**: `https://corazyarcade-code-dataset.s3.ap-northeast-2.amazonaws.com/problems/1000/images/figure1.png`

#### 오류 응답

| 상태 코드 | 오류 메시지 | 설명 | 해결 방법 |
|----------|------------|------|----------|
| `404` | `"문제 {번호}의 정보를 찾을 수 없습니다. (info.json 없음)"` | S3에 info.json 파일이 없음 | 문제 번호 확인 또는 관리자에게 문의 |
| `404` | `"문제 {번호}의 테스트케이스를 찾을 수 없습니다. (testcases.json 없음)"` | S3에 testcases.json 파일이 없음 | 문제 번호 확인 또는 관리자에게 문의 |
| `422` | `Validation Error` | problem_number가 1 미만 | 1 이상의 양의 정수 전달 |
| `500` | `"JSON 데이터 형식 오류: ..."` | JSON 파일 구조가 잘못됨 (필수 필드 누락 등) | 관리자에게 문의 (S3 데이터 검증 필요) |
| `500` | `"서버 오류: ..."` | S3 접근 권한 오류 또는 네트워크 문제 | AWS 자격증명 확인 또는 관리자에게 문의 |

#### JSON 파일 예시

**info.json**:
```json
{
  "problemId": 1000,
  "title": "A+B",
  "description": "두 정수 $A$와 $B$를 입력받은 다음, $A+B$를 출력하는 프로그램을 작성하시오.\n\n[image:figure1.png]",
  "inputDescription": "첫째 줄에 $A$와 $B$가 주어진다.",
  "outputDescription": "첫째 줄에 $A+B$를 출력한다.",
  "inputLimit": "$-10000 \\leq A, B \\leq 10000$",
  "outputLimit": "정수 형태로 출력",
  "timeLimit": 2000,
  "memoryLimit": 256,
  "difficulty": "Bronze V",
  "images": ["figure1.png"]
}
```

**testcases.json**:
```json
{
  "problemId": 1000,
  "title": "A+B",
  "description": "두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.",
  "timeLimit": 2000,
  "memoryLimit": 256,
  "testCases": [
    {
      "input": "1 2",
      "output": "3"
    },
    {
      "input": "5 10",
      "output": "15"
    },
    {
      "input": "0 0",
      "output": "0"
    },
    {
      "input": "-1 1",
      "output": "0"
    },
    {
      "input": "100 200",
      "output": "300"
    }
  ],
  "images": []
}
```

---

## Error Codes

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| `200` | OK | 요청 성공 |
| `400` | Bad Request | 잘못된 요청 (파라미터 오류, 검증 실패) |
| `422` | Unprocessable Entity | 요청은 유효하나 처리할 수 없음 (Pydantic 검증 실패) |
| `500` | Internal Server Error | 서버 내부 오류 |

### 채점 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| `AC` | Accepted | 정답 |
| `WA` | Wrong Answer | 오답 |
| `TLE` | Time Limit Exceeded | 시간 초과 |
| `RE` | Runtime Error | 런타임 에러 (예외 발생, Segmentation Fault 등) |
| `MLE` | Memory Limit Exceeded | 메모리 초과 |
| `CE` | Compile Error | 컴파일 에러 |
| `PE` | Presentation Error | 출력 형식 오류 |

### 일반적인 오류 메시지

#### 1. 코드 제출 (POST /api/algorithm/enqueue)

```json
{
  "detail": "코드가 비어있습니다"
}
```
**원인**: code 필드가 공백만 포함
**해결**: 유효한 코드 입력

```json
{
  "detail": "SAMPLE 모드에서는 input이 필수입니다"
}
```
**원인**: mode가 "SAMPLE"인데 input 필드 누락
**해결**: input 파라미터 추가

```json
{
  "detail": [
    {
      "type": "enum",
      "loc": ["body", "language"],
      "msg": "Input should be 'python', 'java', 'c', 'cpp' or 'javascript'",
      "input": "ruby",
      "ctx": {
        "expected": "'python', 'java', 'c', 'cpp' or 'javascript'"
      }
    }
  ]
}
```
**원인**: 지원하지 않는 언어 코드
**해결**: 지원 언어 목록 확인 (python, java, c, cpp, javascript)

```json
{
  "detail": "작업 큐 추가 실패: ..."
}
```
**원인**: RabbitMQ 연결 실패 또는 큐 추가 오류
**해결**: 서버 관리자에게 문의

#### 2. 문제 조회 (GET /api/problem/list)

```json
{
  "detail": "잘못된 파라미터 형식: invalid literal for int() with base 10: 'abc'"
}
```
**원인**: algorithm_ids 또는 language_ids에 숫자가 아닌 값 포함
**해결**: 쉼표로 구분된 정수로 전달 (예: "1,2,3")

```json
{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": ["query", "limit"],
      "msg": "Input should be greater than or equal to 1",
      "input": "0",
      "ctx": {
        "ge": 1
      }
    }
  ]
}
```
**원인**: limit이 1 미만
**해결**: limit은 1~100 사이 값 사용

```json
{
  "detail": "서버 오류: (pymysql.err.OperationalError) (2003, \"Can't connect to MySQL server...\")"
}
```
**원인**: 데이터베이스 연결 실패
**해결**: 데이터베이스 서버 상태 확인, 연결 정보 확인

---

## 전체 워크플로우 예시

```javascript
// 1. 코드 제출
const submissionUuid = await submitCode(1000, codeText, 'python');

// 2. WebSocket 연결하여 실시간 결과 수신
const ws = connectWebSocket(submissionUuid);

// 3. 메시지 처리
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'progress') {
    updateProgressBar(message.current, message.total);
  }

  if (message.type === 'testcase') {
    addTestCaseResult(message.result);
  }

  if (message.type === 'result') {
    showFinalResult(message.result);
  }

  if (message.type === 'complete') {
    console.log('채점 완료!');
    ws.close();
  }
};
```

---

## 부록

### 개발 환경 설정

```bash
# 서버 실행
cd coa-compile-server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 환경 변수 (.env)

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/database_name

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_QUEUE_NAME=compile_queue

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### API 문서 (Swagger UI)

서버 실행 후 다음 URL에서 인터랙티브 API 문서를 확인할 수 있습니다:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

**작성일**: 2025-01-03
**버전**: 1.0.0
**문의**: 개발팀
