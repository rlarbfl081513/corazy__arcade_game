console.log("Test Case 4: Timeout (Infinite Loop)");

// 1. amqplib 라이브러리 import
const amqp = require('amqplib/callback_api');
const config = require('./config');

// 2. RabbitMQ 연결
amqp.connect(config.rabbitmq.url, function(error0, connection) {
  if (error0) {
    throw error0;
  }
  // 3. 채널 생성
  connection.createChannel(function(error1, channel) {
    if (error1)
      throw error1;

    // 4. 큐 선언
    var queue = config.rabbitmq.queue;
    channel.assertQueue(queue, {
      durable: false
    });

    // 5. 메시지 전송 (JSON 형식) - 타임아웃 테스트 (무한루프)
    const jobData = {
      jobId: "test-004",
      problemId: 4,
      code: `console.log('Starting infinite loop...');
let count = 0;
while(true) {
  count++;
  // 무한루프 - 타임아웃으로 강제 종료되어야 함
}
console.log('This will never print');`,
      language: "javascript",
      timeout: 3000  // 3초 타임아웃 (Docker 실행 시 처리 필요)
    };
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
  })

  // 6. 연결 종료
  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});
