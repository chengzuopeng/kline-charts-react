# 我写了个 React K 线图组件，因为市面上的要么丑要么贵

> 前端开发者想画个 K 线图有多难？答：比你想象的难。

## 起因

事情是这样的。

前段时间接了个需求，要在页面里嵌一个股票 K 线图。我心想，这还不简单？npm 上搜一搜，装一个不就完了。

然后我就去搜了。

搜完之后我沉默了。

市面上的 K 线图组件，大致分三类：

1. **专业级的** —— TradingView 那种，功能确实强，但商用要授权费，而且体积大到能撑爆你的 bundle
2. **简陋级的** —— 功能勉强能用，但 UI 像是 2012 年的审美，鼠标交互约等于没有
3. **祖传代码级的** —— 上一次更新是三年前，issues 里面全是 "Is this project still maintained?"

我就想，行吧，自己撸一个。

## kline-charts-react

[GitHub](https://github.com/chengzuopeng/kline-charts) | [npm](https://www.npmjs.com/package/kline-charts-react)

直接看效果，最简使用就这么几行：

```tsx
import { KLineChart } from 'kline-charts-react';
import 'kline-charts-react/style.css';

function App() {
  return <KLineChart symbol="sh600519" height={600} />;
}
```

对，你没看错，传个股票代码就行了。数据获取的事儿组件自己搞定。

"等等，数据从哪来的？"

别急，下面专门聊。

## 这玩意儿能干啥

我尽量把雪球那套交互体验搬过来了（虽然还有差距，但也八九不离十了）：

**周期切换**：分时、五日、日 K、周 K、月 K、1/5/15/30/60 分钟，基本上你想看的颗粒度都有。

**技术指标**：MA、BOLL、MACD、KDJ、RSI、WR、BIAS、CCI、ATR、OBV、ROC、DMI、SAR、KC —— 没错，一共 15 个。这些指标全部在前端计算，不依赖后端接口返回。写这些指标公式的时候我重温了一遍大学的数学课（并不是，我大学学的不是金融）。

**交互**：鼠标滚轮缩放、拖拽平移、十字准线、Tooltip、撤销/重做、全屏、导出图片。该有的都有了。

**主题**：浅色/深色主题一键切换，也支持自定义颜色，你想搞个赛博朋克风的 K 线图也不是不行。

**复权**：前复权、后复权、不复权，默认前复权。

## 数据从哪来 —— stock-sdk

做 K 线图最头疼的是什么？不是画图，是搞数据。

你去找股票行情 API，会发现这个领域基本被 Python 生态垄断了 —— tushare、akshare、baostock，一个比一个好用，但它们跟前端没半毛钱关系。前端想拿个 A 股日 K 数据？要么自己去爬接口、处理 GBK 编码、解析各种奇奇怪怪的返回格式，要么搭个 Python 后端做中转。

所以我顺手写了 [stock-sdk](https://stock-sdk.linkdiary.cn/)，一个专门给前端和 Node.js 用的股票行情 SDK。

它解决的问题很直接：**让前端工程师用 JavaScript/TypeScript 就能拿到股票数据，不用再绕一圈 Python。**

几个特点：

- **零依赖**，纯 TypeScript 实现，压缩后不到 20KB
- **双端运行**，浏览器和 Node.js 18+ 都能跑，ESM/CJS 双格式
- **多市场**，A 股、港股、美股、公募基金的实时行情和历史 K 线都能拿
- **内置技术指标计算**，MA、MACD、BOLL、KDJ、RSI 这些常用的都有
- **完整的 TypeScript 类型定义**，写代码有智能提示，不用翻文档猜字段名

用起来大概长这样：

```ts
import { StockSDK } from 'stock-sdk';

const sdk = new StockSDK();

// 获取实时行情
const quotes = await sdk.getSimpleQuotes(['sh600519', 'sz000858']);
quotes.forEach(q => {
  console.log(`${q.name}: ${q.price} (${q.changePercent}%)`);
});

// 获取日 K 数据
const kline = await sdk.getKline('sh600519', { period: 'daily', adjust: 'qfq' });
```

kline-charts-react 内部就是用 stock-sdk 来获取数据的。所以你传个股票代码，组件就能自动把数据拉回来、算好指标、画到图上。整个链路不需要后端参与。

当然，stock-sdk 也可以脱离图表组件单独使用 —— 比如你只想做个行情看板、搞个数据监控脚本，直接用 stock-sdk 就够了。

详细文档可以看这里：[stock-sdk.linkdiary.cn](https://stock-sdk.linkdiary.cn/)

不过话说回来，实际项目里你可能有自己的数据源。所以组件也支持完全替换数据层，后面会说。

## 底层用的啥

渲染层用的 ECharts。

我知道可能有人会问 "为什么不用 Canvas 从头画？" —— 因为我还想早点下班。ECharts 的图表渲染、交互事件、自适应这些都很成熟了，没必要重复造轮子。而且 ECharts 支持按需引入，最终打包只会包含用到的组件（Candlestick、Line、Bar、Scatter），不会把整个 ECharts 都塞进去。

说到体积，组件本身（不算 echarts 和 react）打包后 **77KB**（gzip 后约 19KB）。echarts 作为 peerDependency，不会被重复打包。

## 几个我觉得做得还行的设计

### 1. 零配置也能用，想定制也能定制

最简场景一个 `symbol` 就够了。但如果你有定制需求，API 也足够灵活：

```tsx
<KLineChart
  symbol="sh600519"
  period="weekly"
  adjust="qfq"
  theme="dark"
  indicators={['ma', 'volume', 'kdj', 'rsi']}
  indicatorOptions={{
    ma: { periods: [5, 10, 20, 60] },
  }}
  maxSubPanes={3}
  height={700}
/>
```

指标选哪些、均线周期多少、副图最多显示几个、高度多少，都可以配。

### 2. 数据源可插拔

内置的 stock-sdk 开箱即用挺爽的，但实际项目里你可能有自己的行情数据接口，或者需要在 Node 端做 SSR 获取数据。

所以组件留了 `dataProvider` 接口，你可以完全接管数据获取逻辑：

```tsx
const myProvider = {
  getKline: async (params, signal) => {
    const res = await fetch(`/api/kline?symbol=${params.symbol}&period=${params.period}`, { signal });
    return res.json();
  },
  getTimeline: async (params, signal) => {
    const res = await fetch(`/api/timeline?symbol=${params.symbol}`, { signal });
    return res.json();
  },
};

<KLineChart symbol="sh600519" dataProvider={myProvider} />
```

数据格式也不复杂，K 线就是 `{ date, open, close, high, low, volume, amount }` 这些字段，分时就是 `{ time, price, volume, amount, avgPrice }`。技术指标不用你算，组件拿到原始数据后会自动计算。

### 3. Ref API

有些场景你需要从外部控制图表，比如在别的按钮里触发刷新、导出图片、切换周期。用 `ref` 就行：

```tsx
const chartRef = useRef<KLineChartRef>(null);

// 刷新数据
chartRef.current?.refresh();

// 导出图片
const dataUrl = chartRef.current?.exportImage('png');

// 切换到周 K
chartRef.current?.setPeriod('weekly');

// 拿到 ECharts 实例（高级用法）
const instance = chartRef.current?.getEchartsInstance();
```

### 4. 自动刷新

分时模式下支持自动轮询刷新，还能配置只在交易时间刷新（别浪费请求）：

```tsx
<KLineChart
  symbol="sh600519"
  period="timeline"
  autoRefresh={{ intervalMs: 5000, onlyTradingTime: true }}
/>
```

## 安装

```bash
yarn add kline-charts-react

# 别忘了 peer dependencies
yarn add react react-dom echarts
```

对，echarts 是 peerDependency。这样如果你项目里已经在用 echarts 了，不会重复打包两份。

## 目前的不足

坦诚说几个还没做好的地方：

- **移动端适配**：目前主要针对桌面端优化，移动端的触控交互（捏合缩放之类的）还没有专门处理
- **导出图片**：`exportImage()` 导出的图片只包含 ECharts 画布部分，左上角的指标数值文字（那部分是 React DOM 渲染的）不会出现在导出图片里
- **实时推送**：目前是轮询模式，还没接 WebSocket

这些后续会慢慢补上。

## 最后

这个组件最初是为了解决自己的需求写的，写着写着发现越做越完善，就干脆开源出来了。如果你也有在 React 项目里画 K 线图的需求，欢迎试试看。

有问题或者建议可以到 GitHub 上提 issue，也欢迎 PR。

如果觉得有用的话，给个 Star 呗。毕竟写这些指标计算公式真的挺费头发的。

---

- GitHub: https://github.com/chengzuopeng/kline-charts
- npm: https://www.npmjs.com/package/kline-charts-react
- stock-sdk 文档: https://stock-sdk.linkdiary.cn/
- License: MIT
