// 테스트용 공통 설정
require('dotenv').config();

const config = {
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: process.env.RABBITMQ_PORT || 5672,
    user: process.env.RABBITMQ_USER || 'admin',
    password: process.env.RABBITMQ_PASSWORD || 'admin',
    queue: process.env.RABBITMQ_QUEUE || 'WorkerQueue'
  }
};

// RabbitMQ 연결 URL 생성
config.rabbitmq.url = `amqp://${config.rabbitmq.user}:${config.rabbitmq.password}@${config.rabbitmq.host}:${config.rabbitmq.port}`;

module.exports = config;

