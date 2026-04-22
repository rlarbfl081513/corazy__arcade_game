# COA Compile Server API 가이드

코드 실행 및 채점 서버 사용 방법을 설명합니다.

## 📡 통신 방식

RabbitMQ 메시지 큐를 통해 작업을 요청하고, Redis에서 결과를 조회합니다.

```
[클라이언트] → [RabbitMQ] → [Compile Server] → [Redis]
                                     ↓
                              [결과 저장]
```

## 🔌 연결 정보

### RabbitMQ
```
Host: your-rabbitmq-host
Port: 5672
User: your-user
Password: your-password
Queue: WorkerQueue
```

### Redis (결과 조회)
```
Host: your-redis-host
Port: 6379
Key Format: result:{jobId}
```

---

## 🚀 모드 1: 실행 모드 (Run Mode)

사용자가 입력한 코드를 실행하고 결과를 반환합니다.

### 요청 형식

```json
{
  "jobId": "unique-job-id",
  "mode": "run",
  "code": "print('Hello World')",
  "language": "python",
  "input": "optional input data",
  "timeout": 5000,
  "memoryLimit": 256
}
```

### 필수 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `jobId` | string | 작업 고유 ID (결과 조회용) |
| `mode` | string | `"run"` 고정 |
| `code` | string | 실행할 소스 코드 |
| `language` | string | 언어: `javascript`, `python`, `c`, `cpp`, `java` |

### 선택 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `input` | string | `""` | 표준 입력으로 전달할 데이터 |
| `timeout` | number | `5000` | 실행 제한 시간 (ms) |
| `memoryLimit` | number | `256` | 메모리 제한 (MB) |

### 응답 형식

```json
{
  "success": true,
  "status": "SUCCESS",
  "message": "정상적으로 실행되었습니다.",
  "output": "Hello World",
  "error": "",
  "executionTime": 234,
  "memoryUsed": 15
}
```

### 상태 코드

| 코드 | 설명 |
|------|------|
| `SUCCESS` | 정상 실행 |
| `CE` | Compile Error (컴파일 에러) |
| `RE` | Runtime Error (런타임 에러) |
| `TLE` | Time Limit Exceeded (시간 초과) |
| `MLE` | Memory Limit Exceeded (메모리 초과) |
| `SE` | System Error (시스템 에러) |

### 예제 코드

#### Node.js

```javascript
const amqp = require('amqplib');

async function submitCode() {
  const connection = await amqp.connect('amqp://user:pass@host:5672');
  const channel = await connection.createChannel();
  
  await channel.assertQueue('WorkerQueue');
  
  const job = {
    jobId: 'test-001',
    mode: 'run',
    code: 'print("Hello World")',
    language: 'python'
  };
  
  channel.sendToQueue('WorkerQueue', Buffer.from(JSON.stringify(job)));
  console.log('Job submitted:', job.jobId);
  
  await channel.close();
  await connection.close();
}

submitCode();
```

#### Python

```python
import pika
import json

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='your-host',
        port=5672,
        credentials=pika.PlainCredentials('user', 'pass')
    )
)
channel = connection.channel()
channel.queue_declare(queue='WorkerQueue')

job = {
    'jobId': 'test-001',
    'mode': 'run',
    'code': 'print("Hello World")',
    'language': 'python'
}

channel.basic_publish(
    exchange='',
    routing_key='WorkerQueue',
    body=json.dumps(job)
)

print(f"Job submitted: {job['jobId']}")
connection.close()
```

---

## 🏆 모드 2: 채점 모드 (Judge Mode)

문제의 테스트케이스를 S3에서 가져와 자동으로 채점합니다.

### 요청 형식

```json
{
  "jobId": "unique-job-id",
  "mode": "judge",
  "problemId": 1000,
  "code": "a, b = map(int, input().split())\nprint(a + b)",
  "language": "python",
  "type": "evaluate",
  "timeout": 5000,
  "memoryLimit": 256
}
```

### 필수 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `jobId` | string | 작업 고유 ID |
| `mode` | string | `"judge"` 고정 |
| `problemId` | number | 문제 번호 (S3 경로 결정) |
| `code` | string | 채점할 소스 코드 |
| `language` | string | 언어: `javascript`, `python`, `c`, `cpp`, `java` |

### 선택 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `type` | string | `"evaluate"` | `"sample"` 또는 `"evaluate"` |
| `timeout` | number | `5000` | 실행 제한 시간 (ms) |
| `memoryLimit` | number | `256` | 메모리 제한 (MB) |

### type 파라미터

- `"sample"`: 샘플 테스트케이스 사용 (`problems/{problemId}/sample/*.in`, `*.ans`)
- `"evaluate"`: 실전 채점용 테스트케이스 사용 (`problems/{problemId}/evaluate/*.in`, `*.ans`)

