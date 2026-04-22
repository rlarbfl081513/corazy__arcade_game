"""
Redis Pub/Sub 관리
"""
import redis.asyncio as redis
import json
from typing import AsyncGenerator, Dict, Any
from app.core.config import settings


async def get_redis_client() -> redis.Redis:
    """Redis 클라이언트 생성"""
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=True
    )

async def set_ready_flag(submission_uuid: str) -> None:
    """
    제출 UUID에 대해 Redis에 준비 플래그 설정
    
    Args:
        submission_uuid: 제출 UUID
    """
    client = await get_redis_client()
    try:
        key = f"ws_ready:{submission_uuid}"
        await client.set(key, "1", ex=300)  # 5분간 유효
        print(f"✅ 준비 플래그 설정: {submission_uuid}")
    except Exception as e:
        print(f"❌ 준비 플래그 설정 실패: {str(e)}")
        raise
    finally:
        await client.close()


async def subscribe_channel(channel_name: str) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Redis 채널 구독 및 메시지 수신
    
    Args:
        channel_name: 구독할 채널명 (예: compile:{uuid})
    
    Yields:
        Dict[str, Any]: 수신된 메시지 데이터
    """
    client = await get_redis_client()
    pubsub = client.pubsub()
    
    try:
        # 채널 구독
        await pubsub.subscribe(channel_name)
        print(f"✅ Redis 채널 구독 시작: {channel_name}")
        
        # 메시지 수신 루프
        async for message in pubsub.listen():
            # 메시지 타입이 'message'인 경우만 처리
            if message['type'] == 'message':
                try:
                    # JSON 파싱
                    data = json.loads(message['data'])
                    print(f"📥 Redis 메시지 수신: {data.get('type')}")  # ← 로그 추가
                    yield data
                    
                    # 완료 메시지를 받으면 종료
                    if data.get('type') == 'complete' or data.get('status') == 'complete':
                        print(f"✅ 채점 완료, 구독 종료: {channel_name}")
                        break
                        
                except json.JSONDecodeError:
                    print(f"⚠️ JSON 파싱 실패: {message['data']}")
                    continue
                    
    except Exception as e:
        print(f"❌ Redis 구독 에러: {str(e)}")
        raise
        
    finally:
        # 구독 해제 및 연결 종료
        await pubsub.unsubscribe(channel_name)
        await pubsub.close()
        await client.close()
        print(f"✅ Redis 채널 구독 해제: {channel_name}")


async def publish_message(channel_name: str, message_data: Dict[str, Any]) -> None:
    """
    Redis 채널에 메시지 발행 (테스트용)
    
    Args:
        channel_name: 발행할 채널명
        message_data: 발행할 메시지 데이터
    """
    client = await get_redis_client()
    
    try:
        message_json = json.dumps(message_data, ensure_ascii=False)
        await client.publish(channel_name, message_json)
        print(f"✅ Redis 메시지 발행: {channel_name}")
        
    except Exception as e:
        print(f"❌ Redis 발행 실패: {str(e)}")
        raise
        
    finally:
        await client.close()

