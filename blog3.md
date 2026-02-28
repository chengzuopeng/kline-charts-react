# 分享一个开箱即用的 React K 线图组件，前端炒股看盘必备

> 一个 prop 画出专业 K 线图，数据获取和指标计算全自动。

## 为什么又造了个轮子

先说结论：不是我想造，是被逼的。

需求很简单 —— 在一个 React 项目里加一个股票 K 线图，要能切周期、看指标、支持缩放拖拽。听起来是不是很基础？

然后我开始找现成方案。TradingView 的 Lightweight Charts 不错，但免费版功能有限，而且它不是 React 组件，得自己封装一层。npm 上搜 "react kline" 或者 "react candlestick"，出来的结果要么年久失修，要么只是个 demo 级别的东西，拿来用还不如自己写。

既然找不到趁手的，那就自己搞一个。顺便把它做得通用一点，发出来给大家省点时间。

## 长什么样

项目名叫 **kline-charts-react**，MIT 开源。

[GitHub](https://github.com/chengzuopeng/kline-charts-react) | [npm](https://www.npmjs.com/package/kline-charts-react)

上手非常简单：

```tsx
import { KLineChart } from 'kline-charts-react';
import 'kline-charts-react/style.css';

function App() {
  return <KLineChart symbol="sh600519" height={600} />;
}
```

就这些。传一个股票代码，组件会自动拉取数据、计算技术指标、渲染出完整的 K 线图。

## 能做什么

对标了一下雪球的交互，主要功能包括：

**周期全覆盖** —— 分时、五日分时、日 K、周 K、月 K，加上 1/5/15/30/60 分钟线，看长线看短线都行。

**15 种技术指标** —— MA、BOLL、MACD、KDJ、RSI、WR、BIAS、CCI、ATR、OBV、ROC、DMI、SAR、KC，全部前端实时计算。你选了哪些指标，Tooltip 里就展示哪些指标的值，主图副图都有。写这些指标算法的过程就不回忆了，总之 DMI 那四条线和 SAR 的抛物线让我对金融数学有了全新的认识（敬畏）。

**丰富的交互** —— 鼠标滚轮缩放、拖拽平移、十字准线、数据 Tooltip、缩放历史撤销/重做、全屏模式、导出图片。

**主题切换** —— 内置明暗两套主题，也接受自定义颜色对象，想配成什么风格都行。

**复权处理** —— 前复权、后复权、不复权，默认前复权。看长期走势的时候前复权是标配。

## 数据怎么来的 —— stock-sdk

K 线图组件最关键的问题其实不是怎么画图，而是数据从哪来。

前端领域获取股票行情一直是个空白地带。Python 那边有 akshare、tushare 这些成熟方案，但前端工程师想拿个行情数据，通常得起一套 Python 服务当中间层，链路长不说，维护起来也麻烦。

为了填这个空缺，我做了一个专门面向前端的股票数据 SDK：[stock-sdk](https://stock-sdk.linkdiary.cn/)。

定位很清楚：**让 JavaScript/TypeScript 开发者用最简单的方式获取股票行情和 K 线数据。**

几个关键信息：

- **纯 TS 实现，零外部依赖**，压缩后体积不到 20KB
- **浏览器和 Node.js 通吃**，ESM/CJS 双格式，哪个环境都能跑
- **支持 A 股、港股、美股和公募基金**，实时行情、历史 K 线都有
- **内置常用技术指标**，MA、MACD、BOLL、KDJ、RSI 等开箱可用
- **TypeScript 类型齐全**，IDE 里有完整的智能提示

十行代码感受一下：

```ts
import { StockSDK } from 'stock-sdk';

const sdk = new StockSDK();

// 批量获取实时行情
const quotes = await sdk.getSimpleQuotes(['sh600519', 'sz000858']);
quotes.forEach(q => {
  console.log(`${q.name}: ${q.price} (${q.changePercent}%)`);
});

// 获取前复权日 K 线
const kline = await sdk.getKline('sh600519', { period: 'daily', adjust: 'qfq' });
```

kline-charts-react 的数据层就是 stock-sdk 驱动的。你传入股票代码，stock-sdk 自动去拉行情数据，组件拿到数据后计算指标、构建图表配置、渲染到页面上。全程浏览器端完成，不需要你自己搭后端。

stock-sdk 也完全可以独立使用 —— 做行情看板、写抓取脚本、搭量化原型验证，都很方便。

完整文档在这里：[stock-sdk.linkdiary.cn](https://stock-sdk.linkdiary.cn/)

如果你有自己的行情接口，组件也留了口子，支持自定义数据源替换。

## 渲染层为什么选 ECharts

图表渲染用的 ECharts。选它的原因比较朴素：成熟、稳定、社区大、文档全。K 线图（Candlestick）、折线图、柱状图、散点图这几种类型 ECharts 都有原生支持，加上它的 dataZoom、tooltip、axisPointer 这些交互组件，省了我大量的工作。

体积方面不用太担心 —— 组件内部做了按需注册，只引入了实际用到的 chart 和 component，没有全量导入。echarts 作为 peerDependency 处理，不会打进组件包里。组件自身构建产物 **77KB**（gzip 约 **19KB**）。

## 几个值得一提的设计

### 1. 简单场景简单用

默认配置下只需要传 `symbol`，开箱即用：

```tsx
<KLineChart symbol="sh600519" />
```

需要精细控制的时候，全部通过 props 配：

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

### 2. 数据源替换

内置数据源不满足需求时，传一个 `dataProvider` 就能把数据获取逻辑换成你自己的：

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

K 线数据格式就是标准的 OHLCV（`date, open, close, high, low, volume, amount`），分时数据是 `time, price, volume, amount, avgPrice`。只要按这个格式返回就行，指标计算的事儿交给组件。

### 3. Ref 方法

组件对外暴露了 `ref`，方便在组件外部做程序化控制：

```tsx
const chartRef = useRef<KLineChartRef>(null);

chartRef.current?.refresh();                    // 刷新
chartRef.current?.exportImage('png');            // 导出图片
chartRef.current?.setPeriod('weekly');            // 切换周期
chartRef.current?.getEchartsInstance();           // 获取 ECharts 实例
```

### 4. 分时自动轮询

看分时的时候一般需要持续刷新数据。组件内置了定时轮询，还能设定仅在开盘时间段内刷新：

```tsx
<KLineChart
  symbol="sh600519"
  period="timeline"
  autoRefresh={{ intervalMs: 5000, onlyTradingTime: true }}
/>
```

## 怎么装

```bash
yarn add kline-charts-react

# 还需要安装 peer dependencies
yarn add react react-dom echarts
```

echarts 是 peerDependency 而不是 dependency，所以如果你项目中已经装了 echarts，不会出现两份 echarts 的情况。

## 已知局限

提前说清楚几个还没解决的问题：

- **移动端触控**：桌面端的交互打磨得比较细了，但移动端的捏合缩放、双指操作还没有专门处理
- **导出图片不完整**：左上角的指标数值是 React DOM 渲染的，不在 ECharts Canvas 里，所以导出图片不会包含这部分
- **没有 WebSocket**：实时数据目前只能通过轮询，后续考虑接入 WebSocket 推送

后面会逐步完善这些。

## 总结

一个为 React 项目设计的 K 线图组件，传入股票代码即可渲染，内置 [stock-sdk](https://stock-sdk.linkdiary.cn/) 数据源、15 种技术指标、完善的交互操作，支持自定义数据源和主题。

有需要的同学可以试试，有任何反馈欢迎到 GitHub 交流。

Star 随缘，但如果你点了，那我掉的那些头发就算没白掉。

---

- GitHub: https://github.com/chengzuopeng/kline-charts-react
- npm: https://www.npmjs.com/package/kline-charts-react
- stock-sdk 文档: https://stock-sdk.linkdiary.cn/
- License: MIT
