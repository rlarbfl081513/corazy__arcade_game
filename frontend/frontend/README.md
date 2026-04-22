# Frontend

COrazy Arcade 프론트엔드 애플리케이션

## 개요

React와 Vite를 기반으로 한 COrazy Arcade의 웹 클라이언트입니다. 게임 UI, 코드 에디터, 실시간 채팅 등의 기능을 제공합니다.

## 기술 스택

- **Runtime**: Node.js 20.x
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.5
- **State Management**: Zustand 5.0.2
- **WebSocket**: Socket.io Client 4.8.1, STOMP 7.2.1
- **Game Engine**: Phaser 3.90.0
- **Code Editor**: Monaco Editor
- **Styling**: TailwindCSS 4.1.16
- **Web Server**: Nginx (Alpine)

## 주요 기능

- 사용자 인증 (게스트 로그인, Google OAuth)
- 메인 대기실 (랭킹, 방 목록, 채팅)
- 싱글 플레이 - 반아쓰기 모드
- 멀티플레이 - 릴레이 코딩 게임
- 실시간 코드 에디터 (Monaco Editor)
- WebSocket 기반 실시간 통신
- 게임 결과 및 통계 표시

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정합니다:

```env
# API 엔드포인트
VITE_API_BASE_URL=https://corazyarcade.kro.kr
VITE_WS_URL=wss://corazyarcade.kro.kr

# OAuth
VITE_GOOGLE_CLIENT_ID=293475120765-0dvroo8fncpo40enbf7ahavle7s9ejo.apps.googleusercontent.com

# App
VITE_APP_NAME=COrazy Arcade
```

## 실행 방법

### 개발 모드

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# http://localhost:5173 에서 접속
```

### 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### Docker로 실행

```bash
# 이미지 빌드
docker build -t coa-frontend:latest .

# 컨테이너 실행
docker run -d \
  --name coa-frontend \
  -p 80:80 \
  coa-frontend:latest
```

## 프로젝트 구조

```
src/
├── components/      # React 컴포넌트
│   ├── common/      # 공통 컴포넌트
│   ├── game/        # 게임 관련 컴포넌트
│   ├── editor/      # 코드 에디터
│   └── chat/        # 채팅 컴포넌트
├── pages/           # 페이지 컴포넌트
│   ├── Login/       # 로그인 페이지
│   ├── Main/        # 메인 대기실
│   ├── Room/        # 게임 방
│   ├── Game/        # 게임 화면
│   └── Dictation/   # 반아쓰기 모드
├── store/           # Zustand 상태 관리
├── hooks/           # 커스텀 훅
├── services/        # API 서비스
├── utils/           # 유틸리티 함수
└── styles/          # 스타일 파일
```

## 주요 라이브러리

### UI/UX
- TailwindCSS - 유틸리티 기반 CSS 프레임워크
- Phaser - 2D 게임 엔진

### 상태 관리
- Zustand - 경량 상태 관리 라이브러리

### 실시간 통신
- Socket.io Client - WebSocket 통신
- @stomp/stompjs - STOMP 프로토콜

### 코드 에디터
- Monaco Editor - VS Code 기반 코드 에디터

## 빌드 최적화

- Multi-stage Docker 빌드
- Vite 기반 빠른 빌드
- Tree Shaking 및 Code Splitting
- Nginx를 통한 정적 파일 서빙

## 개발 가이드

### 컴포넌트 작성

```jsx
import { useState } from 'react';

function MyComponent() {
  const [state, setState] = useState(null);

  return (
    <div className="container">
      {/* 컴포넌트 내용 */}
    </div>
  );
}

export default MyComponent;
```

### API 호출

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// GET 요청
const fetchData = async () => {
  const response = await api.get('/api/endpoint');
  return response.data;
};
```

### WebSocket 연결

```javascript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL);

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('message', (data) => {
  console.log('Received:', data);
});
```
