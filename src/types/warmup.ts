import { IWarmUpWallet, WalletType } from './wallet';

export interface IWarmupProcess {
  id: string;
  name: string;
  description?: string;
  status: string;
  walletIds: string[];
  wallets?: IWarmUpWallet[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  statistics?: IWarmupStatistics;
}

export interface IWarmupStatistics {
  totalWallets: number;
  activeWallets: number;
  completedWallets: number;
  failedWallets: number;
  totalTransactions: number;
  totalVolume: bigint;
  totalProfitLoss: bigint;
  averageTransactionTime: number;
  successRate: number;
  strategyStats: {
    [key in WalletType]?: {
      count: number;
      transactions: number;
      volume: bigint;
      profitLoss: bigint;
    };
  };
}

export interface CreateWarmupProcessDto {
  name: string;
  description?: string;
  walletIds: string[];
}

export interface WarmupFilters {
  status?: string;
  limit?: number;
  offset?: number;
}
