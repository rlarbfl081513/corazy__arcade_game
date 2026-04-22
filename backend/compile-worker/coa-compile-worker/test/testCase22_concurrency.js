console.log("Test Case 22: Concurrency Test - Multiple Jobs");
console.log("================================================\n");

const amqp = require('amqplib/callback_api');
const config = require('./config');

// 동시에 보낼 작업 수
const CONCURRENT_JOBS = 10;

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

    console.log(`📤 Sending ${CONCURRENT_JOBS} jobs simultaneously...\n`);
    const startTime = Date.now();

    // 여러 작업을 동시에 전송
    for (let i = 0; i < CONCURRENT_JOBS; i++) {
      const jobData = {
        jobId: `concurrent-${i+1}`,
        mode: "run",
        code: `
const jobId = ${i+1};
console.log('Job ' + jobId + ' started');

// 약간의 처리 시간 시뮬레이션
let sum = 0;
for (let i = 0; i < 1000000; i++) {
  sum += i;
}

console.log('Job ' + jobId + ' completed. Sum: ' + sum);
`,
        language: "javascript"
      };
      
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(jobData)));
      console.log(`  ✓ Sent job ${i+1}/${CONCURRENT_JOBS}: ${jobData.jobId}`);
    }

    const sendTime = Date.now() - startTime;
    console.log(`\n✅ All ${CONCURRENT_JOBS} jobs sent in ${sendTime}ms`);
    console.log("\n📊 Check server logs to see concurrent execution");
    console.log("   - With WORKER_PREFETCH=1: Jobs run sequentially");
    console.log("   - With WORKER_PREFETCH=5: Up to 5 jobs run concurrently");
  })

  setTimeout(function() {
    connection.close();
    process.exit(0)
  }, 1000);
});

