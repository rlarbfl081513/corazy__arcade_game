"""
알고리즘 컴파일 스키마
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from enum import Enum


class CompileMode(str, Enum):
    """컴파일 모드"""
    EVALUATE = "EVALUATE"    # 제출 모드
    SAMPLE = "SAMPLE"        # 테스트 모드


class Language(str, Enum):
    """지원 언어"""
    PYTHON = "python"
    JAVA = "java"
    C = "c"
    CPP = "cpp"
    JAVASCRIPT = "javascript"


class EnqueueRequest(BaseModel):
    """작업 큐 요청"""
    submission_uuid: Optional[str] = Field(None, description="제출 UUID (선택사항, 테스트용)")
    problem_id: int = Field(..., gt=0, description="문제 번호")
    code: str = Field(..., min_length=1, max_length=100000, description="소스 코드")
    language: Language = Field(..., description="프로그래밍 언어")
    mode: CompileMode = Field(..., description="실행 모드 (제출/테스트)")
    input: Optional[str] = Field(None, description="테스트 입력 데이터 (테스트 모드 전용)")
    
    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        """코드 검증"""
        if not v.strip():
            raise ValueError("코드가 비어있습니다")
        return v
    
    @field_validator("input")
    @classmethod
    def validate_input_with_mode(cls, v: Optional[str], info) -> Optional[str]:
        """모드에 따른 입력 검증"""
        mode = info.data.get("mode")
        if mode == CompileMode.SAMPLE and v is None:
            raise ValueError("SAMPLE 모드에서는 input이 필수입니다")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "problem_id": 1000,
                "code": "def solution():\n    return 42",
                "language": "python",
                "mode": "SAMPLE",
                "input": "1 2 3"
            }
        }


class EnqueueResponse(BaseModel):
    """작업 큐 응답"""
    submission_uuid: str = Field(..., description="제출 UUID")
    status: str = Field(default="queued", description="작업 상태")
    message: str = Field(default="작업이 큐에 추가되었습니다", description="메시지")
    
    class Config:
        json_schema_extra = {
            "example": {
                "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
                "status": "queued",
                "message": "작업이 큐에 추가되었습니다"
            }
        }


class CompileResult(BaseModel):
    """컴파일 결과"""
    submission_uuid: str
    status: str  # success, compile_error, runtime_error, timeout, etc
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None  # 실행 시간 (ms)
    memory_usage: Optional[int] = None  # 메모리 사용량 (KB)

