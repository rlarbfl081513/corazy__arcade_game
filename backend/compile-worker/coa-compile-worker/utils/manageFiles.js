const fs = require("fs").promises;
const path = require("path");
const os = require("os");

/**
 * 언어별 소스 파일명 반환
 * @param {string} language - 프로그래밍 언어
 * @returns {string} - 파일명
 */
function getSourceFileName(language) {
  const FILE_MAP = {
    javascript: "main.js",
    python: "main.py",
    java: "Solution.java",
    cpp: "main.cpp",
    c: "main.c",
  };
  return FILE_MAP[language];
}

/**
 * 컴파일을 위한 임시 디렉토리 생성 및 소스 파일 준비
 * @param {string} code - 소스 코드
 * @param {string} language - 프로그래밍 언어
 * @returns {{baseDir: string, srcDir: string, binDir: string}} - 생성된 디렉토리 경로
 */
async function prepareCompileDir(code, language) {
  const baseDir = await fs.mkdtemp(
    path.join(process.env.WORKSPACE_DIR || os.tmpdir(), "sandbox-compile-")
  );
  const srcDir = path.join(baseDir, "src");
  const binDir = path.join(baseDir, "bin");

  try {
    await fs.mkdir(srcDir, { recursive: true });
    await fs.mkdir(binDir, { recursive: true });

    const sourceFileName = getSourceFileName(language);
    const sourceFilePath = path.join(srcDir, sourceFileName);
    await fs.writeFile(sourceFilePath, code, "utf8");

    return { baseDir, srcDir, binDir };
  } catch (error) {
    console.error(
      "❌ [DEBUG] Failed to prepare compile directory:",
      error.message
    );
    await cleanupTempDir(baseDir);
    throw error;
  }
}

/**
 * 실행을 위한 임시 디렉토리 생성 및 입력 파일 준비
 * @param {string} input - 입력 데이터
 * @returns {{ioDir: string, baseDir: string}} - 생성된 디렉토리 경로
 */
async function prepareExecuteDir(input) {
  const baseDir = await fs.mkdtemp(
    path.join(process.env.WORKSPACE_DIR || os.tmpdir(), "sandbox-exec-")
  );
  const ioDir = path.join(baseDir, "io");

  try {
    await fs.mkdir(ioDir, { recursive: true });

    if (input && input.trim() !== "") {
      const inputFilePath = path.join(ioDir, "input.txt");
      await fs.writeFile(inputFilePath, input, "utf8");
    }

    return { baseDir, ioDir };
  } catch (error) {
    console.error(
      "❌ [DEBUG] Failed to prepare execute directory:",
      error.message
    );
    await cleanupTempDir(baseDir);
    throw error;
  }
}

/**
 * 임시 디렉토리 및 파일 삭제
 * @param {string} tempDir - 삭제할 디렉토리 경로
 */
async function cleanupTempDir(tempDir) {
  if (!tempDir) return;

  try {
    // 재시도 로직 추가 (최대 3회)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 });

        // 삭제 확인
        try {
          await fs.access(tempDir);
          // 디렉토리가 여전히 존재하면 재시도
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            continue;
          }
        } catch {
          // 디렉토리가 없으면 성공
          return;
        }

        return;
      } catch (error) {
        if (attempt === 3) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error(
      `⚠️  Failed to cleanup temp directory after 3 attempts: ${tempDir}`,
      error.message
    );
    // 에러를 무시하지 않고 경고만 출력
  }
}

/**
 * Windows 경로를 Docker 경로로 변환
 * @param {string} windowsPath - Windows 경로
 * @returns {string} - Docker 경로
 */
function convertToDockerPath(windowsPath) {
  if (process.platform === "win32") {
    return windowsPath
      .replace(/\\/g, "/")
      .replace(/^([A-Z]):/, (match, drive) => `/${drive.toLowerCase()}`);
  }
  return windowsPath;
}

module.exports = {
  getSourceFileName,
  prepareCompileDir,
  prepareExecuteDir,
  cleanupTempDir,
  convertToDockerPath,
};
