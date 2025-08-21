export enum WalletType {
  TREND_TRADER = 'TrendTrader',
  MAJOR_TRADER = 'MajorTrader',
  HOLDER = 'Holder',
  TRENCHER = 'Trencher'
}

export enum WalletStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  BANNED = 'banned',
  FUNDED = 'funded',
  UNFUNDED = 'unfunded'
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
  publicKey: string;
  encryptedPrivateKey: string;
  privateKeySalt: string;
  chainId: number;
  nativeTokenBalance: string;
  totalFunded: string;
  type: WalletType;
  status: WalletStatus;
  fundingAmount: string;
  buyAmount: string;
  targetTokenBalance: string;
  targetTokenBalancePercent: number;
  usedForBundle: boolean;
  buyTxCount: number;
  sellTxCount: number;
  maxTxCount: number;
  isPaused: boolean;
  config: any;
  warmupProcessId?: any;
  createdAt: string;
  updatedAt: string;
  // Solana-specific fields
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
  address: string;
  privateKey: string;
  chainId: number;
  type: WalletType;
  // Solana-specific fields
  solanaAccountInfo?: {
    lamports: number;
    owner: string;
    executable: boolean;
    rentEpoch: number;
  };
}

export interface CreateBatchWalletsDto {
  count: number;
  typeDistribution?: {
    TrendTrader?: number;
    MajorTrader?: number;
    Holder?: number;
    Trencher?: number;
  };
  chainId?: number; // Specify chain for batch creation
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
  // Optional chain-specific data
  chainSpecificData?: {
    [ChainId.BASE]?: {
      privateKey: string;
    };
    [ChainId.SOLANA]?: {
      privateKey: string;
      accountInfo?: {
        lamports: number;
        owner: string;
        executable: boolean;
        rentEpoch: number;
      };
    };
  };
}
