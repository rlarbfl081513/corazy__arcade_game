console.log("Test Case 9: Compile Error (C++)");

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

    // 컴파일 에러 테스트 - 세미콜론 누락
    const jobData = {
      jobId: "test-009",
      problemId: 9,
      mode: "run",
      code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl  // 세미콜론 누락 - 컴파일 에러
    return 0;
}`,
      language: "cpp"
    };
    
    var msg = JSON.stringify(jobData);
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent job:", jobData.jobId);
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 500);
});

