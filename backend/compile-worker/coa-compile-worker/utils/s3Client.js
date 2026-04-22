const AWS = require('aws-sdk');

let s3 = null;

/**
 * S3 클라이언트 초기화
 * @param {Object} config - AWS 설정
 */
function initializeS3(config = {}) {
  const {
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    region = process.env.AWS_REGION || 'ap-northeast-2'
  } = config;

  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region
  });

  s3 = new AWS.S3();
  console.log('✓ S3 client initialized');
  return s3;
}

/**
 * S3에서 파일 다운로드
 * @param {string} bucket - S3 버킷 이름
 * @param {string} key - S3 객체 키
 * @returns {Promise<Buffer>} - 파일 내용
 */
async function downloadFile(bucket, key) {
  if (!s3) {
    throw new Error('S3 client not initialized. Call initializeS3() first.');
  }

  try {
    const params = {
      Bucket: bucket,
      Key: key
    };

    const data = await s3.getObject(params).promise();
    return data.Body;
  } catch (error) {
    console.error(`Failed to download from S3: ${bucket}/${key}`, error.message);
    throw error;
  }
}

/**
 * S3에서 JSON 파일 다운로드 및 파싱
 * @param {string} bucket - S3 버킷 이름
 * @param {string} key - S3 객체 키
 * @returns {Promise<Object>} - 파싱된 JSON 객체
 */
async function downloadJSON(bucket, key) {
  const buffer = await downloadFile(bucket, key);
  return JSON.parse(buffer.toString('utf8'));
}

/**
 * S3에 파일 업로드
 * @param {string} bucket - S3 버킷 이름
 * @param {string} key - S3 객체 키
 * @param {Buffer|string} body - 업로드할 내용
 * @param {string} contentType - Content-Type
 * @returns {Promise<Object>} - 업로드 결과
 */
async function uploadFile(bucket, key, body, contentType = 'application/octet-stream') {
  if (!s3) {
    throw new Error('S3 client not initialized. Call initializeS3() first.');
  }

  try {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    };

    const result = await s3.putObject(params).promise();
    return result;
  } catch (error) {
    console.error(`Failed to upload to S3: ${bucket}/${key}`, error.message);
    throw error;
  }
}

/**
 * S3 객체 존재 여부 확인
 * @param {string} bucket - S3 버킷 이름
 * @param {string} key - S3 객체 키
 * @returns {Promise<boolean>} - 존재 여부
 */
async function fileExists(bucket, key) {
  if (!s3) {
    throw new Error('S3 client not initialized. Call initializeS3() first.');
  }

  try {
    await s3.headObject({ Bucket: bucket, Key: key }).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * S3 디렉토리의 객체 목록 조회
 * @param {string} bucket - S3 버킷 이름
 * @param {string} prefix - S3 prefix (디렉토리 경로)
 * @returns {Promise<Array>} - 객체 키 목록
 */
async function listObjects(bucket, prefix) {
  if (!s3) {
    throw new Error('S3 client not initialized. Call initializeS3() first.');
  }

  try {
    const params = {
      Bucket: bucket,
      Prefix: prefix
    };

    const data = await s3.listObjectsV2(params).promise();
    
    // Contents가 없는 경우 빈 배열 반환
    if (!data.Contents) {
      return [];
    }
    
    return data.Contents.map(item => item.Key);
  } catch (error) {
    console.error(`Failed to list objects in ${bucket}/${prefix}:`, error.message);
    throw error;
  }
}

module.exports = {
  initializeS3,
  downloadFile,
  downloadJSON,
  uploadFile,
  fileExists,
  listObjects,
  getS3Client: () => s3
};

