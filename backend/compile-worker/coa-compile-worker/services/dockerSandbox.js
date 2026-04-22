const path = require("path");
const {
  ensureImageExists,
  createContainer,
  removeContainer,
  parseDockerLogs,
} = require("../utils/manageDocker");
const {
  prepareCompileDir,
  prepareExecuteDir,
  cleanupTempDir,
  convertToDockerPath,
} = require("../utils/manageFiles");
const {
  CompileError,
  RuntimeError,
  TimeoutError,
  MemoryError,
  SystemError,
  ValidationError,
} = require("../error");

/**
 * 컨테이너 메모리 사용량 수집 (cgroup 파일 직접 읽기)
 * @param {Object} container - Docker 컨테이너 객체
 * @returns {number} - 메모리 사용량 (MB)
 */
async function collectMemoryStats(container) {
  try {
    // Docker stats API (stream: false)를 사용하여 단일 스냅샷을 가져옴
    const stats = await container.stats({ stream: false });
    if (stats.memory_stats && stats.memory_stats.max_usage) {
      const mb = Math.round(stats.memory_stats.max_usage / 1024 / 1024);
      return mb;
    }
    return 0;
  } catch (error) {
    console.log("⚠️  Failed to collect memory stats:", error.message);
    return 0;
  }
}

/**
 * 언어별 Docker 이미지 반환
 */
function getDockerImage(language) {
  const IMAGE_MAP = {
    javascript: "node:20-alpine",
    python: "python:3.13-alpine",
    java: "eclipse-temurin:17-jdk-alpine",
    cpp: "gcc:14",
    c: "gcc:14",
  };
  return IMAGE_MAP[language];
}

/**
 * 언어별 컴파일 커맨드 생성 (BOJ 환경 기준)
 */
function getCompileCommand(language) {
  switch (language) {
    case "javascript":
    case "python":
      return null;
    case "cpp":
      return [
        "sh",
        "-c",
        "g++ -O2 -Wall -lm -static -std=gnu++17 -o /sandbox/bin/program /sandbox/src/main.cpp",
      ];
    case "c":
      return [
        "sh",
        "-c",
        "gcc -O2 -Wall -lm -static -std=gnu11 -o /sandbox/bin/program /sandbox/src/main.c",
      ];
    case "java":
      // prefetch=2 및 컨테이너 메모리 제한(2Gi)을 고려하여 OOM 방지를 위해 메모리 제한 조정
      return [
        "sh",
        "-c",
        `javac -J-Xms512m -J-Xmx768m -d /sandbox/bin /sandbox/src/Solution.java`,
      ];
    default:
      throw new Error(`Unsupported language for compilation: ${language}`);
  }
}

/**
 * 언어별 실행 커맨드 생성 (BOJ 환경 기준)
 */
function getExecuteCommand(language, hasInput = false, memoryLimit = 128) {
  const inputRedirect = hasInput ? "< /sandbox/io/input.txt" : "";
  switch (language) {
    case "javascript":
      return ["sh", "-c", `node /sandbox/src/main.js ${inputRedirect}`];
    case "python":
      return ["sh", "-c", `python /sandbox/src/main.py ${inputRedirect}`];
    case "cpp":
    case "c":
      return ["sh", "-c", `/sandbox/bin/program ${inputRedirect}`];
    case "java":
      const javaHeapMax = Math.max(128, Math.floor(memoryLimit * 0.8));
      return [
        "sh",
        "-c",
        `java -Xmx${javaHeapMax}m -cp /sandbox/bin Solution ${inputRedirect}`,
      ];
    default:
      throw new Error(`Unsupported language for execution: ${language}`);
  }
}

/**
 * 코드를 컴파일하고 아티팩트 경로를 반환
 */
