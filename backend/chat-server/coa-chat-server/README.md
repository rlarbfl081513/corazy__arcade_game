# Chat Server

COrazy Arcade 실시간 채팅 서버

## 개요

WebSocket과 STOMP 프로토콜을 사용한 실시간 채팅 기능을 제공하는 Node.js 서버입니다.

## 기술 스택

- **Runtime**: Node.js 20.x
- **Framework**: Express
- **WebSocket**: Socket.io, STOMP
- **Database**: MySQL 8.x
- **Protocol**: WebSocket, STOMP

## 주요 기능

- 실시간 채팅 메시지 전송/수신
- 방별 채팅 관리
- 전체 채팅 (로비)
- 사용자 입장/퇴장 알림
- 채팅 기록 저장

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
PORT=8080

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain
```

## 실행 방법

### npm으로 실행

```bash
# 의존성 설치
npm install

# 서버 실행
npm start
```

### Docker로 실행

```bash
# 이미지 빌드
docker build -t coa-chat:latest .

# 컨테이너 실행
docker run -d \
  --name coa-chat \
  -p 8080:8080 \
  --env-file .env \
  coa-chat:latest
```

## WebSocket 이벤트

### 클라이언트 → 서버

- `join_room` - 방 입장
- `leave_room` - 방 퇴장
- `send_message` - 메시지 전송

### 서버 → 클라이언트

- `message` - 새 메시지
- `user_joined` - 사용자 입장
- `user_left` - 사용자 퇴장
- `room_created` - 방 생성
- `room_deleted` - 방 삭제

## 프로젝트 구조

```
.
├── server.js        # 메인 서버 파일
├── db.js            # 데이터베이스 연결
├── package.json     # 의존성 관리
└── Dockerfile       # Docker 설정
```
