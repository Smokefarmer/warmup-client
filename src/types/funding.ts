export interface IFunder {
  id: string;
  address: string;
  balance: bigint;
  chainId: number;
  status: 'active' | 'inactive' | 'error';
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFundingTransaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  walletAddress: string;
  amount: bigint;
  chainId: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface FundWalletsDto {
  walletAddresses: string[];
  amount: bigint;
  chainId: number;
}

export interface FundingStatistics {
  totalFunded: bigint;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageAmount: bigint;
  lastFundingAt?: Date;
}