async function compileCode(code, language, options = {}) {
  const { memoryLimit = 2048, cpuQuota = 100000 } = options;

  const image = getDockerImage(language);
  if (!image) {
    throw new ValidationError("Unsupported language", { language });
  }

  // 1. 소스 디렉터리 준비
  const { baseDir, srcDir, binDir } = await prepareCompileDir(code, language);
  const compileDir = baseDir;

  // 2. 컴파일이 필요 없는 언어 처리
  const command = getCompileCommand(language);
  if (!command) {
    return { success: true, compileDir };
  }

  // 3. 컴파일 실행
  let container = null;
  try {
    await ensureImageExists(image);
    const dockerSrcPath = convertToDockerPath(srcDir);
    const dockerBinPath = convertToDockerPath(binDir);

    const containerOptions = {
      Image: image,
      Cmd: command,
      Env: ["LANG=C.UTF-8", "LC_ALL=C.UTF-8"],
      Tty: false,
      WorkingDir: "/sandbox",
      HostConfig: {
        Memory: memoryLimit * 1024 * 1024,
        CpuQuota: cpuQuota,
        CpuPeriod: 100000,
        Binds: [
          `${dockerSrcPath}:/sandbox/src:ro`,
          `${dockerBinPath}:/sandbox/bin`,
        ],
      },
    };

    container = await createContainer(containerOptions);
    await container.start();
    const { StatusCode: exitCode } = await container.wait();

    if (exitCode !== 0) {
      const logs = await container.logs({ stdout: true, stderr: true });
      const { stderr } = parseDockerLogs(logs);
      throw CompileError.fromStderr(stderr, language);
    }

    return { success: true, compileDir };
  } catch (error) {
    await cleanupTempDir(compileDir); // 컴파일 실패 시 생성된 디렉터리 정리
    if (error instanceof CompileError) throw error;
    throw SystemError.fromDockerError(error, "Failed during compilation");
  } finally {
    await removeContainer(container);
  }
}

/**
 * 컴파일된 코드 또는 스크립트를 실행
 */
async function createExecutor(language, compileDir, options = {}) {
  const {
    memoryLimit = 128,
    cpuQuota = 50000,
    networkDisabled = true,
  } = options;

  const image = getDockerImage(language);
  if (!image) {
    throw new ValidationError("Unsupported language", { language });
  }

  await ensureImageExists(image);

  const binds = [];
  const compileCommand = getCompileCommand(language);
  if (compileCommand) {
    const dockerBinPath = convertToDockerPath(path.join(compileDir, "bin"));
    binds.push(`${dockerBinPath}:/sandbox/bin:ro`);
  } else {
    const dockerSrcPath = convertToDockerPath(path.join(compileDir, "src"));
    binds.push(`${dockerSrcPath}:/sandbox/src:ro`);
  }

  const containerOptions = {
    Image: image,
    Cmd: ["/bin/sh"], // 컨테이너가 즉시 종료되지 않도록 셸 실행
    Env: ["LANG=C.UTF-8", "LC_ALL=C.UTF-8"],
    Tty: true, // Tty를 활성화하여 컨테이너가 계속 실행되도록 함
    WorkingDir: "/sandbox",
    HostConfig: {
      Memory: memoryLimit * 1024 * 1024,
      MemorySwap: memoryLimit * 1024 * 1024,
      CpuQuota: cpuQuota,
      CpuPeriod: 100000,
      PidsLimit: 50,
      Binds: binds,
      NetworkDisabled: networkDisabled,
    },
  };

  const container = await createContainer(containerOptions);
  await container.start();

  // 실행 컨테이너 내부에 I/O 디렉터리 생성 (명령어 완료 보장)
  const mkdirExec = await container.exec({
    Cmd: ["mkdir", "-p", "/sandbox/io"],
    AttachStdout: true,
    AttachStderr: true,
  });

  await new Promise((resolve, reject) => {
    mkdirExec.start({ hijack: false, stdin: false }, (err, stream) => {
      if (err) return reject(err);
      stream.on("end", resolve);
      stream.on("error", reject);
      // 스트림을 소비해야 'end' 이벤트가 발생함
      stream.on("data", () => {});
    });
  });

  const { ExitCode } = await mkdirExec.inspect();
  if (ExitCode !== 0) {
    await container.stop();
    await container.remove();
    throw new Error("Failed to create I/O directory in executor container.");
  }

  return container;
}

