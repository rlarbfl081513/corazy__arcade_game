"""
작업 큐 서비스
"""
from typing import Dict, Any
from app.core.rabbitmq import enqueue_job
from app.schemas.algorithm import EnqueueRequest


class QueueService:
    """작업 큐 관리 서비스"""
    
    async def enqueue_compile_job(
        self,
        submission_uuid: str,
        request: EnqueueRequest
    ) -> None:
        """
        컴파일 작업을 RabbitMQ 큐에 추가
        
        Args:
            submission_uuid: 생성된 제출 UUID
            request: 컴파일 요청 데이터
        """
        # 작업 데이터 구성
        job_data: Dict[str, Any] = {
            "submission_uuid": submission_uuid,
            "problem_id": request.problem_id,
            "code": request.code,
            "language": request.language.value,
            "mode": request.mode.value,
        }
        
        # 테스트 모드인 경우 입력 데이터 추가
        if request.input is not None:
            job_data["input"] = request.input
        
        # RabbitMQ에 작업 추가
        await enqueue_job(job_data)


# 의존성 주입용 인스턴스 생성 함수
async def get_queue_service() -> QueueService:
    """QueueService 인스턴스 반환 (FastAPI Dependency)"""
    return QueueService()

