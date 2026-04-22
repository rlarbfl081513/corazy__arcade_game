"""
알고리즘 컴파일 라우터
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from app.schemas.algorithm import EnqueueRequest, EnqueueResponse
from app.services.queue_service import QueueService, get_queue_service
from app.services.websocket_service import WebSocketManager, get_websocket_manager
import uuid

router = APIRouter()


@router.post("/enqueue", response_model=EnqueueResponse)
async def enqueue_code(
    request: EnqueueRequest,
    queue_service: QueueService = Depends(get_queue_service)
):
    """
    코드 컴파일 작업을 큐에 추가
    
    - **submission_uuid**: 제출 UUID (선택사항, 테스트용)
    - **problem_id**: 문제 번호
    - **code**: 소스 코드
    - **language**: 프로그래밍 언어 (python, java, c, cpp, javascript)
    - **mode**: 실행 모드 (EVALUATE: 제출, SAMPLE: 테스트)
    - **input**: 테스트 입력 데이터 (SAMPLE 모드 전용)
    """
    try:
        # UUID 생성 (제공되지 않은 경우)
        submission_uuid = request.submission_uuid or str(uuid.uuid4())
        
        # RabbitMQ에 작업 추가
        await queue_service.enqueue_compile_job(submission_uuid, request)
        
        # 응답 반환
        return EnqueueResponse(
            submission_uuid=submission_uuid,
            status="queued",
            message="작업이 큐에 추가되었습니다"
        )
        
    except Exception as e:
        print(f"❌ Enqueue 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"작업 큐 추가 실패: {str(e)}"
        )


@router.websocket("/ws/{submission_uuid}")
async def websocket_endpoint(
    websocket: WebSocket,
    submission_uuid: str,
    ws_manager: WebSocketManager = Depends(get_websocket_manager)
):
    """
    실시간 채점 결과 수신용 WebSocket
    
    - **submission_uuid**: 제출 UUID
    
    연결 후 Redis Pub/Sub을 통해 Worker가 발행하는 채점 결과를 실시간으로 수신합니다.
    """
    try:
        await ws_manager.handle_connection(websocket, submission_uuid)
        
    except WebSocketDisconnect:
        print(f"⚠️ WebSocket 연결 끊김: {submission_uuid}")
        
    except Exception as e:
        print(f"❌ WebSocket 에러: {str(e)}")

