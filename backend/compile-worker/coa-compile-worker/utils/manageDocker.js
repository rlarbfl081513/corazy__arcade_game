const Docker = require('dockerode');

// 플랫폼에 따라 Docker 연결 설정
function getDockerConfig() {
  const platform = process.platform;
  
  if (platform === 'win32') {
    // Windows: Named Pipe 사용 또는 자동 감지
    // Docker Desktop for Windows는 자동으로 감지됨
    return {};  // dockerode가 자동으로 올바른 경로 찾음
  } else {
    // Linux/Mac: Unix Socket 사용
    const socketPath = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock';
    return { socketPath };
  }
}

const docker = new Docker(getDockerConfig());

/**
 * 이미지가 로컬에 존재하는지 확인하고, 없으면 pull
 * @param {string} imageName - Docker 이미지 이름
 */
async function ensureImageExists(imageName) {
  try {
    await docker.getImage(imageName).inspect();
    console.log(`✓ Image ${imageName} already exists`);
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`⬇ Pulling image ${imageName}...`);
      await new Promise((resolve, reject) => {
        docker.pull(imageName, (err, stream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err, output) => {
            if (err) return reject(err);
            console.log(`✓ Image ${imageName} pulled successfully`);
            resolve(output);
          });
        });
      });
    } else {
      throw error;
    }
  }
}

/**
 * 컨테이너 생성
 * @param {Object} options - 컨테이너 옵션
 * @returns {Object} - 생성된 컨테이너 객체
 */
async function createContainer(options) {
  return await docker.createContainer(options);
}

/**
 * 컨테이너 제거
 * @param {Object} container - 컨테이너 객체
 */
async function removeContainer(container) {
  if (!container) return;
  
  try {
    await container.remove({ force: true });
  } catch (error) {
    console.error('Failed to remove container:', error.message);
  }
}

/**
 * Docker 로그 파싱 (8바이트 헤더 처리)
 * @param {Buffer} logs - Docker 로그 버퍼
 * @returns {Object} - { stdout: string, stderr: string }
 */
function parseDockerLogs(logs) {
  const logString = logs.toString('utf8');
  let stdout = '';
  let stderr = '';
  let offset = 0;
  
  while (offset < logString.length) {
    // 8바이트 헤더가 없으면 전체를 stdout으로 처리
    if (offset + 8 > logString.length) {
      stdout += logString.slice(offset);
      break;
    }
    
    const header = logString.slice(offset, offset + 8);
    const streamType = header.charCodeAt(0);
    const size = header.charCodeAt(4) * 0x1000000 + 
                 header.charCodeAt(5) * 0x10000 + 
                 header.charCodeAt(6) * 0x100 + 
                 header.charCodeAt(7);
    
    offset += 8;
    const content = logString.slice(offset, offset + size);
    offset += size;
    
    if (streamType === 1) {
      stdout += content;
    } else if (streamType === 2) {
      stderr += content;
    }
  }
  
  return { stdout, stderr };
}

module.exports = {
  docker,
  ensureImageExists,
  createContainer,
  removeContainer,
  parseDockerLogs
};

