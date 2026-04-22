"""
알고리즘 모델 스키마
"""
from pydantic import BaseModel, Field, field_serializer
from datetime import datetime


class AlgorithmBase(BaseModel):
    """알고리즘 기본 정보"""
    name: str = Field(..., max_length=100, description="알고리즘 이름")


class AlgorithmCreate(AlgorithmBase):
    """알고리즘 생성 요청"""
    pass


class AlgorithmResponse(AlgorithmBase):
    """알고리즘 응답"""
    id: int
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: datetime, _info) -> str:
        """Java JPA 형식으로 datetime 직렬화: YYYY-MM-DD HH:MM:SS"""
        if dt is None:
            return None
        return dt.strftime('%Y-%m-%d %H:%M:%S')

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "다이나믹 프로그래밍",
                "created_at": "2025-01-01 00:00:00",
                "updated_at": "2025-01-01 00:00:00"
            }
        }