### S3 테스트케이스 구조

```
s3://bucket-name/problems/{problemId}/
├── info.json              # 문제 정보 (선택사항)
├── sample/                # 샘플 테스트케이스
│   ├── 1.in              # 입력
│   ├── 1.ans             # 정답
│   ├── 2.in
│   └── 2.ans
└── evaluate/             # 채점용 테스트케이스
    ├── 1.in
    ├── 1.ans
    ├── 2.in
    ├── 2.ans
    ├── 3.in
    └── 3.ans
```

#### info.json 예시

```json
{
  "problemId": 1000,
  "title": "A+B",
  "timeLimit": 2000,
  "memoryLimit": 128
}
```

### 응답 형식

```json
{
  "success": true,
  "status": "AC",
  "message": "모든 테스트케이스를 통과하였습니다.",
  "passedCount": 5,
  "totalCount": 5,
  "executionTime": 1234,
  "testResults": [
    {
      "testCaseNumber": 1,
      "passed": true,
      "status": "AC",
      "executionTime": 234,
      "memoryUsed": 15,
      "input": "1 2",
      "expectedOutput": "3",
      "actualOutput": "3"
    },
    {
      "testCaseNumber": 2,
      "passed": true,
      "status": "AC",
      "executionTime": 241,
      "memoryUsed": 16,
      "input": "5 7",
      "expectedOutput": "12",
      "actualOutput": "12"
    }
  ]
}
```

### 채점 상태 코드

| 코드 | 설명 |
|------|------|
| `AC` | Accepted (정답) |
| `WA` | Wrong Answer (오답) |
| `TLE` | Time Limit Exceeded (시간 초과) |
| `MLE` | Memory Limit Exceeded (메모리 초과) |
| `RE` | Runtime Error (런타임 에러) |
| `CE` | Compile Error (컴파일 에러) |

### 예제 코드

#### Node.js

```javascript
const amqp = require('amqplib');

async function submitForJudge() {
  const connection = await amqp.connect('amqp://user:pass@host:5672');
  const channel = await connection.createChannel();
  
  await channel.assertQueue('WorkerQueue');
  
  const job = {
    jobId: 'judge-001',
    mode: 'judge',
    problemId: 1000,
    type: 'evaluate',  // 'sample' 또는 'evaluate'
    code: `
a, b = map(int, input().split())
print(a + b)
    `,
    language: 'python'
  };
  
  channel.sendToQueue('WorkerQueue', Buffer.from(JSON.stringify(job)));
  console.log('Judge job submitted:', job.jobId);
  
  await channel.close();
  await connection.close();
}

submitForJudge();
```

#### Python

```python
import pika
import json

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='your-host',
        port=5672,
        credentials=pika.PlainCredentials('user', 'pass')
    )
)
channel = connection.channel()
channel.queue_declare(queue='WorkerQueue')

job = {
    'jobId': 'judge-001',
    'mode': 'judge',
    'problemId': 1000,
    'type': 'evaluate',
    'code': '''
a, b = map(int, input().split())
print(a + b)
    ''',
    'language': 'python'
}

channel.basic_publish(
    exchange='',
    routing_key='WorkerQueue',
    body=json.dumps(job)
)

print(f"Judge job submitted: {job['jobId']}")
connection.close()
```

---

## 📊 결과 조회

### Redis에서 결과 가져오기

```javascript
const redis = require('redis');

async function getResult(jobId) {
  const client = redis.createClient({
    host: 'your-redis-host',
    port: 6379
  });
  
  await client.connect();
  
  // 결과 조회
  const result = await client.get(`result:${jobId}`);
  
  if (result) {
    console.log('Result:', JSON.parse(result));
  } else {
    console.log('Result not found or still processing');
  }
  
  await client.disconnect();
}

getResult('test-001');
```

### 상태 조회

```javascript
async function getStatus(jobId) {
  const client = redis.createClient({
    host: 'your-redis-host',
    port: 6379
  });
  
  await client.connect();
  
  const status = await client.get(`status:${jobId}`);
  console.log('Status:', status);  // RUNNING, COMPLETED, FAILED
  
  await client.disconnect();
}
```

---

## 🔍 언어별 주의사항

### JavaScript
```javascript
// stdin 입력 처리 방법
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let lines = [];
rl.on('line', (line) => {
  lines.push(line);
}).on('close', () => {
  // 입력 처리
  console.log(lines[0]);
});
```

### Python
```python
# stdin 입력 처리
a, b = map(int, input().split())
print(a + b)
```

### C
```c
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\n", a + b);
    return 0;
}
```

### C++
```cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
```

### Java
```java
import java.util.*;

class Solution {  // 클래스명은 반드시 Solution
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
        sc.close();
    }
}
```

