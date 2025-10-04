// Chain configuration constants matching the backend guide
export const CHAINS = {
  // Supported chains for multi-chain warmup
  SOLANA: 101,           // Solana Mainnet
  BSC: 56,              // BNB Smart Chain
  
  // Legacy/Additional chains
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
  ETHEREUM_MAINNET: 1,
  POLYGON_MAINNET: 137,
  SOLANA_DEVNET: 102,
  SOLANA_TESTNET: 103
};

// Supported chains configuration for multi-chain warmup
export const SUPPORTED_CHAINS = {
  SOLANA: {
    id: 101,
    name: 'Solana Mainnet',
    symbol: 'SOL',
    decimals: 9,
    color: '#00D4AA',
    icon: '🌞',
    type: 'SOLANA'
  },
  BSC: {
    id: 56, 
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    color: '#F3BA2F',
    icon: '🔶',
    type: 'EVM'
  }
};

export const DEFAULT_CHAIN = SUPPORTED_CHAINS.SOLANA;

export const CHAIN_NAMES = {
  // Supported multi-chain
  [CHAINS.SOLANA]: 'Solana',
  [CHAINS.BSC]: 'BNB Smart Chain',
  
  // Legacy chains
  [CHAINS.BASE_MAINNET]: 'Base Mainnet',
  [CHAINS.BASE_SEPOLIA]: 'Base Sepolia',
  [CHAINS.ETHEREUM_MAINNET]: 'Ethereum Mainnet',
  [CHAINS.POLYGON_MAINNET]: 'Polygon Mainnet',
  [CHAINS.SOLANA_DEVNET]: 'Solana Devnet',
  [CHAINS.SOLANA_TESTNET]: 'Solana Testnet'
};

export const CHAIN_TYPES = {
  // Supported multi-chain
  [CHAINS.SOLANA]: 'SOLANA',
  [CHAINS.BSC]: 'EVM',
  
  // Legacy chains
  [CHAINS.BASE_MAINNET]: 'EVM',
  [CHAINS.BASE_SEPOLIA]: 'EVM',
  [CHAINS.ETHEREUM_MAINNET]: 'EVM',
  [CHAINS.POLYGON_MAINNET]: 'EVM',
  [CHAINS.SOLANA_DEVNET]: 'SOLANA',
  [CHAINS.SOLANA_TESTNET]: 'SOLANA'
};

export const CHAIN_EXPLORERS = {
  // Supported multi-chain
  [CHAINS.SOLANA]: {
    name: 'Solana Explorer',
    url: 'https://explorer.solana.com',
    addressPath: '/address/',
    txPath: '/tx/'
  },
  [CHAINS.BSC]: {
    name: 'BscScan',
    url: 'https://bscscan.com',
    addressPath: '/address/',
    txPath: '/tx/'
  },
  
  // Legacy chains
  [CHAINS.BASE_MAINNET]: {
    name: 'Basescan',
    url: 'https://basescan.org',
    addressPath: '/address/',
    txPath: '/tx/'
  },
  [CHAINS.BASE_SEPOLIA]: {
    name: 'Basescan Sepolia',
    url: 'https://sepolia.basescan.org',
    addressPath: '/address/',
    txPath: '/tx/'
  },
  [CHAINS.ETHEREUM_MAINNET]: {
    name: 'Etherscan',
    url: 'https://etherscan.io',
    addressPath: '/address/',
    txPath: '/tx/'
  },
  [CHAINS.POLYGON_MAINNET]: {
    name: 'Polygonscan',
    url: 'https://polygonscan.com',
    addressPath: '/address/',
    txPath: '/tx/'
  },
  [CHAINS.SOLANA_DEVNET]: {
    name: 'Solana Devnet',
    url: 'https://explorer.solana.com',
    addressPath: '/address/?cluster=devnet',
    txPath: '/tx/?cluster=devnet'
  },
  [CHAINS.SOLANA_TESTNET]: {
    name: 'Solana Testnet',
    url: 'https://explorer.solana.com',
    addressPath: '/address/?cluster=testnet',
    txPath: '/tx/?cluster=testnet'
  }
};

