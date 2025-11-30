import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 프론트에서 /api/... 로 요청하면
      // 실제로는 http://localhost:13800/api/... 로 보내줌
      '/api': {
        target: 'http://localhost:13800',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
