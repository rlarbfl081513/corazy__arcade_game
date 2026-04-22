console.log("Test Job Inserting");

// 1. amqplib 라이브러리 import
const amqp = require('amqplib/callback_api');
const config = require('./config');

// 2. RabbitMQ 연결
console.log(`Connecting to RabbitMQ: ${config.rabbitmq.host}:${config.rabbitmq.port}`);
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

    // 5. 메시지 전송 (JSON 형식) - FastAPI 형식에 맞게 수정
    const { v4: uuidv4 } = require('uuid');
    const jobData = {
      submission_uuid: uuidv4(),
      problem_id: 0,
      code: "console.log('Hello World');",
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