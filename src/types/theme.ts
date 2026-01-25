/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 背景色 */
  backgroundColor: string;
  /** 文字颜色 */
  textColor: string;
  /** 次要文字颜色 */
  textColorSecondary: string;
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
  /** Tooltip 边框颜色 */
  tooltipBorderColor: string;
  /** 分割线颜色 */
  splitLineColor: string;
  /** 区域填充颜色（分时图下方） */
  areaColor: string;
  /** 选中高亮色 */
  activeColor: string;
}

/**
 * 浅色主题
 */
export const lightTheme: ThemeConfig = {
  backgroundColor: '#ffffff',
  textColor: '#333333',
  textColorSecondary: '#999999',
  gridLineColor: '#e0e0e0',
  upColor: '#f5222d',
  downColor: '#52c41a',
  maColors: ['#f5a623', '#1890ff', '#722ed1', '#13c2c2', '#eb2f96', '#faad14', '#a0d911'],
  volumeUpColor: '#f5222d',
  volumeDownColor: '#52c41a',
  crosshairColor: '#999999',
  tooltipBgColor: 'rgba(255,255,255,0.96)',
  tooltipBorderColor: '#e0e0e0',
  splitLineColor: '#f0f0f0',
  areaColor: 'rgba(24,144,255,0.1)',
  activeColor: '#1890ff',
};

/**
 * 深色主题
 */
export const darkTheme: ThemeConfig = {
  backgroundColor: '#1a1a1a',
  textColor: '#d1d1d1',
  textColorSecondary: '#666666',
  gridLineColor: '#333333',
  upColor: '#f5222d',
  downColor: '#52c41a',
  maColors: ['#f5a623', '#1890ff', '#722ed1', '#13c2c2', '#eb2f96', '#faad14', '#a0d911'],
  volumeUpColor: '#f5222d',
  volumeDownColor: '#52c41a',
  crosshairColor: '#666666',
  tooltipBgColor: 'rgba(30,30,30,0.96)',
  tooltipBorderColor: '#333333',
  splitLineColor: '#2a2a2a',
  areaColor: 'rgba(24,144,255,0.15)',
  activeColor: '#1890ff',
};

/**
 * 获取主题配置
 */
export function getTheme(theme: 'light' | 'dark' | ThemeConfig): ThemeConfig {
  if (typeof theme === 'string') {
    return theme === 'dark' ? darkTheme : lightTheme;
  }
  return { ...lightTheme, ...theme };
}
