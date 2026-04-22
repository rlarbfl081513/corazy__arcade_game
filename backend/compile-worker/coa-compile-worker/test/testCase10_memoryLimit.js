console.log("Test Case 10: Memory Limit Test");

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

    // 메모리 많이 사용하는 코드 (메모리 제한 10MB로 설정)
    const jobData = {
      jobId: "test-010",
      problemId: 10,
      mode: "run",
      code: `const arr = [];
for (let i = 0; i < 10000000; i++) {
  arr.push(i);
}
console.log('Array length:', arr.length);`,
      language: "javascript",
      memoryLimit: 10  // 10MB 제한 (매우 낮게 설정)
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
    console.log(" [i] Memory limit set to 10MB (expected to exceed)");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

