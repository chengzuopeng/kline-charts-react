# KLine Charts 组件设计文档

> 一个基于 ECharts 的专业级股票 K 线图表 React 组件，内置 stock-sdk 数据源

## 1. 项目概述

### 1.1 目标

构建一个开箱即用的股票 K 线图表组件，开发者只需传入股票代码即可渲染完整的 K 线图，无需关心数据获取细节。

### 1.2 核心特性

- **零配置数据**：内置 stock-sdk，传入股票代码自动获取数据
- **可插拔数据源**：默认使用 stock-sdk，同时支持自定义 `DataProvider`（便于解决跨域/接入自有行情源/SSR）
- **多市场支持**：A 股、港股、美股
- **丰富的周期**：分时、日 K、周 K、月 K、分钟级 K 线
- **技术指标**：MA/MACD/BOLL/KDJ/RSI/WR/BIAS/CCI/ATR
- **交互完善**：缩放、平移、十字准线、Tooltip
- **高度可定制**：主题、颜色、指标参数均可配置
- **响应式设计**：自适应容器尺寸

### 1.3 技术栈

| 分类 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | React 18+ | 现代 React Hooks 模式 |
| 构建 | Vite | 快速构建、支持库模式 |
| 图表 | ECharts 5.x | 成熟的可视化库 |
| 数据 | stock-sdk | 轻量级股票数据 SDK |
| 类型 | TypeScript | 完整类型定义 |
| 样式 | CSS Modules | 隔离样式作用域 |

---

## 2. 交互设计（参考雪球）

### 2.1 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│ [周期切换] 分时 | 五日 | 日K | 周K | 月K | 季K | 年K         │
│ [分钟选项] 120分 | 60分 | 30分 | 15分 | 5分 | 1分            │
├─────────────────────────────────────────────────────────────┤
│ 均线 MA5:xxx MA10:xxx MA20:xxx MA30:xxx MA60:xxx            │
│ [工具栏] ↩ ↪ + - ◀ ▶ ☐ ✓涨跌因 ✓前复权                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      【主图区 - K 线】                        │
│                       (60% 高度)                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   【副图1 - 成交量】                          │
│                     (20% 高度)                               │
├─────────────────────────────────────────────────────────────┤
│                   【副图2 - MACD】                           │
│                     (20% 高度)                               │
├─────────────────────────────────────────────────────────────┤
│ [指标切换] MA | BOLL | 成交量 | MACD | KDJ | RSI | ...       │
│ [功能按钮] 区间统计 | 全屏显示                                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 周期切换

| 周期 | 数据源方法 | 说明 |
|------|-----------|------|
| 分时 | `getTodayTimeline()` | 当日分时走势 |
| 五日 | `getMinuteKline(period='1')` | 最近 5 个交易日分时 |
| 日 K | `getHistoryKline(period='daily')` | 日线 |
| 周 K | `getHistoryKline(period='weekly')` | 周线 |
| 月 K | `getHistoryKline(period='monthly')` | 月线 |
| 1/5/15/30/60 分 | `getMinuteKline(period=x)` | 分钟 K 线 |

### 2.3 交互行为

#### 鼠标操作
| 操作 | 行为 |
|------|------|
| 鼠标移动 | 显示十字准线 + Tooltip 详情 |
| 鼠标滚轮 | 缩放时间轴（放大/缩小可见范围） |
| 鼠标拖拽 | 平移时间轴 |
| 单击 K 线 | 选中并高亮该根 K 线 |
| 双击 | 重置缩放比例 |

#### 工具栏
| 按钮 | 功能 |
|------|------|
| ↩ | 撤销上一步缩放/平移 |
| ↪ | 重做 |
| + | 放大 |
| - | 缩小 |
| ◀ | 向左平移 |
| ▶ | 向右平移 |
| ☐ | 全屏模式 |
| 涨跌因 | 开启/关闭涨跌背景色 |
| 前复权 | 切换复权模式（不复权/前复权/后复权） |

### 2.4 Tooltip 详情

K 线悬停时显示：
```
日期: 2026-01-15
开盘: 106.50
最高: 127.77
最低: 106.83
收盘: 106.83
涨跌: -11.87 (-10.00%)
成交量: 85.24万手
成交额: 93.34亿
换手率: 7.21%
振幅: 7.98%
```

---

## 3. 组件 API 设计

### 3.1 主组件 `<KLineChart />`

