console.log("Test Case 14: Java with Input (Solution class)");

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

    // Java 입력 처리 테스트
    const jobData = {
      jobId: "test-014",
      problemId: 14,
      mode: "run",
      code: `import java.util.*;

class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        
        System.out.println("Sum: " + (a + b));
        System.out.println("Product: " + (a * b));
        System.out.println("Difference: " + (a - b));
        
        sc.close();
    }
}`,
      language: "java",
      input: "25 7"
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
    console.log(" [i] Input: 25 7");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

