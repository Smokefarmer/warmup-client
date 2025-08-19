import { IWarmUpWallet, WalletType } from './wallet';

export interface IWarmupProcess {
  _id: string;
  name: string;
  description?: string;
  status: string;
  walletIds: string[];
  wallets?: IWarmUpWallet[];
  totalWallets: number;
  completedWallets: number;
  failedWallets: number;
  configuration: {
    description: string;
    maxConcurrentWallets: number;
  };
  progress: {
    startTime: string | null;
    estimatedCompletion: string | null;
    currentWalletIndex: number;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  statistics?: IWarmupStatistics;
}

export interface IWarmupStatistics {
  totalWallets: number;
  activeWallets: number;
  activeProcesses: number;
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