```tsx
import { KLineChart } from 'kline-charts';

<KLineChart
  symbol="sh600118"
  market="A"
  period="daily"
  height={600}
  theme="light"
  indicators={['ma', 'volume', 'macd']}
  onDataLoad={(data) => console.log('数据加载完成', data)}
/>
```

### 3.2 Props 定义

```ts
interface KLineChartProps {
  /** 股票代码（必填） */
  symbol: string;
  
  /** 市场类型 */
  market?: 'A' | 'HK' | 'US';
  
  /** K 线周期 */
  period?: 'timeline' | '1' | '5' | '15' | '30' | '60' | 'daily' | 'weekly' | 'monthly';
  
  /** 复权类型 */
  adjust?: '' | 'qfq' | 'hfq';
  
  /** 图表高度（px 或 %） */
  height?: number | string;
  
  /** 图表宽度（默认 100%） */
  width?: number | string;
  
  /** 主题 */
  theme?: 'light' | 'dark' | ThemeConfig;
  
  /** 启用的技术指标（按顺序渲染） */
  indicators?: IndicatorType[];
  
  /** 指标参数配置 */
  indicatorOptions?: IndicatorOptions;
  
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  
  /** 是否显示周期切换 */
  showPeriodSelector?: boolean;
  
  /** 是否显示指标切换 */
  showIndicatorSelector?: boolean;
  
  /** 初始可见 K 线数量 */
  visibleCount?: number;
  
  /** 数据加载回调 */
  onDataLoad?: (data: KlineData[]) => void;
  
  /** 周期切换回调 */
  onPeriodChange?: (period: PeriodType) => void;
  
  /** 错误回调 */
  onError?: (error: Error) => void;
  
  /**
   * 数据源提供者（可选）
   * - 默认：内置 stock-sdk provider
   * - 用途：解决跨域/代理、替换数据源、在服务端预取数据等
   */
  dataProvider?: KLineDataProvider;
  
  /** 自定义 stock-sdk 配置 */
  sdkOptions?: SDKOptions;

  /**
   * 请求与并发控制（可选）
   * - 解决快速切换 symbol/period/adjust 导致的“旧请求回写”和闪动
   */
  requestOptions?: RequestOptions;
  
  /**
   * 自动刷新（可选）
   * - timeline：通常需要按交易时段定时刷新
   * - 其他周期：默认仅手动刷新（可通过配置开启）
   */
  autoRefresh?: boolean | AutoRefreshOptions;
  
  /**
   * 时间轴模式（可选）
   * - trading：压缩非交易时段（更接近交易软件体验）
   * - continuous：保持自然时间连续（更适合跨市场/跨时区对比）
   */
  timeAxis?: TimeAxisOptions;
  
  /**
   * 自定义 ECharts 配置
   * - 默认采用“安全合并”策略（避免数组字段被错误深度合并）
   */
  echartsOption?: EChartsOption;
  
  /** ECharts Option 合并策略 */
  echartsOptionMerge?: EChartsOptionMergeOptions;

  /**
   * 面板配置（可选，扩展点）
   * - 未配置时沿用默认：主图(K线)+副图(成交量)+副图(MACD)
   * - 配置后按 `panes` 动态生成 grid/xAxis/yAxis/series
   */
  panes?: PaneConfig[];
  
  /** 类名 */
  className?: string;
  
  /** 样式 */
  style?: React.CSSProperties;
}

type IndicatorType = 
  | 'ma' 
  | 'macd' 
  | 'boll' 
  | 'kdj' 
  | 'rsi' 
  | 'wr' 
  | 'bias' 
  | 'cci' 
  | 'atr' 
  | 'volume';

type PeriodType = 
  | 'timeline' 
  | '1' | '5' | '15' | '30' | '60' 
  | 'daily' | 'weekly' | 'monthly';

type KLineDataProvider = {
  /**
   * 获取K线数据
   * - 约定：返回的数组按时间升序
   * - signal：用于取消/中断请求（切换周期、卸载等）
   */
  getKline: (params: GetKlineParams, signal?: AbortSignal) => Promise<KlineData[]>;
  
  /** 获取分时数据（可选，timeline 周期使用） */
  getTimeline?: (params: GetTimelineParams, signal?: AbortSignal) => Promise<TimelineData[]>;
};

interface GetKlineParams {
  symbol: string;
  market: 'A' | 'HK' | 'US';
  period: PeriodType;
  adjust: '' | 'qfq' | 'hfq';
  /**
   * 分页/增量加载（可选）
   * - 用于“向左拖动加载更多历史”
   */
  cursor?: string | number;
  limit?: number;
}

interface GetTimelineParams {
  symbol: string;
  market: 'A' | 'HK' | 'US';
}

interface RequestOptions {
  /** 发起请求前的防抖（ms），用于快速切换 period/symbol */
  debounceMs?: number;
  /**
   * 变更参数时取消上一次请求
   * - 默认 true，避免旧请求覆盖新数据
   */
  abortOnChange?: boolean;
  /** 是否允许同参数请求去重（默认 true） */
  dedupe?: boolean;
}

interface AutoRefreshOptions {
  /** 刷新间隔（ms），默认 3000 */
  intervalMs?: number;
  /**
   * 是否仅在交易时段刷新（默认 true）
   * - 各市场交易时段需要考虑午休/盘前盘后/夏令时等差异
   */
  onlyTradingTime?: boolean;
}

type TimeAxisOptions =
  | { mode: 'trading'; sessionCompression?: boolean }
  | { mode: 'continuous' };

interface EChartsOptionMergeOptions {
  /**
   * 合并模式
   * - safeMerge：默认，尽量避免 series/xAxis/yAxis 等数组字段被“深度合并”导致错乱
   * - replace：完全替换（适合业务自建 optionBuilder）
   */
  mode?: 'safeMerge' | 'replace';
  /**
   * 透传给 ECharts setOption 的 replaceMerge
   * - 例如 ['series', 'xAxis', 'yAxis']
   */
  replaceMerge?: string[];
}

type PaneConfig = {
  /** 面板id，便于联动/持久化 */
  id: string;
  /** 面板高度（px 或 %），未填则按权重自适应 */
  height?: number | string;
  /** 面板中展示的内容（K线/成交量/指标等） */
  indicators: IndicatorType[];
};
```

