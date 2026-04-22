console.log("Test Case 13: C Language with Input");

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

    // C 언어 입력 처리 테스트
    const jobData = {
      jobId: "test-013",
      problemId: 13,
      mode: "run",
      code: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Sum: %d\\n", a + b);
    printf("Product: %d\\n", a * b);
    printf("Difference: %d\\n", a - b);
    return 0;
}`,
      language: "c",
      input: "20 8"
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
    console.log(" [i] Input: 20 8");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

