# COA Compile Server

FastAPI 기반 코드 컴파일 및 실행 서버

## 📁 디렉토리 구조

```
coa-compile-server/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 애플리케이션 진입점
│   ├── api/                 # API 엔드포인트
│   │   ├── __init__.py
│   │   └── routes/          # 라우터 모듈
│   │       ├── __init__.py
│   │       └── health.py    # 헬스 체크 라우터
│   ├── core/                # 핵심 설정
│   │   ├── __init__.py
│   │   └── config.py        # 환경 설정
│   ├── models/              # 데이터베이스 모델
│   │   └── __init__.py
│   ├── schemas/             # Pydantic 스키마
│   │   └── __init__.py
│   └── services/            # 비즈니스 로직
│       └── __init__.py
├── requirements.txt         # Python 의존성
├── .env.example            # 환경 변수 예제
├── .gitignore              # Git 무시 파일
└── README.md               # 프로젝트 문서
```

## 🚀 시작하기

### 방법 1: UV 사용 (권장) ⚡

UV는 Rust로 작성된 초고속 Python 패키지 관리자입니다.

#### 1-1. UV 설치

```powershell
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### 1-2. Conda 환경에서 UV 사용

```bash
# Conda 환경 활성화
conda activate your-env-name

# 현재 환경에 의존성 설치 (venv 생성 안함)
uv pip install -r requirements.txt

# 또는 pyproject.toml 기반 설치
uv pip sync
```

#### 1-3. UV 자체 가상환경 사용 (Conda 없이)

```bash
# 의존성 설치 및 가상환경 자동 생성
uv sync

# 개발 의존성 포함
uv sync --dev
```

#### 1-4. 서버 실행

```bash
# Conda 환경에서
python -m app.main

# UV 가상환경에서
uv run python -m app.main
```

### 방법 2: PIP 사용 (기존 방식)

#### 2-1. 가상환경 생성 및 활성화

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

#### 2-2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일을 열어 필요한 값들을 설정
```

### 4. 서버 실행

```bash
# UV 사용시
uv run python -m app.main

# PIP 사용시
python -m app.main

# 또는
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. API 문서 확인

서버 실행 후 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📝 주요 기능

- ✅ 헬스 체크 엔드포인트
- 🔧 환경 변수 기반 설정 관리
- 🌐 CORS 설정
- 📚 자동 API 문서 생성

## 🛠 기술 스택

- **FastAPI**: 고성능 Python 웹 프레임워크
- **Uvicorn**: ASGI 서버
- **Pydantic**: 데이터 검증 및 설정 관리
- **Redis**: 메시지 큐 및 캐싱
- **Boto3**: AWS S3 연동
- **Docker SDK**: 컨테이너 관리

## 📌 다음 단계

1. 컴파일 엔드포인트 구현
2. Redis 큐 연동
3. Docker 샌드박스 통합
4. S3 파일 업로드/다운로드
5. 에러 처리 및 로깅
6. 테스트 코드 작성

