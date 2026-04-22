"""
FastAPI WebSocket 통합 테스트

이 스크립트는 FastAPI 서버의 WebSocket 기능을 테스트합니다.

사용법:
    python test_websocket.py <submission_uuid>
    
예시:
    python test_websocket.py 550e8400-e29b-41d4-a716-446655440000
"""

import asyncio
import json
import sys
import websockets
from datetime import datetime


async def test_websocket(submission_uuid: str, server_url: str = "ws://localhost:8000"):
    """WebSocket 연결을 테스트하고 메시지를 수신합니다."""
    
    uri = f"{server_url}/api/algorithm/ws/{submission_uuid}"
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🔌 FastAPI WebSocket 연결 테스트")
    print(f"   URI: {uri}")
    print(f"   Submission UUID: {submission_uuid}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"✅ WebSocket 연결 성공!")
            print(f"   메시지를 기다리는 중...\n")
            
            message_count = 0
            
            async for message in websocket:
                message_count += 1
                timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                
                try:
                    data = json.loads(message)
                    msg_type = data.get("type", "unknown")
                    
                    print(f"[{timestamp}] 📨 메시지 #{message_count} 수신:")
                    print(f"   타입: {msg_type}")
                    
                    if msg_type == "progress":
                        current = data.get("current", 0)
                        total = data.get("total", 0)
                        msg = data.get("message", "")
                        print(f"   진행: {current}/{total}")
                        print(f"   메시지: {msg}")
                        print("   ⏳ 진행 중...")
                        
                    elif msg_type == "testcase":
                        result = data.get("result", {})
                        tc_num = result.get("test_case_number", 0)
                        status = result.get("status", "")
                        exec_time = result.get("execution_time", 0)
                        memory = result.get("memory_usage", 0)
                        
                        print(f"   테스트케이스 #{tc_num}: {status}")
                        print(f"   실행 시간: {exec_time}ms")
                        print(f"   메모리: {memory}MB")
                        
                        if result.get("error_message"):
                            print(f"   에러: {result['error_message']}")
                            
                    elif msg_type == "result":
                        result = data.get("result", {})
                        status = result.get("status", "")
                        
                        print("   📊 최종 결과:")
                        print(f"   상태: {status}")
                        
                        if "score" in result:
                            score = result.get("score", 0)
                            passed = result.get("passed_test_cases", 0)
                            total_tc = result.get("total_test_cases", 0)
                            print(f"   점수: {score}점")
                            print(f"   통과: {passed}/{total_tc}")
                            
                        if "output" in result:
                            output = result.get("output", "")
                            print(f"   출력: {output}")
                            
                        message_text = result.get("message", "")
                        print(f"   메시지: {message_text}")
                        
                    elif msg_type == "error":
                        error = data.get("error", "")
                        error_type = data.get("error_type", "")
                        details = data.get("details", {})
                        
                        print("   ❌ 에러 발생:")
                        print(f"   타입: {error_type}")
                        print(f"   메시지: {error}")
                        if details:
                            print(f"   상세: {json.dumps(details, indent=2)}")
                            
                    elif msg_type == "complete":
                        message_text = data.get("message", "")
                        print("   ✅ 완료:")
                        print(f"   메시지: {message_text}")
                        print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                        print("✨ 채점이 완료되었습니다.")
                        print(f"   총 수신 메시지: {message_count}개")
                        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
                        break
                        
                    else:
                        print(f"   알 수 없는 메시지 타입: {msg_type}")
                        print(f"   데이터: {json.dumps(data, indent=2)}")
                    
                    print()  # 빈 줄
                    
                except json.JSONDecodeError as e:
                    print(f"   ❌ JSON 파싱 에러: {e}")
                    print(f"   원본 메시지: {message}")
                    print()
                    
    except websockets.exceptions.WebSocketException as e:
        print(f"\n❌ WebSocket 에러: {e}")
        return False
        
    except KeyboardInterrupt:
        print("\n\n🛑 사용자에 의해 중단되었습니다.")
        return False
        
    except Exception as e:
        print(f"\n❌ 예상치 못한 에러: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    return True


def main():
    """메인 함수"""
    
    if len(sys.argv) < 2:
        print("❌ Error: submission_uuid가 필요합니다.")
        print("사용법: python test_websocket.py <submission_uuid> [server_url]")
        print("예시: python test_websocket.py 550e8400-e29b-41d4-a716-446655440000")
        sys.exit(1)
    
    submission_uuid = sys.argv[1]
    server_url = sys.argv[2] if len(sys.argv) > 2 else "ws://localhost:8000"
    
    # 이벤트 루프 실행
    asyncio.run(test_websocket(submission_uuid, server_url))


if __name__ == "__main__":
    main()

