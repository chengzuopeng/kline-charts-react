# KLine Charts

<p align="center">
  <strong>📈 专业级股票 K 线图表 React 组件</strong>
</p>

<p align="center">
  基于 ECharts，内置 stock-sdk 数据源，开箱即用
</p>

<p align="center">
  <a href="#安装">安装</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#功能特性">功能特性</a> •
  <a href="#api-文档">API 文档</a> •
  <a href="#主题定制">主题定制</a>
</p>

---

## 功能特性

- 🚀 **零配置数据** - 内置 stock-sdk，传入股票代码自动获取数据
- 🔌 **可插拔数据源** - 支持自定义 DataProvider（解决跨域/接入自有行情源/SSR）
- 🌍 **多市场支持** - A 股、港股、美股
- 📊 **丰富周期** - 分时、五日、日 K、周 K、月 K、分钟级 K 线
- 📈 **技术指标** - MA/MACD/BOLL/KDJ/RSI/WR/BIAS/CCI/ATR
- 🎯 **交互完善** - 缩放、平移、十字准线、Tooltip、撤销/重做
- 🖥️ **全屏模式** - 一键全屏展示
- 🔄 **自动刷新** - 分时模式支持自动刷新数据
- 🎨 **高度可定制** - 主题、颜色、指标参数均可配置
- 📱 **响应式设计** - 自适应容器尺寸
- 📦 **轻量体积** - Tree-shaking 友好，按需引入 ECharts 组件

## 安装

```bash
npm install kline-charts

# 或使用 yarn
yarn add kline-charts

# 或使用 pnpm
pnpm add kline-charts
```

### Peer Dependencies

```bash
npm install react react-dom
```

## 快速开始

```tsx
import { KLineChart } from 'kline-charts';
import 'kline-charts/style.css';

function App() {
  return (
    <KLineChart
      symbol="sh600519"  // 贵州茅台
      height={600}
    />
  );
}
```

## 基础用法

### 切换股票

```tsx
<KLineChart
  symbol="sz000001"  // 平安银行
  market="A"         // A 股（默认）
/>
```

### 指定周期

```tsx
<KLineChart
  symbol="sh600519"
  period="weekly"  // 周 K 线
/>
```

可选周期：`timeline` | `timeline5` | `1` | `5` | `15` | `30` | `60` | `daily` | `weekly` | `monthly`

### 配置技术指标

```tsx
<KLineChart
  symbol="sh600519"
  indicators={['ma', 'volume', 'macd', 'kdj']}
  indicatorOptions={{
    ma: { periods: [5, 10, 20, 60] },
    macd: { short: 12, long: 26, signal: 9 },
  }}
/>
```

### 深色主题

```tsx
<KLineChart
  symbol="sh600519"
  theme="dark"
/>
```

### 自动刷新（分时模式）

```tsx
<KLineChart
  symbol="sh600519"
  period="timeline"
  autoRefresh={{ intervalMs: 5000, onlyTradingTime: true }}
/>
```

### 自定义数据源

解决跨域问题或接入自有行情源：

```tsx
import { KLineChart, type KLineDataProvider } from 'kline-charts';

const customProvider: KLineDataProvider = {
  getKline: async (params, signal) => {
    const res = await fetch(`/api/kline?symbol=${params.symbol}`, { signal });
    return res.json();
  },
  getTimeline: async (params, signal) => {
    const res = await fetch(`/api/timeline?symbol=${params.symbol}`, { signal });
    return res.json();
  },
};

<KLineChart
  symbol="sh600519"
  dataProvider={customProvider}
/>
```

### 使用 Ref 控制图表

```tsx
import { useRef } from 'react';
import { KLineChart, type KLineChartRef } from 'kline-charts';

function App() {
  const chartRef = useRef<KLineChartRef>(null);

  const handleRefresh = () => {
    chartRef.current?.refresh();
  };

  const handleExport = () => {
    const dataUrl = chartRef.current?.exportImage('png');
    // 下载图片...
  };

  return (
    <>
      <button onClick={handleRefresh}>刷新</button>
      <button onClick={handleExport}>导出图片</button>
      <KLineChart ref={chartRef} symbol="sh600519" />
    </>
  );
}
```

## API 文档

### KLineChartProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `symbol` | `string` | **必填** | 股票代码，如 `sh600519`、`sz000001` |
| `market` | `'A' \| 'HK' \| 'US'` | `'A'` | 市场类型 |
| `period` | `PeriodType` | `'daily'` | K 线周期 |
| `adjust` | `'' \| 'qfq' \| 'hfq'` | `'hfq'` | 复权类型 |
| `height` | `number \| string` | `500` | 图表高度 |
| `width` | `number \| string` | `'100%'` | 图表宽度 |
| `theme` | `'light' \| 'dark' \| ThemeConfig` | `'light'` | 主题配置 |
| `indicators` | `IndicatorType[]` | `['ma', 'volume', 'macd']` | 启用的技术指标 |
| `indicatorOptions` | `IndicatorOptions` | - | 指标参数配置 |
| `showToolbar` | `boolean` | `true` | 是否显示工具栏 |
| `showPeriodSelector` | `boolean` | `true` | 是否显示周期切换 |
| `showIndicatorSelector` | `boolean` | `true` | 是否显示指标切换 |
| `visibleCount` | `number` | `60` | 初始可见 K 线数量 |
| `dataProvider` | `KLineDataProvider` | - | 自定义数据源 |
| `sdkOptions` | `SDKOptions` | - | stock-sdk 配置 |
| `requestOptions` | `RequestOptions` | - | 请求控制配置 |
| `autoRefresh` | `boolean \| AutoRefreshOptions` | - | 自动刷新配置 |
| `echartsOption` | `EChartsOption` | - | 自定义 ECharts 配置 |
| `onDataLoad` | `(data: KlineData[]) => void` | - | 数据加载回调 |
| `onPeriodChange` | `(period: PeriodType) => void` | - | 周期切换回调 |
| `onError` | `(error: Error) => void` | - | 错误回调 |

### KLineChartRef

| 方法 | 说明 |
|------|------|
| `refresh()` | 刷新数据 |
| `setPeriod(period)` | 切换周期 |
| `setIndicators(indicators)` | 切换指标 |
| `zoomTo(start, end)` | 缩放到指定范围 |
| `resetZoom()` | 重置缩放 |
| `getEchartsInstance()` | 获取 ECharts 实例 |
| `exportImage(type?)` | 导出图片（png/jpeg） |
| `getData()` | 获取当前数据 |

### PeriodType

```ts
type PeriodType =
  | 'timeline'   // 分时
  | 'timeline5'  // 五日分时
  | '1'          // 1分钟
  | '5'          // 5分钟
  | '15'         // 15分钟
  | '30'         // 30分钟
  | '60'         // 60分钟
  | 'daily'      // 日K
  | 'weekly'     // 周K
  | 'monthly';   // 月K
```

### IndicatorType

```ts
type IndicatorType =
  | 'ma'      // 移动平均线
  | 'macd'    // MACD
  | 'boll'    // 布林带
  | 'kdj'     // KDJ
  | 'rsi'     // RSI
  | 'wr'      // WR
  | 'bias'    // BIAS
  | 'cci'     // CCI
  | 'atr'     // ATR
  | 'volume'; // 成交量
```

## 主题定制

### 内置主题

```tsx
// 浅色主题（默认）
<KLineChart theme="light" />

// 深色主题
<KLineChart theme="dark" />
```

### 自定义主题

```tsx
<KLineChart
  theme={{
    backgroundColor: '#1a1a2e',
    textColor: '#eaeaea',
    upColor: '#26a69a',
    downColor: '#ef5350',
    gridLineColor: '#2a2a4a',
    // ... 更多配置
  }}
/>
```

## 处理跨域

由于 stock-sdk 默认请求腾讯财经接口，浏览器环境可能遇到跨域问题。推荐解决方案：

### 方案 1：配置代理（开发环境）

```ts
// vite.config.ts
export default {
  server: {
    proxy: {
      '/qt': {
        target: 'https://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/qt/, ''),
      },
    },
  },
};
```

```tsx
<KLineChart
  symbol="sh600519"
  sdkOptions={{ baseUrl: '/qt' }}
/>
```

### 方案 2：自定义 DataProvider

使用自己的后端接口代理数据：

```tsx
<KLineChart
  symbol="sh600519"
  dataProvider={myDataProvider}
/>
```

## 目录结构

```
kline-charts/
├── src/
│   ├── components/       # 子组件
│   │   ├── Loading/
│   │   ├── PeriodSelector/
│   │   ├── IndicatorSelector/
│   │   ├── Toolbar/
│   │   └── MADisplay/
│   ├── hooks/            # React Hooks
│   │   ├── useKlineData.ts
│   │   ├── useEcharts.ts
│   │   └── useZoomHistory.ts
│   ├── utils/            # 工具函数
│   │   ├── indicators.ts
│   │   ├── optionBuilder.ts
│   │   └── timelineBuilder.ts
│   ├── types/            # 类型定义
│   ├── KLineChart.tsx    # 主组件
│   └── index.ts          # 入口
├── playground/           # 调试环境
└── dist/                 # 构建产物
```

## 开发

```bash
# 安装依赖
npm install

# 启动 playground 调试
npm run playground

# 构建
npm run build

# 代码检查
npm run lint
```

## License

MIT © 2024
