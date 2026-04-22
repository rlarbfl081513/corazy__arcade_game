# Gateway Server

COrazy Arcade API Gateway 서버

## 개요

모든 클라이언트 요청을 수신하고 적절한 마이크로서비스로 라우팅하는 Spring Cloud Gateway 서버입니다.

## 기술 스택

- **Framework**: Spring Boot 3.5.6, Spring Cloud Gateway
- **Language**: Java 21
- **Build Tool**: Gradle 8.5
- **Cache**: Redis
- **Load Balancing**: Spring Cloud LoadBalancer

## 주요 기능

- API 라우팅 및 프록시
- 인증 필터 (JWT 검증)
- CORS 설정
- Rate Limiting
- Request/Response 로깅
- Circuit Breaker 패턴

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정합니다:

```env
# Server
SERVER_PORT=8080

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_DB=0

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain

# Service Endpoints (예시)
AUTH_SERVICE_URL=http://auth-server:8080
CHAT_SERVICE_URL=http://chat-server:8080
SNIPPET_SERVICE_URL=http://snippet-server:8080
COMPILE_SERVICE_URL=http://compile-server:8000
```

## 실행 방법

### Gradle로 실행

```bash
./gradlew bootRun
```

### Docker로 실행

```bash
# 이미지 빌드
docker build -t coa-gateway:latest .

# 컨테이너 실행
docker run -d \
  --name coa-gateway \
  -p 8080:8080 \
  --env-file .env \
  coa-gateway:latest
```

## 라우팅 규칙

| 경로 패턴 | 대상 서비스 | 설명 |
|----------|------------|------|
| `/auth/**` | Auth Server | 인증/인가 |
| `/chat/**` | Chat Server | 채팅 |
| `/snippet/**` | Snippet Server | 코드 스니펫 |
| `/compile/**` | Compile Server | 코드 컴파일 |

## 프로젝트 구조

```
src/main/java/com/coa/gateway/
├── config/          # Gateway 설정
├── filter/          # 커스텀 필터
├── handler/         # 에러 핸들러
└── util/            # 유틸리티
```
