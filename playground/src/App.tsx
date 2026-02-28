import { useState, useRef } from 'react';
import { KLineChart, type KLineChartRef, type MarketType, type PeriodType } from 'kline-charts-react';

const DEMO_STOCKS = [
  { symbol: 'sh600519', name: '贵州茅台', market: 'A' as MarketType },
  { symbol: 'sh601318', name: '中国平安', market: 'A' as MarketType },
  { symbol: 'sz000001', name: '平安银行', market: 'A' as MarketType },
  { symbol: 'sh000001', name: '上证指数', market: 'A' as MarketType },
  { symbol: 'sz399001', name: '深证成指', market: 'A' as MarketType },
];

function App() {
  const chartRef = useRef<KLineChartRef>(null);
  const [selectedStock, setSelectedStock] = useState(DEMO_STOCKS[0]!);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [inputSymbol, setInputSymbol] = useState('');
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const handleExport = () => {
    const dataUrl = chartRef.current?.exportImage('png');
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `${selectedStock.symbol}_kline.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleCustomSymbol = () => {
    if (inputSymbol.trim()) {
      setSelectedStock({
        symbol: inputSymbol.trim(),
        name: inputSymbol.trim(),
        market: 'A',
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 20,
        background: theme === 'dark' ? '#121212' : '#f5f5f5',
        transition: 'background 0.3s',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          padding: '12px 16px',
          background: theme === 'dark' ? '#1e1e1e' : '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: theme === 'dark' ? '#fff' : '#333',
          }}
        >
          📈 KLine Charts Playground
        </h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: theme === 'dark' ? '#ccc' : '#666',
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            自动刷新（分时）
          </label>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              color: '#fff',
              background: '#1890ff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            导出图片
          </button>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              color: theme === 'dark' ? '#fff' : '#333',
              background: theme === 'dark' ? '#333' : '#f0f0f0',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
          </button>
        </div>
      </header>

      {/* Stock Selector */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {DEMO_STOCKS.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => setSelectedStock(stock)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              color: selectedStock.symbol === stock.symbol ? '#fff' : theme === 'dark' ? '#ccc' : '#333',
              background:
                selectedStock.symbol === stock.symbol
                  ? '#1890ff'
                  : theme === 'dark'
                    ? '#2a2a2a'
                    : '#fff',
              border: `1px solid ${selectedStock.symbol === stock.symbol ? '#1890ff' : theme === 'dark' ? '#444' : '#e8e8e8'}`,
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {stock.name}
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                opacity: 0.7,
              }}
            >
              {stock.symbol}
            </span>
          </button>
        ))}

        <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
          <input
            type="text"
            placeholder="输入股票代码（如 sh600000）"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSymbol()}
            style={{
              padding: '10px 12px',
              fontSize: 14,
              width: 220,
              border: `1px solid ${theme === 'dark' ? '#444' : '#e8e8e8'}`,
              borderRadius: 6,
              background: theme === 'dark' ? '#2a2a2a' : '#fff',
              color: theme === 'dark' ? '#ccc' : '#333',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCustomSymbol}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              color: '#1890ff',
              background: 'transparent',
              border: '1px solid #1890ff',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            查询
          </button>
        </div>
      </div>

      {/* Current Info */}
      <div
        style={{
          marginBottom: 16,
          padding: '10px 16px',
          background: theme === 'dark' ? '#1e1e1e' : '#fff',
          borderRadius: 6,
          fontSize: 14,
          color: theme === 'dark' ? '#ccc' : '#666',
          display: 'flex',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <span>
          当前: <strong style={{ color: theme === 'dark' ? '#fff' : '#333' }}>{selectedStock.name}</strong>
        </span>
        <span>
          周期: <strong style={{ color: '#1890ff' }}>{period}</strong>
        </span>
        {autoRefresh && (period === 'timeline' || period === 'timeline5') && (
          <span style={{ color: '#52c41a' }}>
            ⚡ 自动刷新已开启（5秒）
          </span>
        )}
      </div>

      {/* Chart */}
      <div
        style={{
          background: theme === 'dark' ? '#1e1e1e' : '#fff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }}
      >
        <KLineChart
          ref={chartRef}
          symbol={selectedStock.symbol}
          market={selectedStock.market}
          height={750}
          theme={theme}
          indicators={['ma', 'volume', 'macd']}
          autoRefresh={autoRefresh ? { intervalMs: 5000, onlyTradingTime: false } : false}
          sdkOptions={{
            baseUrl: '/qt',
          }}
          onDataLoad={(data) => {
            console.log('数据加载完成:', data.length, '条');
          }}
          onPeriodChange={(p) => {
            console.log('周期切换:', p);
            setPeriod(p);
          }}
          onError={(error) => {
            console.error('加载失败:', error);
          }}
        />
      </div>

      {/* Feature List */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: theme === 'dark' ? '#1e1e1e' : '#fff',
          borderRadius: 8,
          color: theme === 'dark' ? '#ccc' : '#666',
          fontSize: 13,
        }}
      >
        <h3 style={{ marginBottom: 12, color: theme === 'dark' ? '#fff' : '#333' }}>
          ✨ 功能特性
        </h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>分时走势（点击"分时"按钮切换）</li>
          <li>五日分时（点击"五日"按钮切换）</li>
          <li>全屏模式（工具栏右侧按钮）</li>
          <li>均线数值显示（K线模式下方显示MA5/MA10等）</li>
          <li>自动刷新（勾选上方复选框，在分时模式下生效）</li>
          <li>技术指标：MA/MACD/BOLL/KDJ/RSI/WR/BIAS/CCI/ATR/OBV/ROC/DMI/SAR/KC</li>
          <li>复权切换：不复权/前复权/后复权</li>
          <li>缩放/平移/撤销/重做</li>
          <li>深色/浅色主题切换</li>
          <li>导出图片</li>
        </ul>
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: 20,
          padding: 16,
          textAlign: 'center',
          color: theme === 'dark' ? '#666' : '#999',
          fontSize: 13,
        }}
      >
        KLine Charts v0.1.0 · Powered by ECharts + stock-sdk
      </footer>
    </div>
  );
}

export default App;
