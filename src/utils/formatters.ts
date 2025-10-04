// Safe conversion to BigInt that handles floats and various input types
export const safeToBigInt = (value: bigint | string | number | undefined | null): bigint => {
  if (value === undefined || value === null || value === '') {
    return BigInt(0);
  }
  
  if (typeof value === 'bigint') {
    return value;
  }
  
  if (typeof value === 'number') {
    // Convert float to integer by flooring
    return BigInt(Math.floor(value));
  }
  
  // It's a string
  try {
    // If string contains decimal point, parse as float first then floor
    if (value.includes('.')) {
      return BigInt(Math.floor(parseFloat(value)));
    }
    return BigInt(value);
  } catch (error) {
    console.error('Error converting to BigInt:', value, error);
    return BigInt(0);
  }
};

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

// Format currency values - Updated to handle different input types
export const formatCurrency = (value: bigint | string | number, symbol: string = 'ETH', decimals: number = 18): string => {
  try {
    // Use safe conversion to BigInt
    const bigIntValue = safeToBigInt(value);
    const formatted = formatBigInt(bigIntValue, decimals);
    return `${formatted} ${symbol}`;
  } catch (error) {
    console.error('Error formatting currency:', error, value);
    return `0 ${symbol}`;
  }
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

// Get chain-specific currency info
export const getChainCurrencyInfo = (chainId: number) => {
  switch (chainId) {
    case 101: // Solana Mainnet
    case 102: // Solana Devnet  
    case 103: // Solana Testnet
      return { symbol: 'SOL', decimals: 9 };
    case 56: // BNB Smart Chain
      return { symbol: 'BNB', decimals: 18 };
    case 8453: // Base
      return { symbol: 'ETH', decimals: 18 };
    default:
      return { symbol: 'ETH', decimals: 18 }; // Default fallback
  }
};

// Format wallet balance with correct chain decimals and symbol
export const formatWalletBalance = (balance: bigint | string | number, chainId: number): string => {
  const { symbol, decimals } = getChainCurrencyInfo(chainId);
  return formatCurrency(balance, symbol, decimals);
};

// Format mixed chain balances (defaults to most common chain in your system)
export const formatMixedBalance = (balance: bigint | string | number, preferredSymbol?: string): string => {
  // For mixed wallets, default to SOL since that's your main chain
  // You can change this based on your primary chain
  const symbol = preferredSymbol || 'SOL';
  const decimals = symbol === 'SOL' ? 9 : 18;
  return formatCurrency(balance, symbol, decimals);
};
