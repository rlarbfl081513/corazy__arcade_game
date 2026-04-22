console.log("Test Case 15: Judge Mode (requires S3 setup)");

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

    // Judge 모드 테스트 (S3에 테스트케이스가 있어야 함)
    // 예시: A+B 문제
    const jobData = {
      jobId: "test-015",
      problemId: 1000,  // S3에 problems/1000/testcases.json이 있어야 함
      mode: "judge",
      code: `a, b = map(int, input().split())
print(a + b)`,
      language: "python"
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
    console.log(" [i] Mode: JUDGE");
    console.log(" [!] Note: This requires S3 bucket with test cases at:");
    console.log("     s3://bucket/problems/1000/testcases.json");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

