/**
 * 格式化数字（千分位）
 */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化价格
 */
export function formatPrice(value: number | null | undefined): string {
  return formatNumber(value, 2);
}

/**
 * 格式化涨跌幅（带百分号和正负号）
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * 格式化涨跌额（带正负号）
 */
export function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

/**
 * 智能格式化数值：整数不显示小数部分
 */
function smartNumber(value: number, decimals: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  const formatted = value.toFixed(decimals);
  // 移除末尾的 0 和不必要的小数点
  return formatted.replace(/\.?0+$/, '');
}

/**
 * 格式化成交量（万/亿）
 * 整数不显示 .00
 */
export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  if (value >= 100000000) {
    return `${smartNumber(value / 100000000, 2)}亿`;
  }
  if (value >= 10000) {
    return `${smartNumber(value / 10000, 2)}万`;
  }
  return value.toFixed(0);
}

/**
 * 格式化成交额（万/亿）
 * 整数不显示 .00
 */
export function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  if (value >= 100000000) {
    return `${smartNumber(value / 100000000, 2)}亿`;
  }
  if (value >= 10000) {
    return `${smartNumber(value / 10000, 2)}万`;
  }
  return smartNumber(value, 2);
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return date as string;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

/**
 * Tooltip 数据类型
 */
export interface TooltipData {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume?: number | null;
  amount?: number | null;
  change?: number | null;
  changePercent?: number | null;
  turnoverRate?: number | null;
  amplitude?: number | null;
  // 技术指标数据
  indicators?: string[];
  // 主图指标
  ma?: { ma5?: number | null; ma10?: number | null; ma20?: number | null; ma30?: number | null; ma60?: number | null };
  boll?: { upper: number | null; mid: number | null; lower: number | null };
  sar?: { sar: number | null; trend: number | null };
  kc?: { upper: number | null; mid: number | null; lower: number | null };
  // 副图指标
  macd?: { dif: number | null; dea: number | null; macd: number | null };
  kdj?: { k: number | null; d: number | null; j: number | null };
  rsi?: { rsi6?: number | null; rsi12?: number | null; rsi24?: number | null };
  wr?: { wr6?: number | null; wr10?: number | null };
  bias?: { bias6?: number | null; bias12?: number | null; bias24?: number | null };
  cci?: { cci: number | null };
  atr?: { atr: number | null };
  obv?: { obv: number | null; obvMa: number | null };
  roc?: { roc: number | null; signal: number | null };
  dmi?: { pdi: number | null; mdi: number | null; adx: number | null };
}

/**
 * 格式化 K 线 Tooltip
 */