### 3.3 Ref 方法

```ts
interface KLineChartRef {
  /** 刷新数据 */
  refresh(): Promise<void>;
  
  /** 切换周期 */
  setPeriod(period: PeriodType): void;
  
  /** 切换指标 */
  setIndicators(indicators: IndicatorType[]): void;
  
  /** 缩放到指定范围 */
  zoomTo(start: number, end: number): void;
  
  /** 重置缩放 */
  resetZoom(): void;
  
  /** 获取 ECharts 实例 */
  getEchartsInstance(): ECharts | null;
  
  /** 导出图片 */
  exportImage(type?: 'png' | 'jpeg'): string;
  
  /** 获取当前数据 */
  getData(): KlineData[];
}
```

### 3.4 主题配置

```ts
interface ThemeConfig {
  /** 背景色 */
  backgroundColor: string;
  
  /** 文字颜色 */
  textColor: string;
  
  /** 网格线颜色 */
  gridLineColor: string;
  
  /** 上涨颜色 */
  upColor: string;
  
  /** 下跌颜色 */
  downColor: string;
  
  /** 均线颜色（按周期顺序） */
  maColors: string[];
  
  /** 成交量上涨颜色 */
  volumeUpColor: string;
  
  /** 成交量下跌颜色 */
  volumeDownColor: string;
  
  /** 十字准线颜色 */
  crosshairColor: string;
  
  /** Tooltip 背景色 */
  tooltipBgColor: string;
}
```

### 3.5 默认主题

```ts
// 浅色主题
const lightTheme: ThemeConfig = {
  backgroundColor: '#ffffff',
  textColor: '#333333',
  gridLineColor: '#e0e0e0',
  upColor: '#f5222d',      // 红涨
  downColor: '#52c41a',    // 绿跌
  maColors: ['#f5a623', '#1890ff', '#722ed1', '#13c2c2', '#eb2f96'],
  volumeUpColor: '#f5222d',
  volumeDownColor: '#52c41a',
  crosshairColor: '#999999',
  tooltipBgColor: 'rgba(255,255,255,0.95)',
};

// 深色主题
const darkTheme: ThemeConfig = {
  backgroundColor: '#1a1a1a',
  textColor: '#d1d1d1',
  gridLineColor: '#333333',
  upColor: '#f5222d',
  downColor: '#52c41a',
  maColors: ['#f5a623', '#1890ff', '#722ed1', '#13c2c2', '#eb2f96'],
  volumeUpColor: '#f5222d',
  volumeDownColor: '#52c41a',
  crosshairColor: '#666666',
  tooltipBgColor: 'rgba(30,30,30,0.95)',
};
```

---

