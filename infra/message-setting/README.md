# Message Queue Setting

RabbitMQ와 Redis를 Docker Compose로 설정하는 프로젝트입니다.

## 목차
- [사전 요구사항](#사전-요구사항)
- [Docker 설치](#docker-설치)
- [프로젝트 실행](#프로젝트-실행)
- [서비스 구성](#서비스-구성)
- [접속 정보](#접속-정보)
- [관리 명령어](#관리-명령어)

---

## 사전 요구사항

- Ubuntu/Debian 기반 Linux 인스턴스 (r8g.medium 권장)
- root 또는 sudo 권한

---

## Docker 설치

### 1. 시스템 패키지 업데이트

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Docker 설치에 필요한 패키지 설치

```bash
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

### 3. Docker의 공식 GPG 키 추가

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

### 4. Docker 저장소 설정

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 5. Docker Engine 설치

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 6. Docker 서비스 시작 및 활성화

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 7. Docker 설치 확인

```bash
sudo docker --version
sudo docker compose version
```

### 8. (선택) 현재 사용자를 docker 그룹에 추가

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 프로젝트 실행

### 1. 프로젝트 클론 또는 파일 복사

```bash
# Git 클론 (저장소가 있는 경우)
git clone <repository-url>
cd message-queue-setting

# 또는 docker-compose.yml 파일을 직접 생성
```

### 2. Docker Compose 실행

```bash
# 백그라운드로 실행
docker compose up -d

# 로그 확인
docker compose logs -f

# 특정 서비스 로그만 확인
docker compose logs -f rabbitmq
docker compose logs -f redis
```

### 3. 실행 상태 확인

```bash
docker compose ps
```

---

## 서비스 구성

### RabbitMQ

**이미지**: `rabbitmq:3-management`

**포트**:
- `5672`: AMQP 프로토콜 포트 (애플리케이션 연결용)
- `15672`: Management UI 포트 (웹 관리 콘솔)

**메모리 설정**:
- 최대 메모리: 5GB
- 예약 메모리: 2GB
- 메모리 임계값: 할당된 메모리의 80% (4GB)

**환경 변수**:
- `RABBITMQ_DEFAULT_USER`: admin
- `RABBITMQ_DEFAULT_PASS`: admin
- `RABBITMQ_VM_MEMORY_HIGH_WATERMARK`: 0.8 (메모리 사용량 80% 초과 시 경고)

**데이터 영속화**: `rabbitmq_data` 볼륨에 데이터 저장

**기능**:
- 메시지 큐 브로커
- AMQP 프로토콜 지원
- 웹 기반 관리 UI 제공
- 메시지 영속화 지원

---

### Redis

**이미지**: `redis:7-alpine`

**포트**:
- `6379`: Redis 서버 포트

**메모리 설정**:
- 최대 메모리: 2.5GB (2500MB)
- 예약 메모리: 512MB
- 메모리 정책: `allkeys-lru` (메모리 가득 차면 가장 오래 사용되지 않은 키 자동 삭제)

**Redis 설정**:
- `--appendonly yes`: AOF(Append Only File) 모드로 데이터 영속화
- `--maxmemory 2500mb`: 최대 메모리 사용량 제한
- `--maxmemory-policy allkeys-lru`: LRU(Least Recently Used) 삭제 정책

**데이터 영속화**: `redis_data` 볼륨에 데이터 저장

**기능**:
- 인메모리 데이터 저장소
- 캐싱
- 세션 관리
- 메모리 초과 시 자동으로 오래된 데이터 삭제

---

## 접속 정보

### RabbitMQ Management UI

```
URL: http://<서버IP>:15672
Username: admin
Password: admin
```

### RabbitMQ 애플리케이션 연결

```
Host: <서버IP>
Port: 5672
Username: admin
Password: admin
```

### Redis 연결

```
Host: <서버IP>
Port: 6379
Password: (없음)
```

**Redis CLI 접속**:
```bash
docker compose exec redis redis-cli
```

---

## 관리 명령어

### 컨테이너 관리

```bash
# 서비스 시작
docker compose up -d

# 서비스 중지
docker compose down

# 서비스 재시작
docker compose restart

# 특정 서비스만 재시작
docker compose restart rabbitmq
docker compose restart redis

# 서비스 중지 및 볼륨 삭제 (데이터 초기화)
docker compose down -v
```

### 로그 확인

```bash
# 전체 로그
docker compose logs

# 실시간 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs rabbitmq
docker compose logs redis

# 최근 100줄만 보기
docker compose logs --tail=100
```

### 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker compose ps

# 리소스 사용량 확인
docker stats
```

### 데이터 백업

```bash
# RabbitMQ 데이터 백업
docker run --rm -v message-queue-setting_rabbitmq_data:/data -v $(pwd):/backup ubuntu tar czf /backup/rabbitmq-backup.tar.gz -C /data .

# Redis 데이터 백업
docker run --rm -v message-queue-setting_redis_data:/data -v $(pwd):/backup ubuntu tar czf /backup/redis-backup.tar.gz -C /data .
```

### 데이터 복원

```bash
# RabbitMQ 데이터 복원
docker run --rm -v message-queue-setting_rabbitmq_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/rabbitmq-backup.tar.gz -C /data

# Redis 데이터 복원
docker run --rm -v message-queue-setting_redis_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/redis-backup.tar.gz -C /data
```

---

## 메모리 관리

**총 메모리 분배 (r8g.medium 8GB 기준)**:
- RabbitMQ: 최대 5GB
- Redis: 최대 2.5GB
- 시스템 여유: ~0.5GB

**RabbitMQ 메모리 관리**:
- 할당된 5GB 중 80%(4GB)까지 사용 가능
- 80% 초과 시 경고 발생 및 메시지 수신 제한

**Redis 메모리 관리**:
- 2.5GB 도달 시 LRU 정책으로 오래된 키 자동 삭제
- 새로운 데이터는 계속 저장 가능
- OOM(Out of Memory) 에러 방지

---

## 트러블슈팅

### Docker 실행 권한 에러

```bash
# docker 그룹에 사용자 추가
sudo usermod -aG docker $USER
newgrp docker
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
sudo netstat -tuln | grep -E '5672|15672|6379'

# 또는
sudo lsof -i :5672
sudo lsof -i :15672
sudo lsof -i :6379
```

### 컨테이너가 시작되지 않을 때

```bash
# 상세 로그 확인
docker compose logs

# 컨테이너 재시작
docker compose restart

# 완전히 재시작 (볼륨 제외)
docker compose down
docker compose up -d
```

### 메모리 부족

```bash
# 현재 메모리 사용량 확인
docker stats

# 불필요한 컨테이너/이미지 정리
docker system prune -a
```

---

## 보안 권장사항

1. **RabbitMQ 기본 비밀번호 변경**
   ```yaml
   environment:
     RABBITMQ_DEFAULT_USER: your_username
     RABBITMQ_DEFAULT_PASS: your_strong_password
   ```

2. **방화벽 설정** (필요한 포트만 개방)
   ```bash
   sudo ufw allow 5672/tcp
   sudo ufw allow 15672/tcp
   sudo ufw allow 6379/tcp
   ```

3. **Redis 비밀번호 설정** (선택사항)
   ```yaml
   command: >
     redis-server
     --appendonly yes
     --maxmemory 2500mb
     --maxmemory-policy allkeys-lru
     --requirepass your_redis_password
   ```

---

## 라이선스

MIT License
