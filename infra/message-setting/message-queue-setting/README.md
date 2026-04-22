# RabbitMQ 설정 가이드

이 디렉토리에는 RabbitMQ와 Redis의 Docker Compose 설정이 포함되어 있습니다.

## 파일 구조

```
message-queue-setting/
├── docker-compose.yml   # Docker Compose 설정 파일
└── rabbitmq.conf        # RabbitMQ 설정 파일
```

---

## RabbitMQ 설정 변수

### rabbitmq.conf 파일 설정

#### 메모리 관리

**`vm_memory_high_watermark.relative`**
- **설명**: RabbitMQ가 사용할 수 있는 최대 메모리 비율
- **기본값**: 0.4 (40%)
- **현재 설정**: 0.8 (80%)
- **의미**: 할당된 메모리(5GB)의 80%(4GB)까지 사용 가능
- **초과 시 동작**:
  - 메모리 사용량이 임계값을 초과하면 알람 발생
  - 새로운 메시지 수신을 차단 (블로킹)
  - 기존 메시지는 계속 처리 가능

**설정 예시**:
```conf
# 상대적 비율로 설정 (컨테이너 메모리의 80%)
vm_memory_high_watermark.relative = 0.8

# 또는 절대값으로 설정
# vm_memory_high_watermark.absolute = 4GB
```

**권장 설정**:
- 개발 환경: 0.6 - 0.7 (안정성 우선)
- 운영 환경: 0.7 - 0.8 (성능과 안정성 균형)
- 고부하 환경: 0.5 - 0.6 (여유 공간 확보)

---

#### 디스크 공간 관리

**`disk_free_limit.absolute`**
- **설명**: RabbitMQ가 정상 작동하기 위해 필요한 최소 여유 디스크 공간
- **기본값**: 50MB
- **현재 설정**: 2GB
- **의미**: 디스크 여유 공간이 2GB 이하로 떨어지면 경고
- **초과 시 동작**:
  - 디스크 알람 발생
  - 새로운 메시지 수신 차단
  - 기존 메시지는 계속 처리

**설정 예시**:
```conf
# 절대값으로 설정
disk_free_limit.absolute = 2GB

# 또는 상대적 비율로 설정 (전체 디스크의 %)
# disk_free_limit.relative = 0.1  # 10%
```

**권장 설정**:
- 소규모 시스템: 1GB - 2GB
- 중규모 시스템: 2GB - 5GB
- 대규모 시스템: 5GB 이상

---

### 기타 유용한 RabbitMQ 설정

다음은 필요에 따라 `rabbitmq.conf`에 추가할 수 있는 설정입니다:

#### 네트워크 설정

```conf
# 클라이언트 연결 유지 시간 (초)
heartbeat = 60

# 최대 동시 연결 수
max_connections = 1000

# 채널당 최대 연결 수
channel_max = 2047
```

#### 메시지 지속성

```conf
# 메시지 디스크 쓰기 주기 (밀리초)
queue_index_embed_msgs_below = 4096

# 메시지 저장 디렉토리
# mnesia_base = /var/lib/rabbitmq/mnesia
```

#### 클러스터 설정

```conf
# 클러스터 파티션 처리 모드
cluster_partition_handling = autoheal

# 노드 이름
# cluster_formation.peer_discovery_backend = rabbit_peer_discovery_classic_config
```

#### 로그 설정

```conf
# 로그 레벨 (debug, info, warning, error)
log.console.level = info

# 로그 파일 위치
# log.file = /var/log/rabbitmq/rabbit.log
```

#### 성능 튜닝

```conf
# 메시지 프리페치 카운트
# consumer_prefetch_count = 256

# VM I/O 스레드 수
# vm_io_thread_pool = 128
```

---

## Docker Compose 환경 변수

### RabbitMQ 컨테이너 환경 변수

**`RABBITMQ_DEFAULT_USER`**
- **설명**: RabbitMQ 기본 관리자 사용자 이름
- **현재 설정**: admin
- **사용처**: Management UI 로그인, AMQP 연결 인증

**`RABBITMQ_DEFAULT_PASS`**
- **설명**: RabbitMQ 기본 관리자 비밀번호
- **현재 설정**: admin
- **보안**: 운영 환경에서는 반드시 변경 필요

**보안 강화 예시**:
```yaml
environment:
  RABBITMQ_DEFAULT_USER: your_admin_username
  RABBITMQ_DEFAULT_PASS: your_strong_password_here
```

---

### Docker 메모리 리소스 설정

**`deploy.resources.limits.memory`**
- **설명**: 컨테이너가 사용할 수 있는 최대 메모리
- **현재 설정**: 5G
- **의미**: RabbitMQ 컨테이너가 최대 5GB까지 메모리 사용 가능

