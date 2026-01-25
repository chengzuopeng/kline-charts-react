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
 * 格式化成交量（万/亿）
 */
export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }
  return value.toFixed(0);
}

/**
 * 格式化成交额（万/亿）
 */
export function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }
  return value.toFixed(2);
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
 * 格式化 K 线 Tooltip
 */
export function formatKlineTooltip(data: {
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
}): string {
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

  return lines.join('');
}