## 4. 数据流设计

### 4.1 数据获取流程

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  组件挂载    │────▶│ DataProvider  │────▶│  数据解析    │
│  symbol 变化 │     │(内置/自定义)  │     │  指标计算    │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  图表渲染    │◀────│  ECharts     │◀────│  Option     │
│             │     │  setOption   │     │  生成       │
└─────────────┘     └──────────────┘     └─────────────┘
```

### 4.2 数据缓存策略

```ts
interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  
  /** 缓存过期时间（毫秒） */
  ttl: number;
  
  /** 最大缓存条目数 */
  maxSize: number;
}

// 默认缓存配置
const defaultCache: CacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000,  // 5 分钟
  maxSize: 50,
};
```

### 4.3 数据更新机制

| 周期 | 更新策略 |
|------|---------|
| 分时 | 开盘时间内每 3 秒自动刷新 |
| 日 K | 收盘后刷新一次，盘中不刷新 |
| 周/月 K | 仅手动刷新 |

### 4.4 请求管理与并发控制（优化点）

- **取消旧请求**：`symbol/period/adjust` 变化时使用 `AbortController` 中断上一请求，避免慢请求回写旧数据。
- **去重与合并**：同参数请求合并（例如多次 `refresh()`），减少网络负载。
- **防抖**：用户快速切换周期/复权时，短时间内只保留最后一次请求（`requestOptions.debounceMs`）。
- **重试策略**：默认沿用 stock-sdk 的重试/退避能力；自定义 provider 可自行实现。

### 4.5 交易时段与时间轴（优化点）

- **交易时段驱动刷新**：分时默认仅在交易时段刷新（A/HK 午休，美股盘前/盘后、夏令时等需要可配置）。
- **时间轴缺口处理**：
  - `mode: 'trading'`：压缩非交易时段，减少空洞，缩放/十字准线更贴近交易软件。
  - `mode: 'continuous'`：保持自然时间连续，适合跨市场/跨时区对比。

---

## 5. ECharts 配置方案

### 5.1 图表布局

```ts
const gridConfig = {
  // 主图（K 线）
  mainGrid: {
    left: 60,
    right: 60,
    top: 60,
    height: '50%',
  },
  // 副图1（成交量）
  volumeGrid: {
    left: 60,
    right: 60,
    top: '65%',
    height: '15%',
  },
  // 副图2（MACD）
  indicatorGrid: {
    left: 60,
    right: 60,
    top: '83%',
    height: '12%',
  },
};
```

### 5.2 K 线 Series 配置

```ts
const candlestickSeries = {
  type: 'candlestick',
  name: 'K线',
  data: [], // [open, close, low, high]
  itemStyle: {
    color: upColor,        // 阳线填充
    color0: downColor,     // 阴线填充
    borderColor: upColor,  // 阳线边框
    borderColor0: downColor,
  },
};
```

### 5.3 DataZoom 配置

```ts
const dataZoom = [
  {
    type: 'inside',
    xAxisIndex: [0, 1, 2],  // 联动所有 X 轴
    start: 70,
    end: 100,
    minValueSpan: 10,       // 最少显示 10 根 K 线
  },
  {
    type: 'slider',
    xAxisIndex: [0, 1, 2],
    bottom: 10,
    height: 20,
    start: 70,
    end: 100,
  },
];
```

### 5.4 Tooltip 配置

```ts
const tooltip = {
  trigger: 'axis',
  axisPointer: {
    type: 'cross',
    crossStyle: {
      color: '#999',
    },
  },
  formatter: (params) => {
    // 自定义 Tooltip 格式化
    return formatKlineTooltip(params);
  },
};
```

### 5.5 Option 合并策略（优化点）

ECharts `setOption` 对 `series/xAxis/yAxis` 等数组字段的合并规则较复杂，简单“深度合并”容易导致：
- 指标切换后 series 堆叠/重复
- 多 grid 场景下 xAxisIndex/yAxisIndex 对应错乱

因此建议：
- 默认使用“安全合并”（内部基于 `replaceMerge` 做关键数组字段替换）。
- 高度定制场景使用 `echartsOptionMerge.mode: 'replace'` 直接完全替换 option。

---

## 6. 目录结构

```
kline-charts/
├── src/
│   ├── index.ts                    # 入口导出
│   ├── KLineChart.tsx              # 主组件
│   ├── components/
│   │   ├── Toolbar/                # 工具栏
│   │   │   ├── Toolbar.tsx
│   │   │   └── Toolbar.module.css
│   │   ├── PeriodSelector/         # 周期选择器
│   │   │   ├── PeriodSelector.tsx
│   │   │   └── PeriodSelector.module.css
│   │   ├── IndicatorSelector/      # 指标选择器
│   │   │   ├── IndicatorSelector.tsx
│   │   │   └── IndicatorSelector.module.css
│   │   └── Loading/                # 加载状态
│   │       └── Loading.tsx
│   ├── hooks/
│   │   ├── useKlineData.ts         # 数据获取 Hook
│   │   ├── useEcharts.ts           # ECharts 实例管理
│   │   ├── useIndicators.ts        # 指标计算
│   │   └── useZoomHistory.ts       # 缩放历史（撤销/重做）
│   ├── utils/
│   │   ├── optionBuilder.ts        # ECharts Option 构建
│   │   ├── formatters.ts           # 数据格式化
│   │   ├── cache.ts                # 数据缓存
│   │   └── theme.ts                # 主题处理
│   ├── types/
│   │   ├── index.ts                # 类型导出
│   │   ├── props.ts                # 组件 Props 类型
│   │   ├── data.ts                 # 数据类型
│   │   └── theme.ts                # 主题类型
│   └── styles/
│       └── index.css               # 全局样式
├── playground/                     # 本地调试场（Vite Dev Server）
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── vite.config.ts              # alias 到 ../src 实现 HMR
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 7. 构建与发布

