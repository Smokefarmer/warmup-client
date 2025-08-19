export enum WalletType {
  TREND_TRADER = 'trendTrader',
  MAJOR_TRADER = 'majorTrader',
  HOLDER = 'holder',
  TRENCHER = 'trencher'
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
  id: string;
  address: string;
  privateKey: string;
  chainId: number;
  balance: bigint;
  type: WalletType;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
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
    trendTrader?: number;
    majorTrader?: number;
    holder?: number;
    trencher?: number;
  };
}

export interface WalletFilters {
  type?: WalletType;
  status?: WalletStatus;
  chainId?: number;
  limit?: number;
  offset?: number;
}
