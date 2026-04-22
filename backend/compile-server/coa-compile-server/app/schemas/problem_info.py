"""
문제 상세 정보 스키마 (S3 JSON)
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any


class ProblemInfoData(BaseModel):
    """info.json 데이터 구조"""
    problemId: int = Field(..., description="문제 번호", alias="problemId")
    title: str = Field(..., description="문제 제목")
    description: str = Field(..., description="문제 설명 (Latex 및 이미지 포함 가능)")
    inputDescription: Optional[str] = Field(None, description="입력 형식 설명 (Latex 및 이미지 포함 가능)")
    outputDescription: Optional[str] = Field(None, description="출력 형식 설명 (Latex 및 이미지 포함 가능)")
    inputLimit: Optional[str] = Field(None, description="입력 값 제한 사항")
    outputLimit: Optional[str] = Field(None, description="출력 값 제한 사항")
    timeLimit: int = Field(..., description="시간 제한 (ms)")
    memoryLimit: int = Field(..., description="메모리 제한 (MB)")
    difficulty: Optional[str] = Field(None, description="난이도 (예: Bronze V, Silver III)")
    images: Optional[List[str]] = Field(default_factory=list, description="사용된 이미지 파일 목록")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "problemId": 1000,
                "title": "A+B",
                "description": "두 정수 $A$와 $B$를 입력받은 다음, $A+B$를 출력하는 프로그램을 작성하시오.\n\n[image:figure1.png]",
                "inputDescription": "첫째 줄에 $A$와 $B$가 주어진다.",
                "outputDescription": "첫째 줄에 $A+B$를 출력한다.",
                "inputLimit": "$-10000 \\leq A, B \\leq 10000$",
                "outputLimit": "정수 형태로 출력",
                "timeLimit": 2000,
                "memoryLimit": 256,
                "difficulty": "Bronze V",
                "images": ["figure1.png"]
            }
        }


class TestCase(BaseModel):
    """개별 테스트케이스"""
    input: str = Field(..., description="입력 데이터")
    output: str = Field(..., description="예상 출력")

    class Config:
        json_schema_extra = {
            "example": {
                "input": "1 2",
                "output": "3"
            }
        }


class TestCaseData(BaseModel):
    """testcases.json 데이터 구조"""
    problemId: int = Field(..., description="문제 번호")
    title: str = Field(..., description="문제 제목")
    description: str = Field(..., description="문제 설명 (Latex 및 이미지 포함 가능)")
    timeLimit: int = Field(..., description="시간 제한 (ms)")
    memoryLimit: int = Field(..., description="메모리 제한 (MB)")
    testCases: List[TestCase] = Field(..., description="테스트케이스 목록")
    images: Optional[List[str]] = Field(default_factory=list, description="사용된 이미지 파일 목록")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "problemId": 1000,
                "title": "A+B",
                "description": "두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.",
                "timeLimit": 2000,
                "memoryLimit": 256,
                "testCases": [
                    {
                        "input": "1 2",
                        "output": "3"
                    },
                    {
                        "input": "5 10",
                        "output": "15"
                    },
                    {
                        "input": "0 0",
                        "output": "0"
                    }
                ],
                "images": []
            }
        }


class ProblemDetailResponse(BaseModel):
    """문제 상세 정보 응답 (info + testcases 통합)"""
    info: ProblemInfoData = Field(..., description="문제 기본 정보 (info.json)")
    testcases: TestCaseData = Field(..., description="테스트케이스 정보 (testcases.json)")

    class Config:
        json_schema_extra = {
            "example": {
                "info": {
                    "problemId": 1000,
                    "title": "A+B",
                    "description": "두 정수 $A$와 $B$를 입력받은 다음, $A+B$를 출력하는 프로그램을 작성하시오.\n\n[image:figure1.png]",
                    "inputDescription": "첫째 줄에 $A$와 $B$가 주어진다.",
                    "outputDescription": "첫째 줄에 $A+B$를 출력한다.",
                    "inputLimit": "$-10000 \\leq A, B \\leq 10000$",
                    "outputLimit": "정수 형태로 출력",
                    "timeLimit": 2000,
                    "memoryLimit": 256,
                    "difficulty": "Bronze V",
                    "images": ["figure1.png"]
                },
                "testcases": {
                    "problemId": 1000,
                    "title": "A+B",
                    "description": "두 정수 A와 B를 입력받은 다음, A+B를 출력하는 프로그램을 작성하시오.",
                    "timeLimit": 2000,
                    "memoryLimit": 256,
                    "testCases": [
                        {
                            "input": "1 2",
                            "output": "3"
                        },
                        {
                            "input": "5 10",
                            "output": "15"
                        }
                    ],
                    "images": []
                }
            }
        }
