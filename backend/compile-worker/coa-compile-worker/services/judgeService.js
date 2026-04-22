const {
  compileCode,
  createExecutor,
  runInExecutor,
  executeCode,
} = require("./dockerSandbox");
const { getTestCases } = require("./s3Service");
const { SystemError, ValidationError } = require("../error");
const {
  publishProgress,
  publishTestCase,
  publishTestCaseBatch, // 추가
  publishResult,
  publishComplete,
  publishError,
} = require("./pubsubService");
const { waitForWebSocketReady } = require("../utils/redisClient");
const { cleanupTempDir } = require("../utils/manageFiles");

const BATCH_SIZE = 10; // 10개의 결과가 모이면 전송
const BATCH_INTERVAL = 200; // 마지막 전송 후 200ms가 지나면 전송

/**
 * 일괄 전송을 위한 헬퍼 함수
 */
function createBatchPublisher(submissionUuid) {
  let resultsBuffer = [];
  let progressBuffer = { i: 0, total: 0 };
  let lastPublishTime = Date.now();
  let throttleTimeout = null;

  const flush = async () => {
    if (throttleTimeout) {
      clearTimeout(throttleTimeout);
      throttleTimeout = null;
    }

    if (resultsBuffer.length > 0) {
      await publishTestCaseBatch(submissionUuid, resultsBuffer); // 수정
      resultsBuffer = [];
    }
    
    await publishProgress(
      submissionUuid,
      progressBuffer.i,
      progressBuffer.total,
      `테스트케이스 ${progressBuffer.i}/${progressBuffer.total} 처리 완료`
    );
    lastPublishTime = Date.now();
  };

  return {
    add: async (result, i, total) => {
      resultsBuffer.push(result);
      progressBuffer = { i, total };

      if (resultsBuffer.length >= BATCH_SIZE) {
        await flush();
      } else {
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(flush, BATCH_INTERVAL);
      }
    },
    flushRemaining: async () => {
      await flush();
    },
  };
}


/**
 * 출력 비교 (정확한 매칭)
 */
function compareOutput(output, expected) {
  const normalizedOutput = output.trim().replace(/\r\n/g, "\n");
  const normalizedExpected = expected.trim().replace(/\r\n/g, "\n");
  return normalizedOutput === normalizedExpected;
}

/**
 * 출력 비교 (공백 무시)
 */
function compareOutputIgnoreSpaces(output, expected) {
  const normalizedOutput = output.replace(/\s+/g, "");
  const normalizedExpected = expected.replace(/\s+/g, "");
  return normalizedOutput === normalizedExpected;
}

/**
 * 코드 채점 (모든 테스트케이스 실행)
 */