---

## ⚠️ 제한사항

### 기본 제한

| 항목 | 기본값 | 최대값 | 설명 |
|------|--------|--------|------|
| 실행 시간 | 5초 | 30초 | `timeout` 파라미터로 조정 |
| 메모리 | 256MB | 512MB | `memoryLimit` 파라미터로 조정 |
| 출력 크기 | 제한 없음 | - | 너무 큰 출력은 성능 저하 |
| 입력 크기 | 제한 없음 | - | 파일 기반 입력 지원 |

### 보안 제한

- ✅ 네트워크 비활성화 (외부 통신 불가)
- ✅ 파일 시스템 제한
- ✅ 프로세스 수 제한 (최대 50개)
- ✅ Docker 샌드박스 격리

---

## 🔄 작업 흐름

### 실행 모드
```
1. 클라이언트 → RabbitMQ에 작업 전송
2. Compile Server → RabbitMQ에서 작업 수신
3. Docker 컨테이너에서 코드 실행
4. 결과를 Redis에 저장 (key: result:{jobId})
5. 클라이언트 → Redis에서 결과 조회
```

### 채점 모드
```
1. 클라이언트 → RabbitMQ에 작업 전송
2. Compile Server → RabbitMQ에서 작업 수신
3. S3에서 테스트케이스 다운로드
4. 각 테스트케이스에 대해:
   - Docker 컨테이너에서 코드 실행
   - 출력과 정답 비교
5. 채점 결과를 Redis에 저장
6. 클라이언트 → Redis에서 결과 조회
```

---

## 🛠️ 디버깅

### 작업이 처리되지 않는 경우

1. **RabbitMQ 연결 확인**
```bash
# RabbitMQ Management UI
http://your-host:15672

# 큐에 메시지가 쌓여있는지 확인
```

2. **서버 로그 확인**
```bash
docker-compose logs -f compile-server
```

3. **Redis 연결 확인**
```bash
redis-cli -h your-host
> KEYS result:*
> GET result:test-001
```

### 컴파일 에러 확인

```json
{
  "success": false,
  "status": "CE",
  "message": "컴파일 중 오류가 발생하였습니다.",
  "error": "main.cpp:2:5: error: expected ';' before 'return'"
}
```

### 런타임 에러 확인

```json
{
  "success": false,
  "status": "RE",
  "message": "실행 중 오류가 발생하였습니다.",
  "error": "ReferenceError: undefined variable"
}
```

---

## 📚 추가 예제

### 여러 언어로 같은 문제 제출

```javascript
const languages = [
  { lang: 'python', code: 'a,b=map(int,input().split())\nprint(a+b)' },
  { lang: 'javascript', code: 'const [a,b]=require("fs").readFileSync(0).toString().split(" ").map(Number);console.log(a+b)' },
  { lang: 'cpp', code: '#include<iostream>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b;return 0;}' }
];

languages.forEach((item, i) => {
  const job = {
    jobId: `multi-lang-${i}`,
    mode: 'judge',
    problemId: 1000,
    code: item.code,
    language: item.lang
  };
  
  channel.sendToQueue('WorkerQueue', Buffer.from(JSON.stringify(job)));
});
```

### 대량 채점 작업

```javascript
async function bulkJudge(submissions) {
  const connection = await amqp.connect('amqp://user:pass@host:5672');
  const channel = await connection.createChannel();
  
  await channel.assertQueue('WorkerQueue');
  
  for (const submission of submissions) {
    const job = {
      jobId: `bulk-${submission.userId}-${submission.problemId}`,
      mode: 'judge',
      problemId: submission.problemId,
      code: submission.code,
      language: submission.language
    };
    
    channel.sendToQueue('WorkerQueue', Buffer.from(JSON.stringify(job)));
  }
  
  await channel.close();
  await connection.close();
}
```

---

## 💡 팁

1. **jobId 생성**: UUID v4 사용 권장
```javascript
const { v4: uuidv4 } = require('uuid');
const jobId = uuidv4();
```

2. **결과 대기**: Redis pub/sub 또는 polling 사용
```javascript
// Polling 방식
async function waitForResult(jobId, maxWait = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const result = await redis.get(`result:${jobId}`);
    if (result) return JSON.parse(result);
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Timeout waiting for result');
}
```

3. **에러 처리**: 항상 status 필드 확인
```javascript
if (result.status === 'SUCCESS' || result.status === 'AC') {
  // 성공
} else {
  // 에러 처리
  console.error(result.message);
}
```

---

## 📞 문의

- 문제 발생 시 서버 로그 확인
- RabbitMQ 연결 오류: 네트워크 및 인증 정보 확인
- S3 오류: AWS 자격증명 및 버킷 권한 확인
- Redis 오류: 연결 정보 및 메모리 확인

