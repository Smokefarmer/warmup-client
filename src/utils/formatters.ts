// Format bigint values to human readable format
export const formatBigInt = (value: bigint, decimals: number = 18): string => {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  
  return `${whole}.${trimmedFraction}`;
};

// Format currency values
export const formatCurrency = (value: bigint, symbol: string = 'ETH', decimals: number = 18): string => {
  const formatted = formatBigInt(value, decimals);
  return `${formatted} ${symbol}`;
};

// Format wallet address (truncate middle)
export const formatAddress = (address: string, start: number = 6, end: number = 4): string => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// Format date
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format relative time
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format number with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

// Format status badge
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'running':
    case 'completed':
      return 'success';
    case 'paused':
    case 'pending':
      return 'warning';
    case 'banned':
    case 'failed':
    case 'stopped':
      return 'danger';
    default:
      return 'info';
  }
};
