console.log("Test Case 23: Concurrency Test - Mixed Languages");
console.log("==================================================\n");

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

    console.log("📤 Sending mixed language jobs concurrently...\n");

    // 다양한 언어의 작업들
    const jobs = [
      {
        jobId: "mixed-js-1",
        language: "javascript",
        code: "console.log('JavaScript 1'); console.log(Array.from({length: 5}, (_, i) => i+1).reduce((a,b) => a+b, 0));"
      },
      {
        jobId: "mixed-py-1",
        language: "python",
        code: "print('Python 1')\nprint(sum(range(1, 6)))"
      },
      {
        jobId: "mixed-js-2",
        language: "javascript",
        code: "console.log('JavaScript 2'); console.log(Math.pow(2, 10));"
      },
      {
        jobId: "mixed-c-1",
        language: "c",
        code: `#include <stdio.h>
int main() {
    printf("C Program 1\\n");
    int sum = 0;
    for(int i = 1; i <= 10; i++) sum += i;
    printf("Sum: %d\\n", sum);
    return 0;
}`
      },
      {
        jobId: "mixed-py-2",
        language: "python",
        code: "import math\nprint('Python 2')\nprint(f'Pi: {math.pi:.2f}')"
      },
      {
        jobId: "mixed-cpp-1",
        language: "cpp",
        code: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    cout << "C++ Program 1" << endl;
    vector<int> v = {1,2,3,4,5};
    int sum = 0;
    for(int n : v) sum += n;
    cout << "Sum: " << sum << endl;
    return 0;
}`
      },
      {
        jobId: "mixed-js-3",
        language: "javascript",
        code: "console.log('JavaScript 3'); console.log([1,2,3,4,5].map(x => x*x));"
      },
      {
        jobId: "mixed-py-3",
        language: "python",
        code: "print('Python 3')\nprint([x**2 for x in range(1, 6)])"
      }
    ];

    const startTime = Date.now();

    // 모든 작업을 동시에 전송
    jobs.forEach((job, index) => {
      const jobData = {
        ...job,
        mode: "run"
      };
      
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData)));
      console.log(`  ${index + 1}. [${job.language.toUpperCase()}] ${job.jobId}`);
    });

    const sendTime = Date.now() - startTime;
    console.log(`\n✅ All ${jobs.length} jobs sent in ${sendTime}ms`);
    console.log("\n📊 Mixed languages test - check execution order in logs");
    console.log("   Different languages may finish at different times");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 1000);
});

