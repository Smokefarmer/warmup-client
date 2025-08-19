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
}

export interface CreateBatchWalletsDto {
  count: number;
  typeDistribution?: {
    TrendTrader?: number;
    MajorTrader?: number;
    Holder?: number;
    Trencher?: number;
  };
}

export interface WalletFilters {
  type?: WalletType;
  status?: WalletStatus;
  chainId?: number;
  limit?: number;
  offset?: number;
}