const tar = require("tar-stream");

async function runInExecutor(container, language, input = "", options = {}) {
  const { timeout = 5000, memoryLimit = 128, skipMemoryCheck = false } = options;

  const result = {
    success: false,
    output: "",
    error: "",
    executionTime: 0,
    memoryUsed: 0,
    status: "UNKNOWN",
    message: "",
  };

  const startTime = Date.now();
  let exec = null;

  try {
    const hasInput = input && input.trim() !== "";

    // 1. putArchive를 사용하여 컨테이너 내부에 input.txt 생성 (더 안정적)
    if (hasInput) {
      const pack = tar.pack();
      pack.entry({ name: "input.txt" }, input);
      pack.finalize();
      await container.putArchive(pack, { path: "/sandbox/io/" });
    }

    // 2. 실행 커맨드 생성 및 exec 객체 생성
    const command = getExecuteCommand(language, hasInput, memoryLimit);
    exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false, // Tty를 비활성화하여 스트림 헤더를 통해 stdout/stderr 구분
    });

    // 3. 타임아웃과 실행 완료를 경쟁
    const stream = await exec.start({ hijack: true, stdin: true });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIME_LIMIT_EXCEEDED")), timeout);
    });

    const outputPromise = new Promise((resolve, reject) => {
      const buffers = [];
      stream.on("data", (chunk) => buffers.push(chunk));
      stream.on("end", () => {
        const rawLogs = Buffer.concat(buffers);
        const parsed = parseDockerLogs(rawLogs);
        resolve(parsed);
      });
      stream.on("error", reject);
    });

    const { stdout, stderr } = await Promise.race([
      outputPromise,
      timeoutPromise,
    ]);

    result.executionTime = Date.now() - startTime;
    if (!skipMemoryCheck) {
      result.memoryUsed = await collectMemoryStats(container);
    }

    const inspectInfo = await exec.inspect();
    const exitCode = inspectInfo.ExitCode;

    if (exitCode === 0) {
      result.success = true;
      result.output = stdout.trim();
      result.error = stderr.trim(); // stderr도 결과에 포함
      result.status = "SUCCESS";
      result.message = "정상적으로 실행되었습니다.";
    } else {
      result.success = false;
      result.output = stdout.trim();
      result.error = stderr.trim();
      const runtimeError = RuntimeError.fromExecution(stderr, exitCode);
      result.status = runtimeError.status;
      result.message = runtimeError.message;
    }

    if (result.memoryUsed >= memoryLimit) {
      const memoryError = MemoryError.fromLimit(result.memoryUsed, memoryLimit);
      result.status = memoryError.status;
      result.message = memoryError.message;
      result.success = false;
    }
  } catch (error) {
    result.executionTime = Date.now() - startTime;
    if (error.message === "TIME_LIMIT_EXCEEDED") {
      const timeoutError = TimeoutError.fromLimit(timeout);
      result.status = timeoutError.status;
      result.message = timeoutError.message;
      result.memoryUsed = await collectMemoryStats(container);
    } else {
      const systemError = SystemError.fromDockerError(
        error,
        "Failed during execution"
      );
      result.error = error.message;
      result.status = systemError.status;
      result.message = systemError.message;
    }
  }

  return result;
}