### 7.1 构建产物

```
dist/
├── index.js          # ESM 格式
├── index.cjs         # CommonJS 格式
├── index.d.ts        # 类型声明
├── style.css         # 样式文件
└── index.umd.js      # UMD 格式（CDN 使用）
```

### 7.2 package.json 配置

```json
{
  "name": "kline-charts",
  "version": "1.0.0",
  "description": "Professional stock K-line chart component with built-in data source",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  },
  "dependencies": {
    "echarts": "^5.5.0",
    "stock-sdk": "^1.0.0"
  },
  "keywords": ["kline", "stock", "chart", "echarts", "react", "candlestick"]
}
```

### 7.2.1 依赖与体积优化（优化点）

- **按需引入 ECharts**：优先使用 `echarts/core` + 按需注册图表/组件，减少 bundle 体积。
- **依赖策略**：如果使用方项目本身已依赖 ECharts，可考虑将 `echarts` 调整为 `peerDependencies`（避免重复打包与版本冲突）。

### 7.3 Vite 库模式配置

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'KLineCharts',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `index.${format === 'es' ? 'js' : format === 'cjs' ? 'cjs' : 'umd.js'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

### 7.4 Playground（本地实时调试）

目标：提供一个本地可运行的调试 App，用于实时验证组件交互、指标切换、主题、数据源等（支持 HMR）。

#### 7.4.1 目录与依赖策略

推荐在仓库内新增 `playground/`（Vite + React）：
- playground 直接运行 `vite dev`。
- 通过 Vite `alias` 将 `kline-charts` 指向 `../src`（而不是依赖 `dist`），从而实现组件源码级热更新（HMR）。

#### 7.4.2 关键配置（示意）

`playground/vite.config.ts` 建议包含：
- `server.fs.allow: ['..']`（允许访问上级目录的组件源码）
- `resolve.alias`：
  - `kline-charts` -> `../src/index.ts`
  - `kline-charts/style.css` -> `../src/styles/index.css`

#### 7.4.3 启动方式（示意）

在实现了 `playground/` 后：
- 安装依赖：`pnpm i`（或 `npm i`）
- 启动调试：`pnpm -C playground dev`（或 `npm --prefix playground run dev`）

> 注：如果未来将项目升级为 monorepo（如 `packages/kline-charts` + `playground`），也可用 workspace 方式依赖本地包；但无论哪种方式，playground 都建议最终指向源码（而非 dist）以获得最佳调试体验。

---

## 8. 使用示例

### 8.1 基础用法

```tsx
import { KLineChart } from 'kline-charts';
import 'kline-charts/style.css';

function App() {
  return (
    <KLineChart 
      symbol="sh600118" 
      height={600}
    />
  );
}
```

### 8.2 自定义指标

```tsx
<KLineChart
  symbol="sh600118"
  indicators={['ma', 'volume', 'kdj']}
  indicatorOptions={{
    ma: { periods: [5, 10, 20, 60] },
    kdj: { period: 9, kPeriod: 3, dPeriod: 3 },
  }}
