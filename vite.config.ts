import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'KLineCharts',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'index.js';
        if (format === 'cjs') return 'index.cjs';
        return 'index.umd.js';
      },
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'echarts', /^echarts\//, 'stock-sdk'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          echarts: 'echarts',
          'echarts/core': 'echarts',
          'echarts/charts': 'echarts',
          'echarts/components': 'echarts',
          'echarts/renderers': 'echarts',
          'stock-sdk': 'StockSDK',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'kline-charts-react.css';
          return assetInfo.name ?? 'assets/[name][extname]';
        },
      },
    },
    cssCodeSplit: false,
  },
});
