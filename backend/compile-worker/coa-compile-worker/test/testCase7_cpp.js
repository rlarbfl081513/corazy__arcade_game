console.log("Test Case 7: C++ Language");

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

    // 5. 메시지 전송 (JSON 형식) - C++ 언어 테스트
    const jobData = {
      jobId: "test-007",
      problemId: 7,
      code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;

    // 간단한 계산
    int a = 10;
    int b = 20;
    cout << "Sum: " << (a + b) << endl;
    cout << "Product: " << (a * b) << endl;

    // STL vector 사용
    vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = 0;
    for(int num : numbers) {
        sum += num;
    }
    cout << "Vector sum: " << sum << endl;

    // STL algorithm 사용
    int maxNum = *max_element(numbers.begin(), numbers.end());
    cout << "Max number: " << maxNum << endl;

    return 0;
}`,
      language: "cpp"
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
