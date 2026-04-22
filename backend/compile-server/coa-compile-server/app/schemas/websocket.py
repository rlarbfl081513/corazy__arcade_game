"""
WebSocket 메시지 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from enum import Enum


class WebSocketMessageType(str, Enum):
    """WebSocket 메시지 타입"""
    PROGRESS = "progress"      # 진행 상황
    TESTCASE = "testcase"      # 테스트케이스 결과
    RESULT = "result"          # 최종 결과
    ERROR = "error"            # 에러
    COMPLETE = "complete"      # 완료
    READY = "ready"            # 준비


class BaseWebSocketMessage(BaseModel):
    """WebSocket 메시지 기본 클래스"""
    type: WebSocketMessageType
    submission_uuid: str
    
    def to_json(self) -> str:
        """JSON 문자열로 변환"""
        return self.model_dump_json()


class ReadyMessage(BaseWebSocketMessage):
    type: WebSocketMessageType = WebSocketMessageType.READY
    message: str = Field(default="채점이 준비되었습니다.", description="준비 메시지")

class ProgressMessage(BaseWebSocketMessage):
    """진행 상황 메시지"""
    type: WebSocketMessageType = WebSocketMessageType.PROGRESS
    current: int = Field(..., description="현재 처리 중인 테스트케이스 번호")
    total: int = Field(..., description="전체 테스트케이스 수")
    message: str = Field(..., description="진행 메시지")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "progress",
                "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
                "current": 3,
                "total": 10,
                "message": "테스트케이스 3/10 처리 중..."
            }
        }


class TestCaseResult(BaseModel):
    """개별 테스트케이스 결과"""
    test_case_number: int
    status: str  # AC, WA, TLE, RE, MLE, CE
    input: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    execution_time: Optional[float] = None  # ms
    memory_usage: Optional[int] = None  # KB
    error_message: Optional[str] = None


class TestCaseMessage(BaseWebSocketMessage):
    """테스트케이스 결과 메시지"""
    type: WebSocketMessageType = WebSocketMessageType.TESTCASE
    result: TestCaseResult
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "testcase",
                "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
                "result": {
                    "test_case_number": 1,
                    "status": "AC",
                    "execution_time": 123.45,
                    "memory_usage": 2048
                }
            }
        }


class FinalResult(BaseModel):
    """최종 채점 결과"""
    status: str  # AC, WA, TLE, RE, MLE, CE, PE
    score: Optional[int] = None
    total_test_cases: int
    passed_test_cases: int
    failed_test_cases: int
    total_execution_time: Optional[float] = None  # ms
    max_memory_usage: Optional[int] = None  # KB
    message: str


class ResultMessage(BaseWebSocketMessage):
    """최종 결과 메시지"""
    type: WebSocketMessageType = WebSocketMessageType.RESULT
    result: FinalResult
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "result",
                "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
                "result": {
                    "status": "AC",
                    "score": 100,
                    "total_test_cases": 10,
                    "passed_test_cases": 10,
                    "failed_test_cases": 0,
                    "total_execution_time": 1234.56,
                    "max_memory_usage": 4096,
                    "message": "모든 테스트케이스를 통과했습니다"
                }
            }
        }


class ErrorMessage(BaseWebSocketMessage):
    """에러 메시지"""
    type: WebSocketMessageType = WebSocketMessageType.ERROR
    error: str = Field(..., description="에러 메시지")
    error_type: Optional[str] = Field(None, description="에러 타입")
    details: Optional[Dict[str, Any]] = Field(None, description="상세 정보")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "error",
                "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
                "error": "컴파일 에러가 발생했습니다",
                "error_type": "CompileError",
                "details": {
                    "line": 5,
                    "message": "SyntaxError: invalid syntax"
                }
            }
        }


class CompleteMessage(BaseWebSocketMessage):
    """완료 메시지"""
    type: WebSocketMessageType = WebSocketMessageType.COMPLETE
    message: str = Field(default="채점이 완료되었습니다", description="완료 메시지")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "complete",
                "submission_uuid": "550e8400-e29b-41d4-a716-446655440000",
                "message": "채점이 완료되었습니다"
            }
        }

