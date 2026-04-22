console.log("Test Case 24: Performance Test - Sequential vs Concurrent");
console.log("==========================================================\n");

const amqp = require('amqplib/callback_api');
const config = require('./config');

const TEST_COUNT = 5;

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

    console.log(`🔬 Performance Test: ${TEST_COUNT} identical jobs\n`);
    console.log("Instructions:");
    console.log("1. Run with WORKER_PREFETCH=1 (sequential)");
    console.log("2. Note the total execution time");
    console.log("3. Run with WORKER_PREFETCH=5 (concurrent)");
    console.log("4. Compare the execution times\n");

    const startTime = Date.now();

    // 동일한 작업들을 여러 개 전송
    for (let i = 0; i < TEST_COUNT; i++) {
      const jobData = {
        jobId: `perf-test-${i+1}`,
        mode: "run",
        code: `
// 시간이 걸리는 작업 시뮬레이션
console.log('Performance test ${i+1} started at: ' + new Date().toISOString());

let result = 0;
for (let i = 0; i < 5000000; i++) {
  result += Math.sqrt(i);
}

console.log('Result: ' + result.toFixed(2));
console.log('Performance test ${i+1} completed at: ' + new Date().toISOString());
`,
        language: "javascript",
        timeout: 10000  // 10초 타임아웃
      };
      
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData)));
      console.log(`  📨 Sent: ${jobData.jobId}`);
    }

    const sendTime = Date.now() - startTime;
    
    console.log(`\n✅ All ${TEST_COUNT} jobs queued in ${sendTime}ms`);
    console.log("\n⏱️  Now measuring execution time...");
    console.log("   Check server logs for:");
    console.log("   - Individual job execution times");
    console.log("   - Start/End timestamps");
    console.log("   - Total processing time");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 1000);
});

