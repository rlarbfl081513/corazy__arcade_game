import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', // 외부에서 접근 가능하도록 설정
    port: 5173
  },
  resolve: {
    alias: {
      // 3. '@' 별칭을 'src' 폴더의 절대 경로로 설정합니다.
      '@': path.resolve(__dirname, 'src')
    }
  }
})
