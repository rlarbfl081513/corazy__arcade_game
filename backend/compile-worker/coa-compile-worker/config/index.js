require('dotenv').config();

const config = {
  // RabbitMQ 설정
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT) || 5672,
    user: process.env.RABBITMQ_USER || 'admin',
    password: process.env.RABBITMQ_PASSWORD || 'admin',
    queue: process.env.RABBITMQ_QUEUE || 'WorkerQueue',
    connectionString: function() {
      return `amqp://${this.user}:${this.password}@${this.host}:${this.port}`;
    }
  },

  // Redis 설정
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0
  },

  // AWS S3 설정
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-northeast-2',
    s3BucketName: process.env.S3_BUCKET_NAME || 'coa-judge-data'
  },

  // Docker 설정
  docker: {
    socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'
  },

  // 실행 제한 기본값
  execution: {
    timeout: parseInt(process.env.DEFAULT_TIMEOUT) || 5000,
    memoryLimit: parseInt(process.env.DEFAULT_MEMORY_LIMIT) || 256,
    cpuQuota: parseInt(process.env.DEFAULT_CPU_QUOTA) || 50000
  },

  // 서비스 설정
  service: {
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// 필수 환경변수 검증 (프로덕션 환경)
if (config.service.env === 'production') {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'REDIS_HOST'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }
}

module.exports = config;