export function formatKlineTooltip(data: TooltipData): string {
  const lines = [
    `<div style="font-weight:bold;margin-bottom:4px">${data.date}</div>`,
    `<div>开盘: <span style="font-weight:500">${formatPrice(data.open)}</span></div>`,
    `<div>最高: <span style="font-weight:500">${formatPrice(data.high)}</span></div>`,
    `<div>最低: <span style="font-weight:500">${formatPrice(data.low)}</span></div>`,
    `<div>收盘: <span style="font-weight:500">${formatPrice(data.close)}</span></div>`,
  ];

  if (data.change !== undefined && data.changePercent !== undefined) {
    const color =
      data.change !== null && data.change > 0 ? '#f5222d' : data.change !== null && data.change < 0 ? '#52c41a' : 'inherit';
    lines.push(
      `<div>涨跌: <span style="color:${color};font-weight:500">${formatChange(data.change)} (${formatPercent(data.changePercent)})</span></div>`
    );
  }

  if (data.volume !== undefined) {
    lines.push(`<div>成交量: ${formatVolume(data.volume)}</div>`);
  }

  if (data.amount !== undefined) {
    lines.push(`<div>成交额: ${formatAmount(data.amount)}</div>`);
  }

  if (data.turnoverRate !== undefined && data.turnoverRate !== null) {
    lines.push(`<div>换手率: ${data.turnoverRate.toFixed(2)}%</div>`);
  }

  if (data.amplitude !== undefined && data.amplitude !== null) {
    lines.push(`<div>振幅: ${data.amplitude.toFixed(2)}%</div>`);
  }

  // 添加技术指标数据（仅显示已选择的指标）
  const indicators = data.indicators ?? [];
  let hasIndicatorSection = false;
  
  // 主图指标
  if (indicators.includes('ma') && data.ma) {
    if (!hasIndicatorSection) {
      lines.push(`<div style="margin-top:4px;border-top:1px solid #eee;padding-top:4px">MA: ${formatPrice(data.ma.ma5)} / ${formatPrice(data.ma.ma10)} / ${formatPrice(data.ma.ma20)}</div>`);
      hasIndicatorSection = true;
    } else {
      lines.push(`<div>MA: ${formatPrice(data.ma.ma5)} / ${formatPrice(data.ma.ma10)} / ${formatPrice(data.ma.ma20)}</div>`);
    }
  }
  
  if (indicators.includes('boll') && data.boll) {
    if (!hasIndicatorSection) {
      lines.push(`<div style="margin-top:4px;border-top:1px solid #eee;padding-top:4px">BOLL: 上 ${formatPrice(data.boll.upper)} 中 ${formatPrice(data.boll.mid)} 下 ${formatPrice(data.boll.lower)}</div>`);
      hasIndicatorSection = true;
    } else {
      lines.push(`<div>BOLL: 上 ${formatPrice(data.boll.upper)} 中 ${formatPrice(data.boll.mid)} 下 ${formatPrice(data.boll.lower)}</div>`);
    }
  }
  
  if (indicators.includes('sar') && data.sar) {
    const trend = data.sar.trend === 1 ? '↑' : '↓';
    if (!hasIndicatorSection) {
      lines.push(`<div style="margin-top:4px;border-top:1px solid #eee;padding-top:4px">SAR: ${formatPrice(data.sar.sar)} ${trend}</div>`);
      hasIndicatorSection = true;
    } else {
      lines.push(`<div>SAR: ${formatPrice(data.sar.sar)} ${trend}</div>`);
    }
  }
  
  if (indicators.includes('kc') && data.kc) {
    if (!hasIndicatorSection) {
      lines.push(`<div style="margin-top:4px;border-top:1px solid #eee;padding-top:4px">KC: 上 ${formatPrice(data.kc.upper)} 中 ${formatPrice(data.kc.mid)} 下 ${formatPrice(data.kc.lower)}</div>`);
      hasIndicatorSection = true;
    } else {
      lines.push(`<div>KC: 上 ${formatPrice(data.kc.upper)} 中 ${formatPrice(data.kc.mid)} 下 ${formatPrice(data.kc.lower)}</div>`);
    }
  }
  
  // 副图指标
  if (indicators.includes('macd') && data.macd) {
    if (!hasIndicatorSection) {
      lines.push(`<div style="margin-top:4px;border-top:1px solid #eee;padding-top:4px">MACD: DIF ${formatPrice(data.macd.dif)} DEA ${formatPrice(data.macd.dea)} MACD ${formatPrice(data.macd.macd)}</div>`);
      hasIndicatorSection = true;
    } else {
      lines.push(`<div>MACD: DIF ${formatPrice(data.macd.dif)} DEA ${formatPrice(data.macd.dea)} MACD ${formatPrice(data.macd.macd)}</div>`);
    }
  }
  
  if (indicators.includes('kdj') && data.kdj) {
    lines.push(`<div>KDJ: K ${formatPrice(data.kdj.k)} D ${formatPrice(data.kdj.d)} J ${formatPrice(data.kdj.j)}</div>`);
  }
  
  if (indicators.includes('rsi') && data.rsi) {
    lines.push(`<div>RSI: ${formatPrice(data.rsi.rsi6)} / ${formatPrice(data.rsi.rsi12)} / ${formatPrice(data.rsi.rsi24)}</div>`);
  }
  
  if (indicators.includes('wr') && data.wr) {
    lines.push(`<div>WR: ${formatPrice(data.wr.wr6)} / ${formatPrice(data.wr.wr10)}</div>`);
  }
  
  if (indicators.includes('bias') && data.bias) {
    lines.push(`<div>BIAS: ${formatPrice(data.bias.bias6)} / ${formatPrice(data.bias.bias12)} / ${formatPrice(data.bias.bias24)}</div>`);
  }
  
  if (indicators.includes('cci') && data.cci) {
    lines.push(`<div>CCI: ${formatPrice(data.cci.cci)}</div>`);
  }
  
  if (indicators.includes('atr') && data.atr) {
    lines.push(`<div>ATR: ${formatPrice(data.atr.atr)}</div>`);
  }
  
  if (indicators.includes('obv') && data.obv) {
    lines.push(`<div>OBV: ${formatVolume(data.obv.obv)} MA ${formatVolume(data.obv.obvMa)}</div>`);
  }
  
  if (indicators.includes('roc') && data.roc) {
    lines.push(`<div>ROC: ${formatPrice(data.roc.roc)} SIGNAL ${formatPrice(data.roc.signal)}</div>`);
  }
  
  if (indicators.includes('dmi') && data.dmi) {
    lines.push(`<div>DMI: +DI ${formatPrice(data.dmi.pdi)} -DI ${formatPrice(data.dmi.mdi)} ADX ${formatPrice(data.dmi.adx)}</div>`);
  }

  return lines.join('');
}
