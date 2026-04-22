console.log("Test Case 12: Python with Input");

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

    // Python 입력 처리 테스트
    const jobData = {
      jobId: "test-012",
      problemId: 12,
      mode: "run",
      code: `# 두 수를 입력받아 연산
a = int(input())
b = int(input())
print(f"Sum: {a + b}")
print(f"Product: {a * b}")
print(f"Difference: {a - b}")`,
      language: "python",
      input: "15\n5"
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
    console.log(" [i] Input: 15, 5");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

