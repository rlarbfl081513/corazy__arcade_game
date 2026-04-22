console.log("Test Case 20: Judge Mode - Wrong Answer Test");

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

    // Judge 모드 - 틀린 답 (Wrong Answer)
    // A+B 문제인데 곱셈을 출력하는 코드
    const jobData = {
      jobId: "test-020",
      problemId: 1000,
      mode: "judge",
      type: "sample",
      code: `a, b = map(int, input().split())
print(a * b)  # 틀린 답: 곱셈 대신 덧셈을 해야 함`,
      language: "python"
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
    console.log(" [i] Mode: JUDGE (Sample)");
    console.log(" [i] Expected: Wrong Answer (WA)");
    console.log(" [i] Code outputs multiplication instead of addition");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

