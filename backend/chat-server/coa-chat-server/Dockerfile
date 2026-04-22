# 1. 베이스 이미지 설정
# Node.js 20-alpine 버전을 기반으로 이미지를 생성합니다. 'alpine'은 경량화된 리눅스 배포판으로 이미지 크기를 줄여줍니다.
FROM node:20-alpine

# 2. 작업 디렉토리 설정
# 컨테이너 내에서 명령어가 실행될 기본 디렉토리를 설정합니다.
WORKDIR /usr/src/app

# 3. 종속성 파일 복사
# package.json과 package-lock.json을 먼저 복사하여 Docker의 레이어 캐시를 활용합니다.
# 이를 통해 종속성이 변경되지 않았을 경우, 'npm install' 단계를 다시 실행하지 않아 시간과 리소스를 절약할 수 있습니다.
COPY package*.json ./

# 4. 종속성 설치
# 프로덕션 환경에 필요한 종속성만 설치하여 이미지 크기를 최적화합니다.
RUN npm install --production

# 5. 소스 코드 복사
# 나머지 애플리케이션 소스 코드를 컨테이너의 작업 디렉토리로 복사합니다.
COPY . .

EXPOSE 3000

# 6. 애플리케이션 실행
# 컨테이너가 시작될 때 실행할 명령어를 정의합니다. 'node server.js'를 실행하여 서버를 시작합니다.
CMD [ "node", "server.js" ]