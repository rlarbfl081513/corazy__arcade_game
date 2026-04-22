const { downloadFile, downloadJSON, fileExists, listObjects } = require('../utils/s3Client');
const { S3Error } = require('../error');

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'coa-judge-data';

/**
 * S3에서 디렉토리의 파일 목록 가져오기
 * @param {string} prefix - S3 prefix (디렉토리 경로)
 * @returns {Promise<Array>} - 파일 키 목록
 */
async function listFiles(prefix) {
  try {
    const files = await listObjects(BUCKET_NAME, prefix);
    return files;
  } catch (error) {
    console.error(`Failed to list files in ${prefix}:`, error.message);
    throw S3Error.downloadFailed(BUCKET_NAME, prefix, error);
  }
}

/**
 * S3에서 문제의 테스트케이스 데이터 가져오기 (파일 기반)
 * @param {number} problemId - 문제 ID
 * @param {string} type - 'sample' 또는 'evaluate'
 * @returns {Promise<Object>} - 테스트케이스 데이터
 * 
 * 예상 S3 구조:
 * s3://bucket/problems/{problemId}/sample/1.in
 * s3://bucket/problems/{problemId}/sample/1.ans
 * s3://bucket/problems/{problemId}/evaluate/1.in
 * s3://bucket/problems/{problemId}/evaluate/1.ans
 */
async function getTestCases(problemId, type = 'evaluate') {
  const prefix = `problems/${problemId}/${type}/`;
  
  try {
    console.log(`📥 Loading test cases for problem ${problemId} (${type}) from S3...`);
    
    // 디렉토리의 파일 목록 가져오기
    const files = await listFiles(prefix);
    
    // .in 파일들만 추출하여 번호 파싱
    const inFiles = files
      .filter(f => f.endsWith('.in'))
      .map(f => {
        const fileName = f.split('/').pop();
        const num = parseInt(fileName.replace('.in', ''));
        return { num, inKey: f, ansKey: f.replace('.in', '.ans') };
      })
      .sort((a, b) => a.num - b.num);
    
    if (inFiles.length === 0) {
      throw S3Error.notFound(problemId);
    }
    
    // 각 테스트케이스 파일 다운로드
    const testCases = [];
    for (const { num, inKey, ansKey } of inFiles) {
      try {
        let inputBuffer = await downloadFile(BUCKET_NAME, inKey);
        let outputBuffer = await downloadFile(BUCKET_NAME, ansKey);

        // Buffer를 문자열로 변환 후 명시적으로 해제
        const inputStr = inputBuffer.toString('utf8');
        const outputStr = outputBuffer.toString('utf8');

        // Buffer 참조 해제 (GC 대상으로 만듦)
        inputBuffer = null;
        outputBuffer = null;

        testCases.push({
          number: num,
          input: inputStr,
          output: outputStr
        });
      } catch (error) {
        console.warn(`⚠️  Failed to download test case ${num}:`, error.message);
      }
    }

    // 대용량 테스트케이스 처리 후 강제 GC 힌트
    if (testCases.length > 10 && global.gc) {
      global.gc();
    }
    
    console.log(`✓ Downloaded ${testCases.length} test cases (${type})`);
    
    // 문제 정보도 가져오기 (선택적)
    let problemInfo = {
      timeLimit: 2000,
      memoryLimit: 256
    };
    
    try {
      const infoKey = `problems/${problemId}/info.json`;
      const info = await downloadJSON(BUCKET_NAME, infoKey);
      problemInfo = {
        timeLimit: info.timeLimit || 2000,
        memoryLimit: info.memoryLimit || 256,
        title: info.title,
        description: info.description
      };
    } catch (error) {
      console.warn(`⚠️  No info.json found, using defaults`);
    }
    
    return {
      problemId,
      type,
      timeLimit: problemInfo.timeLimit,
      memoryLimit: problemInfo.memoryLimit,
      title: problemInfo.title,
      description: problemInfo.description,
      testCases
    };
    
  } catch (error) {
    console.error(`Failed to get test cases for problem ${problemId}:`, error.message);
    if (error instanceof S3Error) {
      throw error;
    }
    throw S3Error.downloadFailed(BUCKET_NAME, prefix, error);
  }
}

/**
 * S3에서 문제 정보 가져오기
 * @param {number} problemId - 문제 ID
 * @returns {Promise<Object>} - 문제 정보
 * 
 * 예상 S3 구조:
 * s3://bucket/problems/{problemId}/info.json
 * 
 * info.json 형식:
 * {
 *   "problemId": 1,
 *   "title": "A+B",
 *   "timeLimit": 2000,
 *   "memoryLimit": 256,
 *   "difficulty": "Bronze V"
 * }
 */
async function getProblemInfo(problemId) {
  const key = `problems/${problemId}/info.json`;
  
  try {
    console.log(`📥 Downloading problem info for problem ${problemId} from S3...`);
    const data = await downloadJSON(BUCKET_NAME, key);
    return data;
  } catch (error) {
    console.error(`Failed to get problem info for problem ${problemId}:`, error.message);
    if (error.code === 'NoSuchKey' || error.statusCode === 404) {
      throw S3Error.notFound(problemId);
    }
    throw S3Error.downloadFailed(BUCKET_NAME, key, error);
  }
}

/**
 * 문제의 테스트케이스 존재 여부 확인
 * @param {number} problemId - 문제 ID
 * @param {string} type - 'sample' 또는 'evaluate'
 * @returns {Promise<boolean>} - 존재 여부
 */
async function testCasesExist(problemId, type = 'evaluate') {
  try {
    const prefix = `problems/${problemId}/${type}/`;
    const files = await listFiles(prefix);
    return files.some(f => f.endsWith('.in'));
  } catch (error) {
    console.error(`Error checking test cases for problem ${problemId}:`, error.message);
    return false;
  }
}

module.exports = {
  getTestCases,
  testCasesExist,
  getProblemInfo,
  listFiles
};

