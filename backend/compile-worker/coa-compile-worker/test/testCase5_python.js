console.log("Test Case 5: Python Code");

// 1. amqplib 라이브러리 import
const amqp = require('amqplib/callback_api');
const config = require('./config');

// 2. RabbitMQ 연결
amqp.connect(config.rabbitmq.url, function(error0, connection) {
  if (error0) {
    throw error0;
  }
  // 3. 채널 생성
  connection.createChannel(function(error1, channel) {
    if (error1)
      throw error1;

    // 4. 큐 선언
    var queue = config.rabbitmq.queue;
    channel.assertQueue(queue, {
      durable: false
    });

    // 5. 메시지 전송 (JSON 형식) - Python 코드 테스트
    const jobData = {
      jobId: "test-005",
      problemId: 5,
      code: `print("Hello from Python!")
# 간단한 계산
a = 10
b = 20
print(f"Sum: {a + b}")
print(f"Product: {a * b}")

# 리스트 처리
numbers = [1, 2, 3, 4, 5]
print("Numbers:", numbers)
print("Sum of numbers:", sum(numbers))`,
      language: "python"
    };
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
  })

  // 6. 연결 종료
  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});
