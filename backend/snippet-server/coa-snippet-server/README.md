# Snippet Server

COrazy Arcade 코드 스니펫 및 알고리즘 문제 관리 서버

## 개요

알고리즘 문제, 코드 스니펫, 언어별 템플릿을 관리하는 Spring Boot 서버입니다.

## 기술 스택

- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Build Tool**: Gradle 8.5
- **Database**: MySQL 8.x
- **ORM**: Spring Data JPA

## 주요 기능

- 알고리즘 문제 CRUD
- 프로그래밍 언어별 코드 템플릿 관리
- 문제 난이도 및 카테고리 관리
- 사용자별 코드 스니펫 저장
- 문제 검색 및 필터링

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

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain
```

## 데이터베이스 초기화

프로젝트에 포함된 SQL 파일로 초기 데이터를 설정합니다:

```bash
mysql -u coa_admin -p coa_database < migration_dictation_algorithm.sql
```

## 실행 방법

### Gradle로 실행

```bash
./gradlew bootRun
```

### Docker로 실행

```bash
# 이미지 빌드
docker build -t coa-snippet:latest .

# 컨테이너 실행
docker run -d \
  --name coa-snippet \
  -p 8080:8080 \
  --env-file .env \
  coa-snippet:latest
```

## API 엔드포인트

- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/{id}` - 문제 상세 조회
- `POST /api/problems` - 문제 생성
- `PUT /api/problems/{id}` - 문제 수정
- `DELETE /api/problems/{id}` - 문제 삭제
- `GET /api/snippets` - 스니펫 목록 조회
- `POST /api/snippets` - 스니펫 저장

## 프로젝트 구조

```
src/main/java/com/coa/snippet/
├── config/          # 설정 클래스
├── controller/      # REST API 컨트롤러
├── service/         # 비즈니스 로직
├── repository/      # 데이터 접근 계층
├── domain/          # 엔티티 모델
└── dto/             # 데이터 전송 객체
```

## 데이터베이스 스키마

주요 테이블:
- `algorithm` - 알고리즘 문제
- `programming_language` - 프로그래밍 언어
- `code_template` - 언어별 템플릿
- `user_snippet` - 사용자 코드 스니펫
