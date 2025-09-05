export enum WalletType {
  TREND_TRADER = 'TrendTrader',
  MAJOR_TRADER = 'MajorTrader',
  HOLDER = 'Holder',
  TRENCHER = 'Trencher'
}

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  BANNED = 'BANNED',
  ARCHIVED = 'ARCHIVED'
}

export enum WarmupStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STOPPED = 'stopped'
}

// Chain identifiers
export enum ChainId {
  BASE = 8453,
  SOLANA = 101,
  SOLANA_MAINNET = 101,
  SOLANA_DEVNET = 102,
  SOLANA_TESTNET = 103
}

// Chain-specific configuration
export interface ChainConfig {
  chainId: ChainId;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export interface TokenHolding {
  tokenAddress: string;
  balance: string;
  balanceFormatted?: string;
}

export interface TokenInfo {
  maxTokens: number;
  currentTokenCount: number;
  sellProbability: number;
  canBuy: boolean;
  shouldForceSell: boolean;
  reason: string;
  holdings?: TokenHolding[];
  error?: string;
}

export interface IWallet {
  _id: string;
  address: string;
  publicKey?: string;
  type: WalletType;
  status: WalletStatus;
  chainId: ChainId;
  totalFunded: string;
  nativeTokenBalance: string;
  buyTxCount: number;
  sellTxCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  tag?: string;
  tokenInfo?: TokenInfo;
  solanaAccountInfo?: {
    lamports: number;
    owner: string;
    executable: boolean;
    rentEpoch: number;
  };
}

export interface IWarmUpWallet extends IWallet {
  warmupStatus: WarmupStatus;
  warmupProcessId?: string;
  lastTransactionAt?: Date;
  transactionCount: number;
  totalVolume: bigint;
  profitLoss: bigint;
}

export interface CreateWalletDto {
  publicKey: string;
  chainId: ChainId;
  type: WalletType;
  solanaAccountInfo?: {
    lamports: number;
    owner: string;
    executable: boolean;
    rentEpoch: number;
  };
}

export interface CreateBatchWalletsDto {
  wallets: CreateWalletDto[];
  chainId?: ChainId;
}

export interface WalletFilters {
  type?: WalletType;
  status?: WalletStatus;
  chainId?: number;
  limit?: number;
  offset?: number;
}

// Multi-chain wallet creation
export interface CreateMultiChainWalletDto {
  publicKey: string;
  chainId: ChainId;
  type: WalletType;
  chainSpecificData?: {
    [chainId: number]: {
      privateKey?: string;
    };
  };
}

// Token management types
export interface TokenLimits {
  walletId: string;
  publicKey: string;
  type: string;
  tag?: string;
  maxTokens: number;
  currentTokenCount: number;
  sellProbabilityBase: number;
  sellProbabilityCurrent: number;
  canBuy: boolean;
  shouldForceSell: boolean;
  reason: string;
  lastUpdate: string;
}

export interface TokenHoldings {
  walletId: string;
  publicKey: string;
  type: string;
  tag?: string;
  holdingsCount: number;
  holdings: TokenHolding[];
  lastScanned: string;
}

export interface TokenStatistics {
  totalWallets: number;
  averageMaxTokens: number;
  averageCurrentTokens: number;
  walletsAtLimit: number;
  walletsNearLimit: number;
  averageSellProbability: number;
  generatedAt: string;
  description: string;
}

export interface TokenConflictStats {
  walletType: string;
  chainId: number;
  totalWallets: number;
  walletsWithTokens: number;
  uniqueTokens: number;
  averageTokensPerWallet: number;
  tokenConflictRate: number;
  conflictRatePercentage: number;
  generatedAt: string;
}

export interface RefreshTokenCountResult {
  walletId: string;
  publicKey: string;
  refreshed: boolean;
  update: {
    walletId: string;
    previousCount: number;
    newCount: number;
    maxTokens: number;
    sellProbabilityChange: number;
  };
  timestamp: string;
}