async function judgeCode(code, language, problemId, customOptions = {}) {
  const startTime = Date.now();
  const submissionUuid = customOptions.submissionUuid;
  let compileDir = null;
  let executor = null;

  try {
    // 1. 컴파일 단계
    const compileResult = await compileCode(code, language, customOptions);
    compileDir = compileResult.compileDir;

    // 2. 테스트케이스 로딩
    const judgeType = customOptions.type || "evaluate";
    const testData = await getTestCases(problemId, judgeType);
    if (!testData.testCases || testData.testCases.length === 0) {
      throw new ValidationError("testCases", "No test cases found");
    }

    // 3. 실행 옵션 및 실행기 생성
    const options = {
      timeout: customOptions.timeout || testData.timeLimit || 5000,
      memoryLimit: customOptions.memoryLimit || testData.memoryLimit || 256,
      cpuQuota: customOptions.cpuQuota || 50000,
      networkDisabled: true,
    };
    executor = await createExecutor(language, compileDir, options);

    // 비동기 메모리 측정을 위한 스트림 시작
    let maxMemoryUsed = 0;
    let statsStream = null;
    if (submissionUuid) {
      statsStream = await executor.stats({ stream: true });
      statsStream.on('data', (chunk) => {
        const stats = JSON.parse(chunk.toString('utf8'));
        if (stats.memory_stats && stats.memory_stats.max_usage) {
          const currentMemory = Math.round(stats.memory_stats.max_usage / 1024 / 1024);
          if (currentMemory > maxMemoryUsed) {
            maxMemoryUsed = currentMemory;
          }
        }
      });
    }

    // await waitForWebSocketReady(submissionUuid); // 클라이언트 준비를 기다리지 않고 즉시 시작
    const totalTestCases = testData.testCases.length;
    await publishProgress(submissionUuid, 0, totalTestCases, "채점 시작");

    // 4. 실행 단계 (테스트케이스 반복)
    const results = [];
    let allPassed = true;
    let firstFailedIndex = -1;

    const batchPublisher = submissionUuid ? createBatchPublisher(submissionUuid) : null;

    for (let i = 0; i < totalTestCases; i++) {
      const testCase = testData.testCases[i];
      const execResult = await runInExecutor(
        executor,
        language,
        testCase.input || "",
        { ...options, skipMemoryCheck: true } // 메모리 측정을 건너뜀
      );

      const passed = compareOutput(execResult.output, testCase.output);
      const testResult = {
        passed,
        status: passed ? "AC" : execResult.status,
        message: passed ? "정답입니다." : execResult.message,
        output: execResult.output,
        expectedOutput: testCase.output,
        executionTime: execResult.executionTime,
        memoryUsed: execResult.memoryUsed,
        error: execResult.error,
      };

      results.push({
        testCaseNumber: testCase.number,
        ...testResult,
      });

      if (batchPublisher) {
        const testCaseResultForPublish = {
          test_case_number: testCase.number,
          status: testResult.status,
          execution_time: testResult.executionTime,
          memory_usage: testResult.memoryUsed,
          error_message: testResult.error || null,
        };
        if (judgeType === "sample") {
          testCaseResultForPublish.input = testCase.input;
          testCaseResultForPublish.expected_output = testCase.output;
          testCaseResultForPublish.actual_output = testResult.output;
        }
        await batchPublisher.add(testCaseResultForPublish, i + 1, totalTestCases);
      }

      if (!testResult.passed) {
        allPassed = false;
        if (firstFailedIndex === -1) firstFailedIndex = i;
        if (judgeType === "evaluate") break;
      }
    }

    if (batchPublisher) {
      await batchPublisher.flushRemaining();
    }

    const totalTime = Date.now() - startTime;
    const passedCount = results.filter((r) => r.passed).length;
    let finalStatus = "AC";
    let finalMessage = "모든 테스트케이스를 통과하였습니다.";
    if (!allPassed) {
      const firstFailed = results[firstFailedIndex];
      finalStatus = firstFailed.status;
      finalMessage = firstFailed.message;
    }

    if (submissionUuid) {
      // 스트림으로 측정한 최대 메모리 사용량으로 대체
      await publishResult(submissionUuid, {
        status: finalStatus,
        score: Math.round((passedCount / totalTestCases) * 100),
        total_test_cases: totalTestCases,
        passed_test_cases: passedCount,
        failed_test_cases: totalTestCases - passedCount,
        total_execution_time: totalTime,
        max_memory_usage: maxMemoryUsed,
        message: `${passedCount}/${totalTestCases} 테스트케이스 통과`,
      });
      await publishComplete(submissionUuid, "채점이 완료되었습니다");
    }

    return {
      success: allPassed,
      status: finalStatus,
      message: finalMessage,
      problemId,
      language,
      judgeType,
      passedCount,
      totalCount: totalTestCases,
      totalExecutionTime: totalTime,
      testResults: results,
    };
  } catch (error) {
    const errorStatus = error.status || "SE";
    const errorMessage = error.message || "채점 중 오류가 발생하였습니다.";
    if (submissionUuid) {
      await publishError(
        submissionUuid,
        errorMessage,
        error.name || "SystemError",
        { problemId, language }
      );
      await publishComplete(submissionUuid, "채점이 중단되었습니다");
    }
    return {
      success: false,
      status: errorStatus,
      message: errorMessage,
      error: error.message,
      problemId,
      language,
      passedCount: 0,
      totalCount: 0,
      totalExecutionTime: Date.now() - startTime,
      testResults: [],
    };
  } finally {
    if (statsStream) {
      statsStream.destroy(); // 스트림 종료
    }
    if (executor) {
      await executor.stop();
      await executor.remove();
    }
    if (compileDir) {
      await cleanupTempDir(compileDir);
    }
  }
}

/**
 * 코드 실행만 수행 (채점 없이)
 */
async function runCode(code, language, input = "", options = {}) {
  const submissionUuid = options.submissionUuid;
  let compileDir = null;
  try {
    // 단순 실행은 '컴파일-실행'의 단일 프로세스를 따름
    const compileResult = await compileCode(code, language, options);
    compileDir = compileResult.compileDir;

    const result = await executeCode(language, compileDir, input, options);

    if (submissionUuid) {
      await publishResult(submissionUuid, {
        status: result.status,
        output: result.output,
        execution_time: result.executionTime,
        memory_usage: result.memoryUsed,
        message: result.message || "코드 실행 완료",
      });
      await publishComplete(submissionUuid, "실행이 완료되었습니다");
    }
    return result;
  } catch (error) {
    const systemError = error.status
      ? error
      : SystemError.fromDockerError(error);
    if (submissionUuid) {
      await publishError(
        submissionUuid,
        systemError.message,
        systemError.name || "SystemError"
      );
      await publishComplete(submissionUuid, "실행이 중단되었습니다");
    }
    return {
      success: false,
      status: systemError.status,
      message: systemError.message,
      error: error.message,
      output: "",
      executionTime: 0,
      memoryUsed: 0,
    };
  } finally {
    if (compileDir) {
      await cleanupTempDir(compileDir);
    }
  }
}

module.exports = {
  judgeCode,
  runCode,
  compareOutput,
  compareOutputIgnoreSpaces,
};
