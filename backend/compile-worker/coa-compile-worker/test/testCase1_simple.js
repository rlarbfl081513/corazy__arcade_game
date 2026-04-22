console.log("Test Case 1: Simple Output");

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

    // 5. 메시지 전송 (JSON 형식) - 간단한 출력 테스트
    const { v4: uuidv4 } = require('uuid');
    const jobData = {
      submission_uuid: uuidv4(),
      problem_id: 1,
      code: "console.log('Hello from Test Case 1');\nconsole.log('This is a simple test');",
      language: "javascript",
      mode: "SAMPLE",
      input: ""
    };
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.submission_uuid);
  })

  // 6. 연결 종료
  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});
