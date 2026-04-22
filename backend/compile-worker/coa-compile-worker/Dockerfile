FROM node:18-alpine

# Docker CLI 설치 (호스트 Docker 데몬과 통신하기 위함)
RUN apk add --no-cache docker-cli

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
# npm ci 대신 npm install 사용 (package-lock.json 문제 방지)
RUN npm install --production

# 애플리케이션 코드 복사
COPY . .

# 환경변수 기본값 설정
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# 헬스체크 (선택사항)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('net').connect(process.env.RABBITMQ_PORT || 5672, process.env.RABBITMQ_HOST || 'localhost')" || exit 1

# 애플리케이션 실행
CMD ["node", "src/app.js"]

