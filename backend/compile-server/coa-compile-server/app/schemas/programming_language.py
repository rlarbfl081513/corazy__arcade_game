"""
프로그래밍 언어 스키마
"""
from pydantic import BaseModel, Field, field_serializer
from typing import Optional
from datetime import datetime


class ProgrammingLanguageBase(BaseModel):
    """프로그래밍 언어 기본 정보"""
    language: str = Field(..., max_length=15, description="언어 코드 (예: python, java)")
    name: Optional[str] = Field(None, max_length=50, description="언어 이름 (예: Python 3, Java 11)")


class ProgrammingLanguageCreate(ProgrammingLanguageBase):
    """프로그래밍 언어 생성 요청"""
    pass


class ProgrammingLanguageResponse(ProgrammingLanguageBase):
    """프로그래밍 언어 응답"""
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
                "language": "python",
                "name": "Python 3",
                "created_at": "2025-01-01 00:00:00",
                "updated_at": "2025-01-01 00:00:00"
            }
        }
