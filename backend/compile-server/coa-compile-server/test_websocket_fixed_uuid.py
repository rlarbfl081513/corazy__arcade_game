"""
WebSocket 테스트 - 고정 UUID 사용

이 스크립트는 고정된 UUID를 사용하여 WebSocket을 먼저 연결한 후 작업을 제출합니다.
이렇게 하면 모든 메시지를 실시간으로 받을 수 있습니다.

사용법:
    python test_websocket_fixed_uuid.py

또는 커스텀 UUID:
    python test_websocket_fixed_uuid.py custom-uuid-12345
"""

import asyncio
import json
import sys
import websockets
import aiohttp
from datetime import datetime


async def test_with_fixed_uuid(submission_uuid: str = "test-fixed-uuid-12345"):
    """고정된 UUID로 WebSocket 먼저 연결 후 작업 제출"""
    
    server_url = "http://localhost:8000"
    ws_url = "ws://localhost:8000"
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🔌 고정 UUID WebSocket 테스트")
    print(f"   Submission UUID: {submission_uuid}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    # WebSocket 연결
    uri = f"{ws_url}/api/algorithm/ws/{submission_uuid}"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"✅ WebSocket 연결 성공!")
            print(f"   메시지 대기 중...\n")
            
            # 연결 후 작업 제출
            print("📤 작업 제출 중...")
            
            job_data = {
                "submission_uuid": submission_uuid,  # 고정 UUID 전달
                "problem_id": 1000,
                "code": "print('Hello World from Fixed UUID Test!')",
                "language": "python",
                "mode": "SAMPLE",
                "input": ""
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{server_url}/api/algorithm/enqueue",
                    json=job_data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"✅ 작업 제출 완료: {result['status']}")
                        print(f"   반환된 UUID: {result['submission_uuid']}")
                        print()
                    else:
                        error = await response.text()
                        print(f"❌ 작업 제출 실패: {error}")
                        return False
            
            # 실시간 메시지 수신
            message_count = 0
            
            async for message in websocket:
                message_count += 1
                timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                
                try:
                    data = json.loads(message)
                    msg_type = data.get("type", "unknown")
                    
                    print(f"[{timestamp}] 📨 메시지 #{message_count}:")
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
                            print(f"   출력:\n{output}")
                            
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


async def test_evaluate_mode():
    """EVALUATE 모드 테스트 (S3 테스트케이스 필요)"""
    
    submission_uuid = "test-evaluate-uuid-99999"
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("📊 EVALUATE 모드 테스트")
    print(f"   Submission UUID: {submission_uuid}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    uri = f"ws://localhost:8000/api/algorithm/ws/{submission_uuid}"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket 연결 성공!\n")
            
            job_data = {
                "submission_uuid": submission_uuid,
                "problem_id": 1000,
                "code": "a, b = map(int, input().split())\nprint(a + b)",
                "language": "python",
                "mode": "EVALUATE",
                "input": ""  # EVALUATE 모드에서는 사용 안 함
            }
            
            print("📤 A+B 문제 제출 중...")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "http://localhost:8000/api/algorithm/enqueue",
                    json=job_data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"✅ 작업 제출 완료\n")
                    else:
                        print(f"❌ 작업 제출 실패")
                        return False
            
            # 메시지 수신 (위와 동일한 로직)
            async for message in websocket:
                data = json.loads(message)
                print(f"📨 {data['type']}: {data.get('message', data.get('result', {}))}")
                
                if data['type'] == 'complete':
                    print("\n✅ 채점 완료!")
                    break
                    
    except Exception as e:
        print(f"❌ 에러: {e}")
        return False
        
    return True


def main():
    """메인 함수"""
    
    # 커스텀 UUID 사용 가능
    if len(sys.argv) > 1:
        custom_uuid = sys.argv[1]
        print(f"📝 커스텀 UUID 사용: {custom_uuid}\n")
        asyncio.run(test_with_fixed_uuid(custom_uuid))
    else:
        # 기본 테스트
        print("🧪 테스트 1: SAMPLE 모드 (기본)\n")
        asyncio.run(test_with_fixed_uuid())
        
        # EVALUATE 모드 테스트 (선택사항)
        # print("\n" + "="*50 + "\n")
        # print("🧪 테스트 2: EVALUATE 모드 (S3 필요)\n")
        # asyncio.run(test_evaluate_mode())


if __name__ == "__main__":
    main()

