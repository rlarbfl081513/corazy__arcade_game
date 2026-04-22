console.log("Test Case 25: Memory Monitoring Test");
console.log("=====================================\n");

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

    console.log("📊 Testing memory monitoring functionality\n");
    console.log("Expected: MemoryUsed should be a number (not NaN)\n");

    // 테스트 케이스들
    const tests = [
      {
        name: "Low memory (simple)",
        jobData: {
          jobId: "mem-test-1",
          mode: "run",
          code: "console.log('Hello');",
          language: "javascript"
        },
        expected: "MemoryUsed: 10-30 MB"
      },
      {
        name: "Medium memory (array)",
        jobData: {
          jobId: "mem-test-2",
          mode: "run",
          code: `
const arr = [];
for (let i = 0; i < 1000000; i++) {
  arr.push(i);
}
console.log('Array length:', arr.length);
`,
          language: "javascript"
        },
        expected: "MemoryUsed: 30-80 MB"
      },
      {
        name: "High memory (large string)",
        jobData: {
          jobId: "mem-test-3",
          mode: "run",
          code: `
let str = '';
for (let i = 0; i < 1000000; i++) {
  str += 'x';
}
console.log('String length:', str.length);
`,
          language: "javascript"
        },
        expected: "MemoryUsed: 50-150 MB"
      },
      {
        name: "Python memory test",
        jobData: {
          jobId: "mem-test-4",
          mode: "run",
          code: `
data = [i ** 2 for i in range(100000)]
print(f'List length: {len(data)}')
`,
          language: "python"
        },
        expected: "MemoryUsed: 15-50 MB"
      }
    ];

    console.log(`📤 Sending ${tests.length} memory test jobs...\n`);

    tests.forEach((test, index) => {
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(test.jobData)));
      console.log(`  ${index + 1}. ${test.name}`);
      console.log(`     Expected: ${test.expected}`);
      console.log(`     JobId: ${test.jobData.jobId}\n`);
    });

    console.log("✅ All test jobs sent");
    console.log("\n📋 Check server logs for:");
    console.log("   - MemoryUsed should be a NUMBER (not NaN)");
    console.log("   - MemoryUsed should vary by workload");
    console.log("   - Higher memory usage for larger data structures");
    console.log("\n⚠️  If MemoryUsed is 0 or very low:");
    console.log("   - Execution time might be < 100ms (too fast to sample)");
    console.log("   - This is normal for very simple operations");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 1000);
});

