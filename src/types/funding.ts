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

// Enhanced funder status for the dashboard
export interface FunderStatus {
  available: boolean;
  funderAddress: string;
  balance: string;
  status: 'active' | 'inactive' | 'error';
}

// Enhanced funder status with chain support
export interface FunderStatusWithChain extends FunderStatus {
  chainId: number;
  lastUpdated: string;
}

// Multi-chain funder information
export interface MultiChainFunderInfo {
  success: boolean;
  funderInfo: {
    [chainId: string]: FunderStatusWithChain;
  };
}

// Single chain funder information
export interface SingleChainFunderInfo {
  success: boolean;
  funderAddress: string;
  balance: string;
  isAvailable: boolean;
  chainId: number;
  lastUpdated: string;
}

// CEX balance information
export interface CexBalance {
  success: boolean;
  exchange: string;
  currency: string;
  available: number;
  frozen: number;
  total: number;
  timestamp: string;
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

// Enhanced transaction interface for the dashboard
export interface Transaction {
  hash: string;
  walletId: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  timestamp: string;
}

export interface FundWalletsDto {
  walletAddresses: string[];
  amount: bigint;
  chainId: number;
}

// New funding interfaces for enhanced functionality
export interface SingleWalletFundingDto {
  walletId: string;
  amount: string;
}

export interface BatchFundingDto {
  walletIds: string[];
  amount: string;
}

export interface RandomBatchFundingDto {
  walletIds: string[];
  minAmount: string;
  maxAmount: string;
}

export interface FundingResult {
  success: boolean;
  transactions: Transaction[];
  errors?: string[];
  totalAmount: string;
}

export interface FundingStatistics {
  totalFunded: bigint;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageAmount: bigint;
  lastFundingAt?: Date;
}

// Wallet interface for funding operations
export interface FundingWallet {
  id: string;
  publicKey: string;
  nativeTokenBalance: string;
  totalFunded: string;
  status: 'active' | 'paused' | 'created';
}
