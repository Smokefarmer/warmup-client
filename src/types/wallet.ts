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
