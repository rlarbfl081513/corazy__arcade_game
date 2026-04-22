const amqp = require("amqplib/callback_api.js");
const config = require("../config");
const { initializeRedis } = require("../utils/redisClient");
const { initializeS3 } = require("../utils/s3Client");
const { judgeCode, runCode } = require("../services/judgeService");
const { saveResult, saveJobStatus } = require("../services/resultService");
const { BaseError, ValidationError } = require("../error");

console.log("==========================================");
console.log("🚀 COA Compile Server Starting...");
console.log("==========================================\n");

// 초기화 함수
async function initialize() {
  try {
    // Redis 초기화
    if (config.redis.host) {
      try {
        await initializeRedis(config.redis);
      } catch (error) {
        console.warn('⚠️  Redis connection failed. Results will not be saved.', error.message);
      }
    }

    // S3 초기화
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      try {
        initializeS3(config.aws);
      } catch (error) {
        console.warn('⚠️  S3 initialization failed. Judge mode will not be available.', error.message);
      }
    } else {
      console.warn('⚠️  AWS credentials not found. Judge mode will not be available.');
    }

    console.log("✓ Initialization completed\n");
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
  }
}

// 메시지 처리 함수
async function processJob(jobData) {
  const {
    submission_uuid,
    problem_id,
    code,
    language,
    input = '',
    mode = 'EVALUATE', // 'EVALUATE' 또는 'SAMPLE'
    timeout,
    memoryLimit
  } = jobData;
  
  // FastAPI 메시지 형식을 Worker 내부 형식으로 매핑
  const jobId = submission_uuid;
  const problemId = problem_id;
  // SAMPLE과 EVALUATE 모두 S3 테스트케이스를 사용 (sample 폴더 vs evaluate 폴더)
  const workerMode = (mode === 'SAMPLE' || mode === 'EVALUATE') ? 'judge' : 'run';
  const workerType = mode === 'SAMPLE' ? 'sample' : 'evaluate';

  // 필수 필드 검증
  if (!submission_uuid) {
    throw ValidationError.missingField('submission_uuid');
  }
  if (!code) {
    throw ValidationError.missingField('code');
  }
  if (!language) {
    throw ValidationError.missingField('language');
  }
  if ((mode === 'EVALUATE' || mode === 'SAMPLE') && !problem_id) {
    throw ValidationError.missingField('problem_id');
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📨 [${new Date().toISOString()}] Job Received`);
  console.log(`   Submission UUID: ${submission_uuid}`);
  console.log(`   Mode: ${mode}`);
  if (problem_id) console.log(`   Problem ID: ${problem_id}`);
  console.log(`   Language: ${language}`);
  console.log(`   Code Length: ${code?.length || 0} chars`);
  console.log(`   Has Input: ${input ? 'Yes' : 'No'}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const startTime = Date.now();
  let result;

  try {
    // 작업 상태 저장: RUNNING
    await saveJobStatus(jobId, 'RUNNING', {
      mode: workerMode,
      problemId,
      language,
      startTime: Date.now()
    }).catch(err => console.warn('Failed to save job status:', err.message));

    // 실행 옵션 설정
    const options = {
      timeout: timeout || config.execution.timeout,
      memoryLimit: memoryLimit || config.execution.memoryLimit,
      cpuQuota: config.execution.cpuQuota,
      type: workerType, // 'sample' 또는 'evaluate'
      submissionUuid: submission_uuid // Pub/Sub용 UUID 전달
    };

    // 모드에 따라 처리
    if (workerMode === 'judge' && problemId) {
      // 채점 모드: S3에서 테스트케이스를 가져와 채점
      console.log(`\n🔍 Judge Mode (${workerType}): Running test cases...`);
      result = await judgeCode(code, language, problemId, options);
      
    } else {
      // 실행 모드: 단순 코드 실행
      console.log('\n▶️  Run Mode: Executing code...');
      result = await runCode(code, language, input, options);
    }

    const totalTime = Date.now() - startTime;

    // 결과 출력
    console.log("\n📊 Execution Result:");
    console.log(`   Status: ${result.status} (${result.message})`);
    console.log(`   Success: ${result.success}`);

    if (workerMode === 'judge') {
      console.log(`   Passed: ${result.passedCount}/${result.totalCount}`);
    } else {
      console.log(`   Execution Time: ${result.executionTime}ms`);
      console.log(`   Memory Used: ${result.memoryUsed}MB`);
    }
    
    console.log(`   Total Processing Time: ${totalTime}ms`);
    
    if (result.output && workerMode === 'run') {
      console.log("\n📤 Output:");
      console.log("   " + result.output.split('\n').join('\n   '));
    }
    
    if (result.error) {
      console.log("\n⚠️  Error:");
      console.log("   " + result.error.split('\n').join('\n   '));
    }

    // Redis에 결과 저장
    try {
      await saveResult(jobId, {
        ...result,
        mode: workerMode,
        totalProcessingTime: totalTime
      });
    } catch (error) {
      console.warn('⚠️  Failed to save result to Redis:', error.message);
    }

    // 작업 상태 저장: COMPLETED
    await saveJobStatus(jobId, 'COMPLETED', {
      status: result.status,
      success: result.success,
      completedAt: Date.now()
    }).catch(err => console.warn('Failed to save job status:', err.message));

    console.log("\n✅ Job completed successfully");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return { success: true, result };

  } catch (error) {
    console.error("\n❌ Error processing job:");
    console.error("   ", error.message);
    if (error instanceof BaseError) {
      console.error("   Error Type:", error.name);
      console.error("   Status:", error.status);
    }
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 에러 결과 저장 (커스텀 에러 정보 활용)
    const errorResult = {
      success: false,
      status: error.status || 'SE',
      message: error.message || '시스템 오류가 발생하였습니다.',
      error: error.message,
      mode: workerMode,
      ...(error instanceof BaseError ? { errorDetails: error.toJSON() } : {})
    };

    try {
      await saveResult(jobId, errorResult);
    } catch (saveError) {
      console.warn('⚠️  Failed to save error result:', saveError.message);
    }

    // 작업 상태 저장: FAILED
    await saveJobStatus(jobId, 'FAILED', {
      error: error.message,
      failedAt: Date.now()
    }).catch(err => console.warn('Failed to save job status:', err.message));

    return { success: false, error: error.message };
  }
}

// RabbitMQ 연결 및 시작
async function start() {
  // 초기화
  await initialize();

  const connectionString = config.rabbitmq.connectionString();
  console.log(`🔌 Connecting to RabbitMQ: ${config.rabbitmq.host}:${config.rabbitmq.port}`);

  // RabbitMQ 연결
  amqp.connect(connectionString, function (error0, connection) {
    if (error0) {
      console.error("❌ Failed to connect to RabbitMQ:", error0.message);
      process.exit(1);
    }

    console.log("✓ Connected to RabbitMQ");

    // 채널 생성
    connection.createChannel(function(error1, channel) {
      if (error1) {
        console.error("❌ Failed to create channel:", error1.message);
        process.exit(1);
      }

      console.log("✓ Channel created");

      const queue = config.rabbitmq.queue;
      
      // 큐 선언
      channel.assertQueue(queue, {
        durable: false
      });

      console.log("✓ Queue declared:", queue);
      
      // prefetch 설정: 동시 처리 가능한 작업 수
      const prefetchCount = parseInt(process.env.WORKER_PREFETCH) || 1;
      channel.prefetch(prefetchCount);
      console.log(`✓ Prefetch set to: ${prefetchCount} (concurrent jobs)\n`);
      
      console.log("👀 Waiting for messages...\n");

      // 메시지 수신
      channel.consume(queue, async function(msg) {
        if (!msg) return;

        let jobData;

        try {
          // 메시지 파싱
          jobData = JSON.parse(msg.content.toString());
          
          // 작업 처리
          await processJob(jobData);

          // ACK 전송 (메시지 처리 완료)
          channel.ack(msg);

        } catch (error) {
          console.error("\n❌ Fatal error processing message:");
          console.error("   ", error.message);
          
          // NACK 전송 (재시도하지 않음)
          channel.nack(msg, false, false);
        }
      }, {
        noAck: false  // 수동 ACK 모드
      });
    });

    // 종료 시그널 처리
    process.on('SIGINT', () => {
      console.log("\n\n⏹  Shutting down gracefully...");
      connection.close(() => {
        console.log("✓ Connection closed");
        process.exit(0);
      });
    });
  });
}

// 서버 시작
start().catch(error => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