**`deploy.resources.reservations.memory`**
- **설명**: 컨테이너에 예약된 최소 메모리
- **현재 설정**: 2G
- **의미**: 시스템이 RabbitMQ를 위해 최소 2GB를 예약

**메모리 계산**:
- 컨테이너 최대 메모리: 5GB
- vm_memory_high_watermark.relative: 0.8
- 실제 사용 가능 메모리: 5GB × 0.8 = 4GB
- 임계값 도달 시: 메시지 수신 차단

---

## 설정 적용 방법

### 1. rabbitmq.conf 수정 후 재시작

```bash
# docker-compose.yml이 있는 디렉토리에서
docker compose restart rabbitmq
```

### 2. 환경 변수 변경 후 재시작

```bash
# docker-compose.yml 수정 후
docker compose down
docker compose up -d
```

### 3. 설정 확인

```bash
# RabbitMQ 컨테이너 로그 확인
docker compose logs rabbitmq

# RabbitMQ 관리 콘솔에서 확인
# http://<서버IP>:15672
# Overview > Nodes > 노드 클릭 > Configuration
```

---

## 모니터링

### Management UI에서 확인 가능한 정보

1. **메모리 사용량**
   - Overview > Nodes > Memory used
   - 현재 사용 중인 메모리와 임계값 확인

2. **디스크 사용량**
   - Overview > Nodes > Disk free
   - 남은 디스크 공간 확인

3. **알람 상태**
   - Overview > Nodes
   - 메모리/디스크 알람 발생 시 빨간색으로 표시

### CLI를 통한 모니터링

```bash
# 컨테이너 내부 접속
docker compose exec rabbitmq bash

# 메모리 상태 확인
rabbitmqctl status | grep memory

# 알람 확인
rabbitmqctl list_alarms

# 노드 상태 확인
rabbitmqctl node_health_check
```

---

## 트러블슈팅

### 메모리 알람 발생 시

**증상**: "Memory alarm" 메시지, 메시지 수신 불가

**해결 방법**:
1. 메시지 소비 속도 증가 (컨슈머 추가)
2. 불필요한 큐 삭제
3. 메모리 증가 (docker-compose.yml에서 limits.memory 조정)
4. vm_memory_high_watermark 값 조정

```bash
# 알람 확인
docker compose exec rabbitmq rabbitmqctl list_alarms

# 큐 목록 확인
docker compose exec rabbitmq rabbitmqctl list_queues name messages
```

### 디스크 알람 발생 시

**증상**: "Disk alarm" 메시지, 메시지 저장 불가

**해결 방법**:
1. 오래된 메시지 삭제
2. 디스크 공간 확보
3. disk_free_limit 값 조정 (주의 필요)

```bash
# 디스크 사용량 확인
docker compose exec rabbitmq df -h

# 큐 삭제
docker compose exec rabbitmq rabbitmqctl delete_queue queue_name
```

### 설정 파일 오류

**증상**: RabbitMQ 컨테이너가 시작되지 않음

**해결 방법**:
```bash
# 로그 확인
docker compose logs rabbitmq

# 설정 파일 문법 확인
cat rabbitmq.conf

# 기본 설정으로 되돌리기
# rabbitmq.conf의 문제 설정을 주석 처리하고 재시작
```

---

## 참고 자료

- [RabbitMQ 공식 설정 문서](https://www.rabbitmq.com/configure.html)
- [RabbitMQ 메모리 관리](https://www.rabbitmq.com/memory.html)
- [RabbitMQ 디스크 알람](https://www.rabbitmq.com/disk-alarms.html)
- [RabbitMQ Production Checklist](https://www.rabbitmq.com/production-checklist.html)

---

## 설정 템플릿

### 개발 환경용 rabbitmq.conf

```conf
# 개발 환경 설정 (안정성 우선)
vm_memory_high_watermark.relative = 0.6
disk_free_limit.absolute = 1GB
log.console.level = debug
heartbeat = 60
```

### 운영 환경용 rabbitmq.conf

```conf
# 운영 환경 설정 (성능과 안정성 균형)
vm_memory_high_watermark.relative = 0.7
disk_free_limit.absolute = 5GB
log.console.level = info
heartbeat = 60
channel_max = 2047
consumer_timeout = 3600000
```

### 고부하 환경용 rabbitmq.conf

```conf
# 고부하 환경 설정 (안정성 최우선)
vm_memory_high_watermark.relative = 0.5
disk_free_limit.absolute = 10GB
log.console.level = warning
heartbeat = 30
channel_max = 4096
vm_io_thread_pool = 128
```
