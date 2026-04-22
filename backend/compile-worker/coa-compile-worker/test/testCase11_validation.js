console.log("Test Case 11: Validation Error Test");

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

    console.log("\n=== Test 11-1: Missing jobId ===");
    const jobData1 = {
      // jobId 누락
      problemId: 11,
      mode: "run",
      code: "console.log('test');",
      language: "javascript"
    };
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData1)));
    console.log(" [x] Sent job without jobId (should fail validation)");

    setTimeout(() => {
      console.log("\n=== Test 11-2: Missing code ===");
      const jobData2 = {
        jobId: "test-011-2",
        problemId: 11,
        mode: "run",
        // code 누락
        language: "javascript"
      };
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData2)));
      console.log(" [x] Sent job without code (should fail validation)");
    }, 1000);

    setTimeout(() => {
      console.log("\n=== Test 11-3: Invalid language ===");
      const jobData3 = {
        jobId: "test-011-3",
        problemId: 11,
        mode: "run",
        code: "print('test')",
        language: "ruby"  // 지원하지 않는 언어
      };
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData3)));
      console.log(" [x] Sent job with invalid language (should fail validation)");
    }, 2000);
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 3000);
});

