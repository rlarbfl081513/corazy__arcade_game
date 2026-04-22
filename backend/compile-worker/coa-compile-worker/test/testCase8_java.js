console.log("Test Case 8: Java Language (Solution class)");

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

    // 5. 메시지 전송 (JSON 형식) - Java 언어 테스트 (Solution 클래스)
    const jobData = {
      jobId: "test-008",
      problemId: 8,
      code: `import java.util.*;

class Solution {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");

        // 간단한 계산
        int a = 10;
        int b = 20;
        System.out.println("Sum: " + (a + b));
        System.out.println("Product: " + (a * b));

        // ArrayList 사용
        List<Integer> numbers = new ArrayList<>();
        numbers.add(1);
        numbers.add(2);
        numbers.add(3);
        numbers.add(4);
        numbers.add(5);

        int sum = 0;
        for(int num : numbers) {
            sum += num;
        }
        System.out.println("List sum: " + sum);

        // Collections 사용
        int max = Collections.max(numbers);
        System.out.println("Max number: " + max);
    }
}`,
      language: "java"
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
