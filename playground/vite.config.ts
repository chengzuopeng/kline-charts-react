import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 判断是否为生产环境构建
// 开发模式 (yarn dev) 使用本地源码
// 生产构建 (yarn build:playground) 使用 npm 包
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: isProduction
      ? {
          // 生产环境：不设置别名，使用 node_modules 中的 kline-charts
        }
      : {
          // 开发环境：直接引用本地源码，支持热更新调试
          'kline-charts': path.resolve(__dirname, '../src/index.ts'),
          '@': path.resolve(__dirname, '../src'),
        },
  },
  server: {
    port: 3000,
    fs: {
      // 允许访问父目录（本地源码）
      allow: ['..'],
    },
    proxy: {
      // 代理腾讯财经接口解决跨域
      '/qt': {
        target: 'https://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/qt/, ''),
      },
      // 代理东方财富接口
      '/eastmoney': {
        target: 'https://push2.eastmoney.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/eastmoney/, ''),
      },
      '/eastmoney-his': {
        target: 'https://push2his.eastmoney.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/eastmoney-his/, ''),
      },
    },
  },
  // 生产构建配置
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
