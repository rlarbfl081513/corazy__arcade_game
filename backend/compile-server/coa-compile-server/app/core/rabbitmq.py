"""
RabbitMQ 연결 및 큐 관리
"""
import json
import aio_pika
from aio_pika import connect_robust, Message, DeliveryMode
from aio_pika.abc import AbstractRobustConnection, AbstractRobustChannel
from typing import Optional, Dict, Any
from app.core.config import settings


# 전역 연결 및 채널
connection: Optional[AbstractRobustConnection] = None
channel: Optional[AbstractRobustChannel] = None


async def connect_rabbitmq() -> None:
    """RabbitMQ 연결 초기화"""
    global connection, channel
    
    try:
        # RabbitMQ URL 생성
        rabbitmq_url = (
            f"amqp://{settings.RABBITMQ_USER}:{settings.RABBITMQ_PASSWORD}"
            f"@{settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}{settings.RABBITMQ_VHOST}"
        )
        
        # 연결 생성 (자동 재연결 지원)
        connection = await connect_robust(rabbitmq_url)
        channel = await connection.channel()
        
        # QoS 설정 (한 번에 하나의 메시지만 처리)
        await channel.set_qos(prefetch_count=1)
        
        # 큐 선언 (passive=True로 기존 큐 확인만 수행)
        await channel.declare_queue(
            settings.RABBITMQ_QUEUE_NAME,
            durable=False,  # 기존 큐 설정과 동일하게
            passive=False   # 큐가 없으면 생성
        )
        
        print(f"✅ RabbitMQ 연결 성공: {settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}")
        
    except Exception as e:
        print(f"❌ RabbitMQ 연결 실패: {str(e)}")
        raise


async def disconnect_rabbitmq() -> None:
    """RabbitMQ 연결 종료"""
    global connection, channel
    
    try:
        if channel and not channel.is_closed:
            await channel.close()
        
        if connection and not connection.is_closed:
            await connection.close()
        
        print("✅ RabbitMQ 연결 종료")
        
    except Exception as e:
        print(f"❌ RabbitMQ 연결 종료 실패: {str(e)}")


async def enqueue_job(job_data: Dict[str, Any]) -> None:
    """
    작업을 RabbitMQ 큐에 추가
    
    Args:
        job_data: 작업 데이터 딕셔너리
            - submission_uuid: 제출 UUID
            - problem_id: 문제 번호
            - code: 소스 코드
            - language: 프로그래밍 언어
            - mode: 실행 모드 (EVALUATE/SAMPLE)
            - input: 테스트 입력 데이터 (SAMPLE 모드 전용)
    """
    global channel
    
    if not channel or channel.is_closed:
        raise RuntimeError("RabbitMQ 채널이 연결되어 있지 않습니다")
    
    try:
        # 작업 데이터를 JSON으로 직렬화
        message_body = json.dumps(job_data, ensure_ascii=False)
        
        # 메시지 생성 (persistent 설정으로 메시지 영속성 보장)
        message = Message(
            body=message_body.encode('utf-8'),
            delivery_mode=DeliveryMode.PERSISTENT
        )
        
        # 큐에 메시지 발행
        await channel.default_exchange.publish(
            message=message,
            routing_key=settings.RABBITMQ_QUEUE_NAME
        )
        
        print(f"✅ 작업 큐에 추가됨: {job_data.get('submission_uuid')}")
        
    except Exception as e:
        print(f"❌ 작업 큐 추가 실패: {str(e)}")
        raise

