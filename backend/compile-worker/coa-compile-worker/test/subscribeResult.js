/**
 * Redis Pub/Sub 구독 테스트 스크립트
 * 
 * 실시간으로 특정 submission_uuid의 채점 결과를 구독합니다.
 * 
 * 사용법:
 *   node subscribeResult.js <submission_uuid>
 * 
 * 예시:
 *   node subscribeResult.js 550e8400-e29b-41d4-a716-446655440000
 */

const redis = require('redis');
const config = require('./config');

// 명령줄 인자에서 submission_uuid 가져오기
const submissionUuid = process.argv[2];

if (!submissionUuid) {
  console.error('❌ Error: submission_uuid가 필요합니다.');
  console.log('사용법: node subscribeResult.js <submission_uuid>');
  process.exit(1);
}

const channel = `compile:${submissionUuid}`;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📡 Redis Pub/Sub 구독 시작');
console.log(`   Channel: ${channel}`);
console.log(`   Submission UUID: ${submissionUuid}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Redis Subscriber 클라이언트 생성
const subscriber = redis.createClient({
  socket: {
    host: config.redis.host || 'localhost',
    port: config.redis.port || 6379
  }
});

subscriber.on('error', (err) => {
  console.error('❌ Redis Subscriber Error:', err);
});

// 메시지 수신 핸들러
subscriber.on('message', (receivedChannel, message) => {
  try {
    const data = JSON.parse(message);
    const timestamp = new Date().toISOString();
    
    console.log(`\n[${timestamp}] 📨 메시지 수신:`);
    console.log(`   타입: ${data.type}`);
    
    switch (data.type) {
      case 'progress':
        console.log(`   진행: ${data.current}/${data.total}`);
        console.log(`   메시지: ${data.message}`);
        console.log('   ⏳ 진행 중...');
        break;
        
      case 'testcase':
        console.log(`   테스트케이스 #${data.result.test_case_number}: ${data.result.status}`);
        console.log(`   실행 시간: ${data.result.execution_time}ms`);
        console.log(`   메모리: ${data.result.memory_usage}MB`);
        if (data.result.error_message) {
          console.log(`   에러: ${data.result.error_message}`);
        }
        break;
        
      case 'result':
        console.log('   📊 최종 결과:');
        console.log(`   상태: ${data.result.status}`);
        if (data.result.score !== undefined) {
          console.log(`   점수: ${data.result.score}점`);
          console.log(`   통과: ${data.result.passed_test_cases}/${data.result.total_test_cases}`);
        }
        if (data.result.output !== undefined) {
          console.log(`   출력: ${data.result.output}`);
        }
        console.log(`   메시지: ${data.result.message}`);
        break;
        
      case 'error':
        console.log('   ❌ 에러 발생:');
        console.log(`   타입: ${data.error_type}`);
        console.log(`   메시지: ${data.error}`);
        if (data.details) {
          console.log(`   상세: ${JSON.stringify(data.details)}`);
        }
        break;
        
      case 'complete':
        console.log('   ✅ 완료:');
        console.log(`   메시지: ${data.message}`);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ 채점이 완료되었습니다.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // 완료 메시지를 받으면 구독 종료
        setTimeout(() => {
          subscriber.unsubscribe();
          subscriber.quit();
          process.exit(0);
        }, 1000);
        break;
        
      default:
        console.log(`   알 수 없는 메시지 타입: ${data.type}`);
        console.log(`   데이터: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.error('❌ 메시지 파싱 에러:', error.message);
    console.log('   원본 메시지:', message);
  }
});

// Redis 연결 및 구독 시작
(async () => {
  try {
    await subscriber.connect();
    console.log('✅ Redis에 연결되었습니다.');
    
    await subscriber.subscribe(channel, (message) => {
      subscriber.emit('message', channel, message);
    });
    
    console.log(`✅ 채널 '${channel}'을 구독하기 시작했습니다.`);
    console.log('   메시지를 기다리는 중...\n');
    
  } catch (error) {
    console.error('❌ 구독 실패:', error);
    process.exit(1);
  }
})();

// Ctrl+C로 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n\n🛑 구독을 종료합니다...');
  subscriber.unsubscribe();
  subscriber.quit();
  process.exit(0);
});

