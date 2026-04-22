console.log("Test Case 21: Judge Mode - Multiple Problems Test");

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

    console.log("\n=== Test 21-1: Problem 1000 (A+B) ===");
    const jobData1 = {
      jobId: "test-021-1",
      problemId: 1000,
      mode: "judge",
      type: "sample",
      code: `a, b = map(int, input().split())
print(a + b)`,
      language: "python"
    };
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData1)));
    console.log(" [x] Sent job: test-021-1 (Problem 1000)");

    setTimeout(() => {
      console.log("\n=== Test 21-2: Problem 1001 (A-B) ===");
      const jobData2 = {
        jobId: "test-021-2",
        problemId: 1001,
        mode: "judge",
        type: "evaluate",
        code: `a, b = map(int, input().split())
print(a - b)`,
        language: "python"
      };
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData2)));
      console.log(" [x] Sent job: test-021-2 (Problem 1001)");
    }, 1000);
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 2000);
});

