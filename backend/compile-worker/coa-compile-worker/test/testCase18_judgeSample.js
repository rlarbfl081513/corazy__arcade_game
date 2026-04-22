console.log("Test Case 18: Judge Mode - Sample Test Cases");

const amqp = require('amqplib/callback_api');
const config = require('./config');

amqp.connect(config.rabbitmq.url, function(error0, connection) {
  if (error0) {
    throw error0;
  }

  connection.createChannel(function(error1, channel) {
    if (error1)
      throw error1;

    var queue = config.rabbitmq.queue;
    channel.assertQueue(queue, {
      durable: false
    });

    // SAMPLE 모드 - Sample 테스트케이스 (사용자 입력으로 테스트)
    // 예시: A+B 문제 (1000번)
    const { v4: uuidv4 } = require('uuid');
    const jobData = {
      submission_uuid: uuidv4(),
      problem_id: 1000,
      mode: "SAMPLE",  // FastAPI 형식: SAMPLE
      code: `a, b = map(int, input().split())
print(a + b)`,
      language: "python",
      input: "1 2"  // SAMPLE 모드에서는 input 사용
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.submission_uuid);
    console.log(" [i] Mode: SAMPLE");
    console.log(" [i] Problem: 1000 (A+B)");
    console.log(" [i] Input: 1 2");
    console.log(" [i] Expected Output: 3");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

