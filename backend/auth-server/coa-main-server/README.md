# Auth Server

COrazy Arcade 인증/인가 서버

## 개요

사용자 인증 및 OAuth2 소셜 로그인, JWT 토큰 관리를 담당하는 Spring Boot 서버입니다.

## 기술 스택

- **Framework**: Spring Boot 3.5.6
- **Language**: Java 21
- **Build Tool**: Gradle 8.5
- **Database**: MySQL 8.x
- **Authentication**: Spring Security, OAuth2, JWT
- **Cache**: Redis

## 주요 기능

- Google OAuth2 소셜 로그인
- JWT 기반 인증/인가
- Access Token / Refresh Token 발급 및 관리
- 사용자 정보 관리
- Redis를 활용한 토큰 캐싱

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정합니다:

```env
# MySQL Database
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=your-db-name
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password

# Server
SERVER_PORT=8080

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_ACCESS_TOKEN_VALIDITY=3600000
JWT_REFRESH_TOKEN_VALIDITY=604800000
JWT_SECRET=your-jwt-secret-key-minimum-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain/auth/google/callback

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain
```

## 실행 방법

### Gradle로 실행

```bash
./gradlew bootRun
```

### Docker로 실행

```bash
# 이미지 빌드
docker build -t coa-auth:latest .

# 컨테이너 실행
docker run -d \
  --name coa-auth \
  -p 8080:8080 \
  --env-file .env \
  coa-auth:latest
```

## API 엔드포인트

- `POST /auth/login` - 로그인
- `POST /auth/google` - Google OAuth 로그인
- `POST /auth/refresh` - Access Token 갱신
- `POST /auth/logout` - 로그아웃
- `GET /auth/me` - 사용자 정보 조회

## 프로젝트 구조

```
src/main/java/com/coa/auth/
├── config/          # 설정 클래스
├── controller/      # REST API 컨트롤러
├── service/         # 비즈니스 로직
├── repository/      # 데이터 접근 계층
├── domain/          # 엔티티 모델
├── dto/             # 데이터 전송 객체
└── security/        # 보안 설정
```
