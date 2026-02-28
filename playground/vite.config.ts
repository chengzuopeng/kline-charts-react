import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const useLocalSource = !isProduction || process.env.USE_LOCAL_SOURCE === 'true';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: isGitHubPages ? '/kline-charts/' : '/',
  plugins: [react()],
  resolve: {
    alias: useLocalSource
      ? {
          'kline-charts-react': path.resolve(__dirname, '../src/index.ts'),
          '@': path.resolve(__dirname, '../src'),
        }
      : {},
  },
  server: {
    port: 3000,
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/qt': {
        target: 'https://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/qt/, ''),
      },
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
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