async function executeCode(language, compileDir, input = "", options = {}) {
  const {
    timeout = 5000,
    memoryLimit = 128,
    cpuQuota = 50000,
    networkDisabled = true,
  } = options;

  const image = getDockerImage(language);
  if (!image) {
    throw new ValidationError("Unsupported language", { language });
  }

  const result = {
    success: false,
    output: "",
    error: "",
    executionTime: 0,
    memoryUsed: 0,
    status: "UNKNOWN",
    message: "",
  };

  let container = null;
  let execDir = null;
  const startTime = Date.now();

  try {
    await ensureImageExists(image);

    const { baseDir, ioDir } = await prepareExecuteDir(input);
    execDir = baseDir;
    const hasInput = input && input.trim() !== "";

    const command = getExecuteCommand(language, hasInput, memoryLimit);

    const binds = [`${convertToDockerPath(ioDir)}:/sandbox/io:ro`];
    const compileCommand = getCompileCommand(language);
    if (compileCommand) {
      const dockerBinPath = convertToDockerPath(path.join(compileDir, "bin"));
      binds.push(`${dockerBinPath}:/sandbox/bin:ro`);
    } else {
      const dockerSrcPath = convertToDockerPath(path.join(compileDir, "src"));
      binds.push(`${dockerSrcPath}:/sandbox/src:ro`);
    }

    const containerOptions = {
      Image: image,
      Cmd: command,
      Env: ["LANG=C.UTF-8", "LC_ALL=C.UTF-8"],
      Tty: false,
      WorkingDir: "/sandbox",
      HostConfig: {
        Memory: memoryLimit * 1024 * 1024,
        MemorySwap: memoryLimit * 1024 * 1024,
        CpuQuota: cpuQuota,
        CpuPeriod: 100000,
        PidsLimit: 50,
        Binds: binds,
        NetworkDisabled: networkDisabled,
      },
    };

    container = await createContainer(containerOptions);
    await container.start();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIME_LIMIT_EXCEEDED")), timeout);
    });

    const waitPromise = container.wait();
    const containerInfo = await Promise.race([waitPromise, timeoutPromise]);

    const inspectInfo = await container.inspect();
    const oomKilled = inspectInfo.State.OOMKilled;
    let memoryUsed = await collectMemoryStats(container);

    if (oomKilled && memoryUsed === 0) {
      memoryUsed = memoryLimit;
    }

    const logs = await container.logs({ stdout: true, stderr: true });
    let { stdout, stderr } = parseDockerLogs(logs);

    const MAX_LOG_SIZE = 1024 * 1024; // 1MB
    if (stdout.length > MAX_LOG_SIZE) {
      stdout =
        stdout.substring(0, MAX_LOG_SIZE) + "\n\n[출력이 너무 길어 잘렸습니다]";
    }
    if (stderr.length > MAX_LOG_SIZE) {
      stderr =
        stderr.substring(0, MAX_LOG_SIZE) +
        "\n\n[에러 출력이 너무 길어 잘렸습니다]";
    }

    result.executionTime = Date.now() - startTime;
    result.memoryUsed = memoryUsed;

    const exitCode = containerInfo.StatusCode;

    if (exitCode === 0) {
      result.success = true;
      result.output = stdout.trim();
      result.status = "SUCCESS";
      result.message = "정상적으로 실행되었습니다.";
      if (stderr.trim()) result.error = stderr.trim();
    } else {
      result.success = false;
      result.output = stdout.trim();
      result.error = stderr.trim();
      const runtimeError = RuntimeError.fromExecution(stderr, exitCode);
      result.status = runtimeError.status;
      result.message = runtimeError.message;
    }

    const isMemoryExceeded =
      memoryUsed >= memoryLimit || oomKilled || exitCode === 137;
    if (isMemoryExceeded) {
      const memoryError = MemoryError.fromLimit(memoryUsed, memoryLimit);
      result.status = memoryError.status;
      result.message = memoryError.message;
      result.success = false;
    }
  } catch (error) {
    result.executionTime = Date.now() - startTime;
    if (error.message === "TIME_LIMIT_EXCEEDED") {
      const timeoutError = TimeoutError.fromLimit(timeout);
      result.status = timeoutError.status;
      result.message = timeoutError.message;
      try {
        result.memoryUsed = await collectMemoryStats(container);
        await container.kill();
      } catch (killError) {
        // Ignore
      }
    } else {
      const systemError = SystemError.fromDockerError(
        error,
        "Failed during execution"
      );
      result.error = error.message;
      result.status = systemError.status;
      result.message = systemError.message;
    }
  } finally {
    await removeContainer(container);
    if (execDir) await cleanupTempDir(execDir);
  }

  return result;
}

module.exports = { compileCode, createExecutor, runInExecutor, executeCode };
