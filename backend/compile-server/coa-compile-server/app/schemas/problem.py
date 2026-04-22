"""
문제 관련 스키마
"""
from pydantic import BaseModel, Field, field_serializer
from typing import Optional, List
from datetime import datetime


class AlgorithmInfo(BaseModel):
    """알고리즘 정보"""
    id: int
    name: str


class ProgrammingLanguageInfo(BaseModel):
    """프로그래밍 언어 정보"""
    id: int
    language: str
    name: Optional[str] = None


class ProblemBase(BaseModel):
    """문제 기본 정보"""
    problem_number: int = Field(..., description="문제 번호")
    title: str = Field(..., max_length=200, description="문제 제목")


class ProblemCreate(ProblemBase):
    """문제 생성 요청"""
    pass


class ProblemUpdate(BaseModel):
    """문제 수정 요청"""
    title: Optional[str] = Field(None, max_length=200, description="문제 제목")


class ProblemResponse(ProblemBase):
    """문제 응답"""
    id: int
    created_at: datetime
    updated_at: datetime
    algorithms: List[AlgorithmInfo] = Field(default_factory=list, description="관련 알고리즘")
    languages: List[ProgrammingLanguageInfo] = Field(default_factory=list, description="지원 언어")

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
                "problem_number": 1000,
                "title": "A+B",
                "created_at": "2025-01-01 00:00:00",
                "updated_at": "2025-01-01 00:00:00",
                "algorithms": [
                    {"id": 1, "name": "수학"},
                    {"id": 2, "name": "구현"}
                ],
                "languages": [
                    {"id": 1, "language": "python", "name": "Python 3"},
                    {"id": 2, "language": "java", "name": "Java 11"}
                ]
            }
        }


class ProblemListResponse(BaseModel):
    """문제 목록 응답"""
    total: int = Field(..., description="전체 개수")
    items: List[ProblemResponse] = Field(..., description="문제 목록")

    class Config:
        json_schema_extra = {
            "example": {
                "total": 2,
                "items": [
                    {
                        "id": 1,
                        "problem_number": 1000,
                        "title": "A+B",
                        "created_at": "2025-01-01 00:00:00",
                        "updated_at": "2025-01-01 00:00:00",
                        "algorithms": [{"id": 1, "name": "수학"}],
                        "languages": [{"id": 1, "language": "python", "name": "Python 3"}]
                    }
                ]
            }
        }


class ProblemQueryParams(BaseModel):
    """문제 조회 파라미터"""
    algorithm_ids: Optional[List[int]] = Field(None, description="알고리즘 ID 목록 (AND 조건)")
    language_ids: Optional[List[int]] = Field(None, description="언어 ID 목록 (OR 조건)")
    title_prefix: Optional[str] = Field(None, max_length=200, description="제목 접두사 검색")
    limit: int = Field(default=20, ge=1, le=100, description="조회 개수")
    offset: int = Field(default=0, ge=0, description="오프셋")