export const CHAIN_DECIMALS = {
  // Supported multi-chain
  [CHAINS.SOLANA]: 9,
  [CHAINS.BSC]: 18,
  
  // Legacy chains
  [CHAINS.BASE_MAINNET]: 18,
  [CHAINS.BASE_SEPOLIA]: 18,
  [CHAINS.ETHEREUM_MAINNET]: 18,
  [CHAINS.POLYGON_MAINNET]: 18,
  [CHAINS.SOLANA_DEVNET]: 9,
  [CHAINS.SOLANA_TESTNET]: 9
};

export const CHAIN_SYMBOLS = {
  // Supported multi-chain
  [CHAINS.SOLANA]: 'SOL',
  [CHAINS.BSC]: 'BNB',
  
  // Legacy chains
  [CHAINS.BASE_MAINNET]: 'ETH',
  [CHAINS.BASE_SEPOLIA]: 'ETH',
  [CHAINS.ETHEREUM_MAINNET]: 'ETH',
  [CHAINS.POLYGON_MAINNET]: 'MATIC',
  [CHAINS.SOLANA_DEVNET]: 'SOL',
  [CHAINS.SOLANA_TESTNET]: 'SOL'
};

// Helper functions
export const getChainName = (chainId: number): string => {
  return CHAIN_NAMES[chainId] || 'Unknown Chain';
};

export const getChainType = (chainId: number): string => {
  return CHAIN_TYPES[chainId] || 'UNKNOWN';
};

export const getChainExplorer = (chainId: number) => {
  return CHAIN_EXPLORERS[chainId] || null;
};

export const getChainDecimals = (chainId: number): number => {
  return CHAIN_DECIMALS[chainId] || 18;
};

export const getChainSymbol = (chainId: number): string => {
  return CHAIN_SYMBOLS[chainId] || 'UNKNOWN';
};

export const isEVMChain = (chainId: number): boolean => {
  return CHAIN_TYPES[chainId] === 'EVM';
};

export const isSolanaChain = (chainId: number): boolean => {
  return CHAIN_TYPES[chainId] === 'SOLANA';
};

export const validateAddress = (address: string, chainId: number): boolean => {
  if (!address) return false;
  
  if (isEVMChain(chainId)) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } else if (isSolanaChain(chainId)) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  
  return true;
};

export const getExplorerUrl = (chainId: number, address: string, isTransaction: boolean = false): string | null => {
  const explorer = getChainExplorer(chainId);
  if (!explorer) return null;
  
  const path = isTransaction ? explorer.txPath : explorer.addressPath;
  return `${explorer.url}${path}${address}`;
};

// Multi-chain specific helpers
export const getSupportedChains = () => {
  return Object.values(SUPPORTED_CHAINS);
};

export const getSupportedChainIds = () => {
  return Object.values(SUPPORTED_CHAINS).map(chain => chain.id);
};

export const getSupportedChainById = (chainId: number) => {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId);
};

export const isChainSupported = (chainId: number): boolean => {
  return getSupportedChainIds().includes(chainId);
};

// Chain-specific strategy mapping
export const CHAIN_STRATEGIES = {
  [CHAINS.SOLANA]: ['Holder', 'MajorTrader', 'TrendTrader', 'Trencher'], // Solana
  [CHAINS.BSC]: ['BNBHolder', 'BNBTrendTrader', 'BNBTrencher'] // BNB Smart Chain
};

export const getStrategiesForChain = (chainId: number): string[] => {
  return CHAIN_STRATEGIES[chainId] || [];
};

// Chain error messages
export const CHAIN_ERRORS = {
  UNSUPPORTED_CHAIN: 'Selected chain is not supported',
  INSUFFICIENT_FUNDS: (chain: string) => `Insufficient ${chain} balance`,
  CHAIN_MISMATCH: 'Wallet chain does not match selected chain'
};
