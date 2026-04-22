"""
WebSocket 연결 관리 서비스
"""
from fastapi import WebSocket
from typing import Dict, Any
from starlette.websockets import WebSocketDisconnect
from app.core.redis_pubsub import subscribe_channel, set_ready_flag


class WebSocketManager:
    """WebSocket 연결 및 메시지 관리"""
    
    async def handle_connection(
        self,
        websocket: WebSocket,
        submission_uuid: str
    ) -> None:
        """
        WebSocket 연결을 처리하고 Redis 메시지를 중계
        
        Args:
            websocket: WebSocket 연결 객체
            submission_uuid: 제출 UUID
        """
        # WebSocket 연결 수락
        await websocket.accept()
        print(f"✅ WebSocket 연결 수립: {submission_uuid}")
        
        try:
            # Redis 채널명 생성
            channel_name = f"compile:{submission_uuid}"

            # 준비 완료 메시지 전송
            await websocket.send_json({
                "type": "ready",
                "submission_uuid": submission_uuid,
                "message": "채점이 준비되었습니다."
            })

            # Redis에 준비 플래그 설정 (완료될 때까지 기다림)
            await set_ready_flag(submission_uuid)
            
            # Redis 채널 구독 및 메시지 전달
            async for message_data in subscribe_channel(channel_name):
                try:
                    # WebSocket으로 메시지 전송
                    await websocket.send_json(message_data)
                    print(f"📤 메시지 전송: {message_data.get('type')}")
                    
                    # 완료 메시지를 받으면 종료
                    if message_data.get('type') == 'complete':
                        break
                
                except WebSocketDisconnect:
                    print(f"⚠️ 클라이언트 연결 종료: {submission_uuid}")
                    break
                        
                except Exception as e:
                    print(f"❌ WebSocket 전송 에러: {str(e)}")
                    break
                    
        except Exception as e:
            print(f"❌ WebSocket 처리 에러: {str(e)}")
            # 에러 메시지 전송 시도
            try:
                await websocket.send_json({
                    "type": "error",
                    "submission_uuid": submission_uuid,
                    "error": str(e)
                })
            except:
                pass
                
        finally:
            # WebSocket 연결 종료
            try:
                await websocket.close()
                print(f"✅ WebSocket 연결 종료: {submission_uuid}")
            except:
                pass


# 의존성 주입용 인스턴스 생성 함수
async def get_websocket_manager() -> WebSocketManager:
    """WebSocketManager 인스턴스 반환 (FastAPI Dependency)"""
    return WebSocketManager()

