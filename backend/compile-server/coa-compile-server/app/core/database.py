"""
데이터베이스 연결 설정
"""
import databases
from app.core.config import settings

# 데이터베이스 인스턴스 생성
database = databases.Database(
    settings.DATABASE_URL,
    min_size=settings.DATABASE_POOL_SIZE,
    max_size=settings.DATABASE_POOL_SIZE + settings.DATABASE_MAX_OVERFLOW
)


async def connect_db():
    """데이터베이스 연결"""
    await database.connect()
    print(f"✅ 데이터베이스 연결 성공: {settings.DATABASE_URL.split('@')[1]}")


async def disconnect_db():
    """데이터베이스 연결 해제"""
    await database.disconnect()
    print("✅ 데이터베이스 연결 해제")

