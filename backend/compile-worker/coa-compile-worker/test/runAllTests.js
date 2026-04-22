console.log("========================================");
console.log("Running All Test Cases");
console.log("========================================\n");

const { execSync } = require('child_process');
const path = require('path');

// 모든 테스트 케이스 파일 목록
const testFiles = [
  'insertTestJob.js',           // 기본 테스트
  'testCase1_simple.js',        // 간단한 출력
  'testCase2_withInput.js',     // JS 입력 처리
  'testCase3_error.js',         // 런타임 에러
  'testCase4_timeout.js',       // 타임아웃 (TLE)
  'testCase5_python.js',        // Python 기본
  'testCase6_c.js',             // C 언어
  'testCase7_cpp.js',           // C++ 언어
  'testCase8_java.js',          // Java Solution 클래스
  'testCase9_compileError.js',  // 컴파일 에러 (CE)
  'testCase10_memoryLimit.js',  // 메모리 제한 (MLE)
  'testCase11_validation.js',   // 입력 검증 에러
  'testCase12_pythonInput.js',  // Python 입력 처리
  'testCase13_cInput.js',       // C 입력 처리
  'testCase14_javaInput.js',    // Java 입력 처리
  'testCase15_judgeMode.js',    // Judge 모드 (구 JSON 방식, S3 필요)
  'testCase16_longOutput.js',   // 긴 출력
  'testCase17_multiline.js',    // 여러 줄 입력
  'testCase18_judgeSample.js',  // Judge 모드 - Sample (.in/.ans 파일)
  'testCase19_judgeEvaluate.js',// Judge 모드 - Evaluate (.in/.ans 파일)
  'testCase20_judgeWrongAnswer.js', // Judge 모드 - Wrong Answer
  'testCase21_judgeMultipleProblems.js', // Judge 모드 - 여러 문제
  'testCase22_concurrency.js',  // 동시성 테스트 (수동 실행 권장)
  'testCase23_concurrencyMixed.js', // 혼합 언어 동시성 (수동 실행 권장)
  'testCase24_performance.js',   // 성능 비교 테스트 (수동 실행 권장)
  // 'testCase25_memoryMonitoring.js' // 메모리 모니터링 테스트 (수동 실행 권장)
];

// 각 테스트를 순차적으로 실행
function runTests() {
  let successCount = 0;
  let failCount = 0;

  testFiles.forEach((file, index) => {
    console.log(`\n[${index + 1}/${testFiles.length}] Running: ${file}`);
    console.log("----------------------------------------");

    try {
      const filePath = path.join(__dirname, file);
      execSync(`node "${filePath}"`, { stdio: 'inherit' });
      successCount++;
      console.log(`✓ ${file} completed`);
    } catch (error) {
      failCount++;
      console.error(`✗ ${file} failed`);
    }

    // 각 테스트 사이 1초 대기 (RabbitMQ 메시지 순서 보장)
    if (index < testFiles.length - 1) {
      const delay = 1000;
      console.log(`Waiting ${delay}ms before next test...`);
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Blocking delay
      }
    }
  });

  console.log("\n========================================");
  console.log("Test Summary");
  console.log("========================================");
  console.log(`Total: ${testFiles.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log("========================================\n");
}

runTests();
