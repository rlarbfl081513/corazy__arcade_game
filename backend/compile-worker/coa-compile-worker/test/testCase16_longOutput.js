console.log("Test Case 16: Long Output Test");

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

    // 많은 출력을 생성하는 테스트
    const jobData = {
      jobId: "test-016",
      problemId: 16,
      mode: "run",
      code: `for i in range(1000):
    print(f"Line {i}: This is a test output line with some content")
print("Test completed")`,
      language: "python"
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
    console.log(" [i] Expected: 1000 lines of output");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

