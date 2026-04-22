# ---- 1단계: 빌드 ----
FROM node:20-alpine AS build
WORKDIR /app

# 빌드 캐시 활용을 위한 패키지 복사
COPY package*.json ./

# 의존성 설치 (npm ci는 캐시 친화적)
RUN npm ci

# 나머지 코드 복사
COPY . .

# 💡 빌드 중 메모리 최적화
ENV NODE_OPTIONS="--max-old-space-size=2048"

# 빌드 실행
RUN npm run build

# ---- 2단계: 배포 ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
