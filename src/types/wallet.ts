export enum WalletType {
  TREND_TRADER = 'TrendTrader',
  MAJOR_TRADER = 'MajorTrader',
  HOLDER = 'Holder',
  TRENCHER = 'Trencher'
}

export enum WalletStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  BANNED = 'banned'
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
  wallets: CreateWalletDto[];
  typeDistribution?: {
    [key in WalletType]?: number;
  };
}

export interface WalletFilters {
  type?: WalletType;
  status?: WalletStatus;
  chainId?: number;
  limit?: number;
  offset?: number;
}
