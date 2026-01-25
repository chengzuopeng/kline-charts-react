import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'kline-charts': resolve(__dirname, '../src/index.ts'),
      '@': resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: ['..'],
    },
    proxy: {
      // 代理腾讯财经接口解决跨域
      '/qt': {
        target: 'https://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/qt/, ''),
      },
      // 代理东方财富接口
      '/eastmoney': {
        target: 'https://push2.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/eastmoney/, ''),
      },
      '/eastmoney-his': {
        target: 'https://push2his.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/eastmoney-his/, ''),
      },
    },
  },
});
