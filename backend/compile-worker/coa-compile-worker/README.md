# COA Compile Server

코드 실행 및 채점을 위한 Docker 기반 샌드박스 서버입니다.

## 🚀 기능

- **다중 언어 지원**: JavaScript, Python, C, C++, Java
- **안전한 실행**: Docker 샌드박스 환경에서 격리된 코드 실행
- **제한사항 처리**: TLE (Time Limit Exceeded), MLE (Memory Limit Exceeded), CE (Compile Error), RE (Runtime Error)
- **채점 모드**: S3에서 테스트케이스를 가져와 자동 채점
- **실행 모드**: 사용자 입력으로 코드 실행
- **결과 저장**: Redis를 통한 실시간 결과 조회

## 📖 문서

- **[API 사용 가이드](API_GUIDE.md)**: RabbitMQ를 통한 작업 제출 및 결과 조회 방법
- **[테스트 가이드](test/README.md)**: 테스트 케이스 실행 방법
- **[동시성 테스트](test/CONCURRENCY_TEST.md)**: 비동기 처리 및 성능 테스트

## 📁 프로젝트 구조

```
coa-compile-server/
├── config/              # 환경 설정
│   └── index.js
├── services/            # 비즈니스 로직
│   ├── dockerSandbox.js    # Docker 샌드박스 실행
│   ├── judgeService.js     # 채점 서비스
│   ├── s3Service.js        # S3 연동
│   └── resultService.js    # Redis 결과 저장
├── utils/               # 유틸리티
│   ├── manageDocker.js     # Docker 관리
│   ├── manageFiles.js      # 파일 관리
│   ├── s3Client.js         # S3 클라이언트
│   └── redisClient.js      # Redis 클라이언트
├── src/
│   └── app.js          # 메인 애플리케이션
├── test/               # 테스트 케이스
├── .env.example        # 환경변수 예시
└── package.json
```

## 🔧 설치 및 설정

### 방법 1: Docker Compose로 실행 (권장)

#### 1. 환경변수 설정

`.env.example`을 참고하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

**필수 환경변수 (`.env` 파일에 입력):**
- `RABBITMQ_HOST`: 외부 RabbitMQ 서버 주소
- `RABBITMQ_USER`, `RABBITMQ_PASSWORD`: RabbitMQ 인증 정보
- `REDIS_HOST`: 외부 Redis 서버 주소
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: AWS 자격증명
- `S3_BUCKET_NAME`: S3 버킷 이름

**참고:** 이 Docker Compose는 컴파일 서버만 실행합니다. RabbitMQ와 Redis는 별도로 준비해야 합니다.

#### 2. Docker Compose 실행

**Linux 환경:**
```bash
# 컴파일 서버 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f compile-server

# 서비스 중지
docker-compose down
```

**Windows/Mac 환경:**

Windows와 Mac에서는 `/tmp` 마운트가 작동하지 않으므로 `docker-compose.yml`을 수정해야 합니다:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
  # Windows/Mac: /tmp 대신 현재 디렉토리 사용
  # - /tmp:/tmp  # 이 줄 주석 처리
  - ./temp:/tmp  # 로컬 temp 디렉토리 사용
```

그 후:
```bash
# temp 디렉토리 생성
mkdir temp

# 서비스 시작
docker-compose up -d
```

#### 3. 서비스 확인

- Compile Server: 로그에서 "✓ Connected to RabbitMQ" 및 "👀 Waiting for messages..." 확인

### 방법 2: 로컬 개발 환경

#### 1. 의존성 설치

```bash
npm install
```

#### 2. 환경변수 설정

```bash
cp .env.example .env
```

필수 환경변수:
- `RABBITMQ_HOST`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`: RabbitMQ 연결 정보
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: AWS 자격증명 (채점 모드 사용 시)
- `REDIS_HOST`: Redis 연결 정보 (결과 저장 사용 시)

#### 3. 외부 서비스 준비

**옵션 1: 로컬에서 RabbitMQ/Redis 실행 (개발용)**

```bash
# RabbitMQ
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin \
  rabbitmq:3.12-management-alpine

# Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

그 후 `.env` 파일에 다음과 같이 설정:
```bash
RABBITMQ_HOST=localhost
REDIS_HOST=localhost
```

**옵션 2: 외부 서버 사용 (프로덕션)**

`.env` 파일에 실제 서버 주소 입력:
```bash
RABBITMQ_HOST=your-rabbitmq-server.com
REDIS_HOST=your-redis-server.com
```

#### 4. Docker 설정

Docker가 실행 중이어야 합니다:

```bash
# Docker 상태 확인
docker ps

# Windows에서 Docker Desktop 실행 필요
```

#### 5. 서버 시작

```bash
# 프로덕션 모드
npm start

