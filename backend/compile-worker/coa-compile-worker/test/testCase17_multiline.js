console.log("Test Case 17: Multi-line Input Test");

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

    // 여러 줄 입력 처리 테스트
    const jobData = {
      jobId: "test-017",
      problemId: 17,
      mode: "run",
      code: `n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

print(f"Count: {len(numbers)}")
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers) / len(numbers):.2f}")
print(f"Max: {max(numbers)}")
print(f"Min: {min(numbers)}")`,
      language: "python",
      input: "5\n10\n20\n30\n40\n50"
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
    console.log(" [i] Input: 5 numbers (10, 20, 30, 40, 50)");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

