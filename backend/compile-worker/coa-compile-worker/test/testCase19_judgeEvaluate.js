console.log("Test Case 19: Judge Mode - Evaluate Test Cases");

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

    // Judge 모드 - Evaluate 테스트케이스 (S3에서 .in, .ans 파일 읽기)
    // 예시: A+B 문제 (1000번)
    const { v4: uuidv4 } = require('uuid');
    const jobData = {
      submission_uuid: uuidv4(),
      problem_id: 1000,
      mode: "EVALUATE",  // FastAPI 형식: EVALUATE
      code: `a, b = map(int, input().split())
print(a + b)`,
      language: "python",
      input: ""  // EVALUATE 모드에서는 사용하지 않음
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.submission_uuid);
    console.log(" [i] Mode: EVALUATE");
    console.log(" [i] Problem: 1000 (A+B)");
    console.log(" [!] Note: This requires S3 bucket with test cases at:");
    console.log("     s3://bucket/problems/1000/evaluate/1.in");
    console.log("     s3://bucket/problems/1000/evaluate/1.ans");
    console.log("     ... (multiple test cases)");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