# 개발 모드 (nodemon)
npm run dev
```

## 🎯 사용 방법

### 메시지 형식

#### 1. 실행 모드 (Run Mode)

```json
{
  "jobId": "unique-job-id",
  "mode": "run",
  "code": "console.log('Hello World');",
  "language": "javascript",
  "input": "optional input data"
}
```

#### 2. 채점 모드 (Judge Mode)

```json
{
  "jobId": "unique-job-id",
  "mode": "judge",
  "problemId": 1,
  "code": "console.log('Hello World');",
  "language": "python"
}
```

### S3 테스트케이스 구조 (파일 기반)

S3 버킷에 다음 형식으로 테스트케이스 저장:

```
s3://bucket-name/problems/{problemId}/
  ├── info.json              # 문제 정보
  ├── sample/                # 샘플 테스트케이스
  │   ├── 1.in
  │   ├── 1.ans
  │   ├── 2.in
  │   └── 2.ans
  └── evaluate/              # 채점 테스트케이스
      ├── 1.in
      ├── 1.ans
      ├── 2.in
      ├── 2.ans
      ├── 3.in
      └── 3.ans
```

**파일 예시**:

`1.in`:
```
1 2
```

`1.ans`:
```
3
```

`info.json`:
```json
{
  "problemId": 1000,
  "title": "A+B",
  "timeLimit": 2000,
  "memoryLimit": 256
}
```

## 🧪 테스트

```bash
# 단일 테스트 실행
npm run test:queue

# 모든 테스트 실행
npm run test:all
```

## 📊 결과 형식

### 실행 결과

```json
{
  "success": true,
  "status": "SUCCESS",
  "message": "정상적으로 실행되었습니다.",
  "output": "Hello World",
  "error": "",
  "executionTime": 150,  // 실행 시간 (ms)
  "memoryUsed": 25       // 최대 메모리 사용량 (MB)
}
```

**필드 설명:**
- `executionTime`: 코드 실행에 걸린 시간 (밀리초)
- `memoryUsed`: 실행 중 메모리 사용량 (MB)
  - 컨테이너 종료 직후 한 번 측정하여 기록
  - 0MB인 경우: 메모리 통계 수집 실패 (드물게 발생)

### 채점 결과

```json
{
  "success": true,
  "status": "AC",
  "message": "모든 테스트케이스를 통과하였습니다.",
  "passedCount": 10,
  "totalCount": 10,
  "testResults": [
    {
      "testCaseNumber": 1,
      "passed": true,
      "status": "AC",
      "executionTime": 120,
      "memoryUsed": 24
    }
  ]
}
```

## 📝 상태 코드

- `SUCCESS`: 정상 실행
- `AC`: Accepted (정답)
- `WA`: Wrong Answer (오답)
- `TLE`: Time Limit Exceeded (시간 초과)
- `MLE`: Memory Limit Exceeded (메모리 초과)
- `CE`: Compile Error (컴파일 에러)
- `RE`: Runtime Error (런타임 에러)
- `SE`: System Error (시스템 에러)

## 🔐 보안

- Docker 샌드박스를 통한 격리된 실행 환경
- 네트워크 비활성화
- 읽기 전용 파일 시스템
- CPU 및 메모리 제한
- 프로세스 수 제한 (PidsLimit: 50)

## 🛠️ 개발

### 코드 구조

- **Utils**: 재사용 가능한 유틸리티 함수
- **Services**: 비즈니스 로직 (채점, S3, Redis)
- **Config**: 환경 설정 중앙 관리

### 새로운 언어 추가

1. `utils/manageFiles.js`에 파일명 추가
2. `services/dockerSandbox.js`에 Docker 이미지 추가
3. `services/dockerSandbox.js`에 실행 커맨드 추가

### 메모리 모니터링

컨테이너 종료 직후 메모리 사용량을 측정합니다.

**작동 방식:**
- 컨테이너 실행 완료 직후 메모리 통계 수집 (한 번만)
- Linux/Windows 플랫폼 모두 지원
- 오버헤드 최소화 (실시간 모니터링 없음)

**특징:**
- 효율적: 실행 중 모니터링 오버헤드 없음
- 간단함: 종료 시점에 한 번만 수집
- 정확함: 컨테이너가 실제로 사용한 메모리 반영

## 🚀 동시성 테스트

비동기 처리 및 성능 테스트:

```bash
# .env에서 동시 처리 작업 수 설정
WORKER_PREFETCH=5  # 최대 5개 동시 실행

# 동시성 테스트
node test/testCase22_concurrency.js
node test/testCase23_concurrencyMixed.js
node test/testCase24_performance.js
```

**자세한 내용:** `test/CONCURRENCY_TEST.md` 참고

## 📄 라이선스

ISC

## 👥 기여

문제 발생 시 이슈를 등록해주세요.

