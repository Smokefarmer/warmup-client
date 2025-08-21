// Chain configuration constants matching the backend guide
export const CHAINS = {
  // EVM Chains
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
  ETHEREUM_MAINNET: 1,
  POLYGON_MAINNET: 137,
  
  // Solana Clusters
  SOLANA_MAINNET: 101,
  SOLANA_DEVNET: 102,
  SOLANA_TESTNET: 103
};

export const CHAIN_NAMES = {
  [CHAINS.BASE_MAINNET]: 'Base Mainnet',
  [CHAINS.BASE_SEPOLIA]: 'Base Sepolia',
  [CHAINS.ETHEREUM_MAINNET]: 'Ethereum Mainnet',
  [CHAINS.POLYGON_MAINNET]: 'Polygon Mainnet',
  [CHAINS.SOLANA_MAINNET]: 'Solana Mainnet',
  [CHAINS.SOLANA_DEVNET]: 'Solana Devnet',
  [CHAINS.SOLANA_TESTNET]: 'Solana Testnet'
};

export const CHAIN_TYPES = {
  [CHAINS.BASE_MAINNET]: 'EVM',
  [CHAINS.BASE_SEPOLIA]: 'EVM',
  [CHAINS.ETHEREUM_MAINNET]: 'EVM',
  [CHAINS.POLYGON_MAINNET]: 'EVM',
  [CHAINS.SOLANA_MAINNET]: 'SOLANA',
  [CHAINS.SOLANA_DEVNET]: 'SOLANA',
  [CHAINS.SOLANA_TESTNET]: 'SOLANA'
};

export const CHAIN_EXPLORERS = {
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
  [CHAINS.SOLANA_MAINNET]: {
    name: 'Solana Explorer',
    url: 'https://explorer.solana.com',
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
  [CHAINS.BASE_MAINNET]: 18,
  [CHAINS.BASE_SEPOLIA]: 18,
  [CHAINS.ETHEREUM_MAINNET]: 18,
  [CHAINS.POLYGON_MAINNET]: 18,
  [CHAINS.SOLANA_MAINNET]: 9,
  [CHAINS.SOLANA_DEVNET]: 9,
  [CHAINS.SOLANA_TESTNET]: 9
};

export const CHAIN_SYMBOLS = {
  [CHAINS.BASE_MAINNET]: 'ETH',
  [CHAINS.BASE_SEPOLIA]: 'ETH',
  [CHAINS.ETHEREUM_MAINNET]: 'ETH',
  [CHAINS.POLYGON_MAINNET]: 'MATIC',
  [CHAINS.SOLANA_MAINNET]: 'SOL',
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
