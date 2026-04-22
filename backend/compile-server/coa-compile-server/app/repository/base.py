"""
Base Repository 클래스
"""
from typing import Generic, TypeVar, Optional, List, Dict, Any
from databases import Database
from app.core.database import database

T = TypeVar('T')


class BaseRepository(Generic[T]):
    """기본 레포지토리 클래스"""

    def __init__(self, db: Database = database):
        """
        Args:
            db: 데이터베이스 인스턴스
        """
        self.db = db

    async def execute(self, query: str, values: Optional[Dict[str, Any]] = None) -> int:
        """
        쿼리 실행 (INSERT, UPDATE, DELETE)

        Args:
            query: SQL 쿼리
            values: 바인딩할 값들

        Returns:
            영향받은 행의 수 또는 생성된 ID
        """
        return await self.db.execute(query=query, values=values)

    async def fetch_one(self, query: str, values: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        단일 행 조회

        Args:
            query: SQL 쿼리
            values: 바인딩할 값들

        Returns:
            조회된 행 (딕셔너리) 또는 None
        """
        result = await self.db.fetch_one(query=query, values=values)
        return dict(result) if result else None

    async def fetch_all(self, query: str, values: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        다중 행 조회

        Args:
            query: SQL �ery
            values: 바인딩할 값들

        Returns:
            조회된 행들의 리스트
        """
        results = await self.db.fetch_all(query=query, values=values)
        return [dict(row) for row in results]

    async def fetch_val(self, query: str, values: Optional[Dict[str, Any]] = None) -> Any:
        """
        단일 값 조회

        Args:
            query: SQL 쿼리
            values: 바인딩할 값들

        Returns:
            조회된 값
        """
        return await self.db.fetch_val(query=query, values=values)