/>
```

### 8.3 深色主题

```tsx
<KLineChart
  symbol="sh600118"
  theme="dark"
/>
```

### 8.4 港股/美股

```tsx
// 港股
<KLineChart symbol="00700" market="HK" />

// 美股
<KLineChart symbol="105.AAPL" market="US" />
```

### 8.5 事件处理

```tsx
const chartRef = useRef<KLineChartRef>(null);

<KLineChart
  ref={chartRef}
  symbol="sh600118"
  onPeriodChange={(period) => console.log('周期切换', period)}
  onDataLoad={(data) => console.log('数据加载', data.length)}
  onError={(err) => console.error('加载失败', err)}
/>

// 导出图片
const exportChart = () => {
  const dataUrl = chartRef.current?.exportImage('png');
  // ...
};
```

---

## 9. 开发计划

### Phase 1 - MVP（v0.1.0）
- [x] 设计文档
- [ ] 项目初始化（Vite + React + TypeScript）
- [ ] 基础 K 线渲染（日 K）
- [ ] stock-sdk 集成
- [ ] 成交量副图
- [ ] 基础交互（缩放、平移、Tooltip）

### Phase 2 - 核心功能（v0.2.0）
- [ ] 周期切换（日/周/月 K）
- [ ] 分钟 K 线
- [ ] 分时走势
- [ ] MA 指标
- [ ] MACD 指标

### Phase 3 - 完善指标（v0.3.0）
- [ ] BOLL 指标
- [ ] KDJ 指标
- [ ] RSI/WR/BIAS/CCI/ATR
- [ ] 指标参数可配置

### Phase 4 - 增强体验（v0.4.0）
- [ ] 工具栏完善
- [ ] 撤销/重做
- [ ] 全屏模式
- [ ] 区间统计
- [ ] 复权切换

### Phase 5 - 发布（v1.0.0）
- [ ] 深色主题
- [ ] 港股/美股适配
- [ ] 单元测试
- [ ] 文档 & Demo
- [ ] npm 发布

---

## 10. 注意事项

### 10.1 跨域问题

stock-sdk 在浏览器端使用腾讯/东方财富接口存在跨域限制：
- 搜索接口使用 JSONP
- 其他接口需配置代理（开发时）或后端中转（生产）

**建议**：
- 默认实现支持 `sdkOptions.baseUrl` 配置代理地址。
- 对跨域/鉴权/自有行情源等场景，优先通过 `dataProvider` 由业务侧接管请求（组件只负责渲染与交互）。

### 10.2 性能优化

- ECharts `notMerge: false` 增量更新
- 大数据量时启用 `large: true` 模式
- 使用 `requestAnimationFrame` 节流 Tooltip 更新
- 缓存计算后的指标数据

### 10.3 移动端适配

- 触摸手势支持（捏合缩放、滑动平移）
- 简化工具栏布局
- 增大触控热区

---

## 附录 A：stock-sdk 方法映射

| 组件功能 | SDK 方法 | 返回类型 |
|---------|----------|---------|
| A 股日 K | `getHistoryKline()` | `HistoryKline[]` |
| A 股分钟 K | `getMinuteKline()` | `MinuteKline[]` |
| A 股分时 | `getTodayTimeline()` | `TodayTimelineResponse` |
| 港股日 K | `getHKHistoryKline()` | `HKUSHistoryKline[]` |
| 美股日 K | `getUSHistoryKline()` | `HKUSHistoryKline[]` |
| 带指标 K 线 | `getKlineWithIndicators()` | `KlineWithIndicators[]` |
| 股票搜索 | `search()` | `SearchResult[]` |

---

## 附录 B：颜色规范

| 语义 | 浅色主题 | 深色主题 |
|------|---------|---------|
| 上涨 | `#f5222d` | `#f5222d` |
| 下跌 | `#52c41a` | `#52c41a` |
| MA5 | `#f5a623` | `#f5a623` |
| MA10 | `#1890ff` | `#1890ff` |
| MA20 | `#722ed1` | `#722ed1` |
| MA30 | `#13c2c2` | `#13c2c2` |
| MA60 | `#eb2f96` | `#eb2f96` |
| BOLL 上轨 | `#faad14` | `#faad14` |
| BOLL 中轨 | `#1890ff` | `#1890ff` |
| BOLL 下轨 | `#722ed1` | `#722ed1` |

---

*文档版本：v1.0.0*  
*最后更新：2026-01-15*
