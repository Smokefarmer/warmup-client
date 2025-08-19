// Validate Ethereum address format
export const isValidEthereumAddress = (address: string): boolean => {
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegex.test(address);
};

// Validate private key format
export const isValidPrivateKey = (privateKey: string): boolean => {
  const privateKeyRegex = /^0x[a-fA-F0-9]{64}$/;
  return privateKeyRegex.test(privateKey);
};

// Validate chain ID
export const isValidChainId = (chainId: number): boolean => {
  return Number.isInteger(chainId) && chainId > 0;
};

// Validate amount (positive bigint)
export const isValidAmount = (amount: bigint): boolean => {
  return amount > 0n;
};

// Validate wallet type
export const isValidWalletType = (type: string): boolean => {
  const validTypes = ['TrendTrader', 'MajorTrader', 'Holder', 'Trencher'];
  return validTypes.includes(type);
};

// Validate wallet status
export const isValidWalletStatus = (status: string): boolean => {
  const validStatuses = ['active', 'paused', 'banned'];
  return validStatuses.includes(status);
};

// Validate warmup status
export const isValidWarmupStatus = (status: string): boolean => {
  const validStatuses = ['pending', 'running', 'completed', 'failed', 'stopped'];
  return validStatuses.includes(status);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate required field
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

// Validate array length
export const isValidArrayLength = (array: any[], min: number, max?: number): boolean => {
  if (!Array.isArray(array)) return false;
  if (array.length < min) return false;
  if (max !== undefined && array.length > max) return false;
  return true;
};

// Validate number range
export const isValidNumberRange = (value: number, min: number, max: number): boolean => {
  return Number.isFinite(value) && value >= min && value <= max;
};

// Validate percentage (0-100)
export const isValidPercentage = (value: number): boolean => {
  return isValidNumberRange(value, 0, 100);
};

// Validate positive integer
export const isValidPositiveInteger = (value: number): boolean => {
  return Number.isInteger(value) && value > 0;
};

// Validate non-negative integer
export const isValidNonNegativeInteger = (value: number): boolean => {
  return Number.isInteger(value) && value >= 0;
};
