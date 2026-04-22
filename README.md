# COrazy Arcade

알고리즘 타이핑과 릴레이 코딩으로 즐기는 코딩 게임 플랫폼

## 프로젝트 개요

COrazy Arcade는 알고리즘 학습을 게임처럼 즐겁게 할 수 있는 웹 기반 플랫폼입니다.
혼자서 코드를 타이핑하며 연습하는 '반아쓰기' 모드와 팀원들과 협력하는 '릴레이 코딩' 모드를 제공합니다.

**프로젝트 기간**: 2025년 10월 - 11월 (6주)
**배포 URL**: https://corazyarcade.kro.kr

## 주요 기능

### 1. 반아쓰기 (싱글 플레이)
- 알고리즘 코드를 정확하게 타이핑하며 학습
- 언어 선택: Python, Java, JavaScript, C++
- 알고리즘 카테고리: Greedy, DP, Graph, Tree 등
- 실시간 타이핑 속도(CPM) 및 정확도 측정
- 전체 사용자 대비 상위 순위 표시

### 2. 릴레이 코딩 (멀티플레이)
- 2-4명이 팀을 이루어 실시간 협업
- 릴레이 방식으로 코드를 작성하며 문제 해결
- 실시간 채팅을 통한 전략 회의
- WebSocket 기반 동시 편집 및 실시간 동기화
- 게임 종료 후 기여도, 타이핑 속도 등 통계 제공

### 3. 메인 대기실
- 실시간 랭킹 시스템 (CPM 기준)
- 대기 중인 방 목록 및 입장
- 전체 채팅 기능
- 게스트 로그인 / Google OAuth 소셜 로그인

### 4. 코드 에디터
- Monaco Editor 기반 고품질 코드 편집
- 문법 하이라이팅 및 자동 완성
- 테스트 케이스 실행 및 결과 확인
- 실시간 채점 시스템

## 기술 스택

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **State Management**: Zustand 5.0.2
- **Routing**: React Router DOM 7.9.5
- **Styling**: TailwindCSS 4.1.16
- **Game Engine**: Phaser 3.90.0
- **Code Editor**: Monaco Editor
- **WebSocket**: Socket.io Client, STOMP

### Backend
- **Framework**: Spring Boot 3.4.x ~ 3.5.x
- **Language**: Java 21
- **API Gateway**: Spring Cloud Gateway
- **Database**: MySQL 8.x (AWS RDS)
- **Cache**: Redis 7.x
- **Authentication**: Spring Security, OAuth2, JWT
- **WebSocket**: STOMP, Socket.io

### Compile Infrastructure
- **Compile Server**: FastAPI (Python), MySQL, RabbitMQ, Redis
- **Compile Worker**: Node.js, Docker, RabbitMQ
- **Container**: Docker (샌드박스 환경)
- **Storage**: AWS S3

### Infrastructure
- **Cloud**: AWS (EC2, RDS, S3)
- **Web Server**: Nginx
- **Reverse Proxy**: Nginx
- **Container**: Docker
- **CI/CD**: GitLab CI/CD
- **Domain**: corazyarcade.kro.kr

## 시스템 아키텍처

```
[Client (React)]
      ↓
[API Gateway (Spring Cloud Gateway)]
      ↓
      ├─→ [Auth Server] - 인증/인가
      ├─→ [Chat Server] - 실시간 채팅
      ├─→ [Snippet Server] - 문제/스니펫 관리
      ├─→ [Compile Server] - 코드 컴파일 요청
      └─→ [Compile Worker] - 실제 코드 실행 및 채점
```

## 프로젝트 구조

```
master/
├── backend/              # 백엔드 서버들
│   ├── auth-server/      # 인증/인가 서버 (Spring Boot)
│   ├── gateway-server/   # API Gateway (Spring Cloud)
│   ├── chat-server/      # 채팅 서버 (Node.js)
│   ├── snippet-server/   # 문제 관리 서버 (Spring Boot)
│   ├── compile-server/   # 컴파일 서버 (FastAPI)
│   └── compile-worker/   # 컴파일 워커 (Node.js)
├── frontend/             # 프론트엔드
│   └── frontend/         # React 애플리케이션
├── infra/                # 인프라 설정
├── exec/                 # 포팅 매뉴얼 및 시연 자료
│   ├── README.md         # 포팅 매뉴얼
│   └── screenshot/       # 시연 스크린샷
└── README.md             # 프로젝트 소개 (본 문서)
```

## 빠른 시작

### 사전 요구사항
- Docker & Docker Compose
- Node.js 20.x
- Java 21
- Python 3.x
- MySQL 8.x
- Redis 7.x

### 로컬 개발 환경 설정

1. **저장소 클론**
```bash
git clone https://lab.ssafy.com/s13-final/S13P31A705.git
cd S13P31A705
```

2. **환경 변수 설정**

각 서버 디렉토리에 `.env` 파일을 생성하고 필요한 환경 변수를 설정합니다.
자세한 내용은 [포팅 매뉴얼](exec/README.md)을 참조하세요.

3. **서버 실행**

각 서버는 Docker로 실행하거나 로컬에서 직접 실행할 수 있습니다.

```bash
# Frontend
cd frontend/frontend
npm install
npm run dev

# Backend 서버 (예: Auth Server)
cd backend/auth-server/coa-main-server
./gradlew bootRun

# Compile Server
cd compile-server/coa-compile-server
pip install -r requirements.txt
python -m app.main
```

자세한 실행 방법은 각 서버의 README.md를 참조하세요.

## 주요 API

### 인증 API
- `POST /auth/login` - 로그인
- `POST /auth/google` - Google OAuth 로그인
- `POST /auth/refresh` - 토큰 갱신

### 문제 API
- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/{id}` - 문제 상세 조회

### 컴파일 API
- `POST /api/compile` - 코드 컴파일 및 실행
- `GET /api/compile/result/{id}` - 컴파일 결과 조회

### WebSocket API
- `/ws/chat` - 실시간 채팅
- `/ws/game` - 게임 상태 동기화
- `/ws/compile` - 컴파일 결과 실시간 수신

## 배포

프로젝트는 Docker 컨테이너로 배포되며, Nginx를 통해 서비스됩니다.

배포 방법은 [포팅 매뉴얼](exec/README.md)을 참조하세요.

## 문서

- [포팅 매뉴얼](exec/README.md) - 빌드, 배포, 환경 변수 상세 설명
- [시연 시나리오](exec/README.md#4-시연-시나리오) - 기능별 시연 가이드
- [Frontend README](frontend/frontend/README.md) - 프론트엔드 개발 가이드
- [Backend README](backend/README.md) - 백엔드 서버 개요
- [Compile Server README](compile-server/coa-compile-server/README.md) - 컴파일 서버 상세

## 팀원

SSAFY 13기 자율 프로젝트 팀 A705

| 역할 | 이름 | 담당 |
|------|------|------|
| Frontend, Design | 김규리 | React, UX/UI 디자인 |
| Frontend | 천수현 | React, 특수효과 디자인 |
| Backend | 이우진 | 릴레이 서버 고도화 , 채점 서버 구현 및 최적화 |
| Backend | 이지유 | 인증/인가, 회원 관리 |
| Frontend, Backend | 한강섭 | React 구현, 릴레이 서버 |
| Infra | 오승언 | AWS, Docker, CI/CD, k8s, 채팅 시스템 |

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 기여

버그 리포트 및 기능 제안은 GitLab Issues를 이용해주세요.

---

**COrazy Arcade** - 코딩을 게임처럼, 학습을 즐겁게!
