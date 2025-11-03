import api from './api';
import { 
  IFunder, 
  IFundingTransaction, 
  FundWalletsDto, 
  FundingStatistics,
  FunderStatus,
  SingleWalletFundingDto,
  BatchFundingDto,
  RandomBatchFundingDto,
  FundingResult,
  Transaction,
  FundingWallet,
  SingleChainFunderInfo,
  MultiChainFunderInfo,
  CexBalance
} from '../types/funding';

// API Base URL and endpoints - Updated to match actual backend
const API_BASE = import.meta.env.VITE_API_URL || 'https://warmup-server-development.up.railway.app';

const ENDPOINTS = {
  // Core funding endpoints
  status: '/api/funding/status',
  fundWallet: (id: string) => `/api/funding/wallet/${id}`,
  fundWallets: '/api/funding/wallets',
  fundWalletsRandom: '/api/funding/wallets/random',
  transactionStatus: (hash: string) => `/api/funding/transaction/${hash}`,
  
  // Balance endpoints
  funderInfo: '/api/balance/funder',
  funderInfoAll: '/api/balance/funder/all',
  walletBalance: (id: string) => `/api/balance/wallet/${id}`,
  cexBalance: '/api/funding/cex/balance',
  
  // History and statistics endpoints
  history: '/api/funding/history',
  statistics: '/api/funding/statistics',
  transactions: (id: string) => `/api/funding/transactions/${id}`,
  check: '/api/funding/check',
  
  // Legacy endpoints (keeping for backward compatibility)
  funder: '/api/funding/funder',
  fund: '/api/funding/fund',
};

export class FundingService {
  // Get funder information
  static async getFunder(): Promise<IFunder> {
    const response = await api.get(ENDPOINTS.funder);
    return response.data;
  }

  // Get enhanced funder status for dashboard
  static async getFunderStatus(chainId?: number): Promise<FunderStatus> {
    const params = chainId ? `?chainId=${chainId}` : '';
    const response = await api.get(`${ENDPOINTS.status}${params}`);
    return response.data;
  }

  // Fund multiple wallets (legacy)
  static async fundWallets(funding: FundWalletsDto): Promise<IFundingTransaction[]> {
    const response = await api.post(ENDPOINTS.fund, funding);
    return response.data;
  }

  // Single wallet funding
  static async fundWallet(params: SingleWalletFundingDto): Promise<FundingResult> {
    const response = await api.post(ENDPOINTS.fundWallet(params.walletId), {
      amount: params.amount
    });
    return response.data;
  }

  // Batch funding (same amount)
  static async fundWalletsBatch(params: BatchFundingDto & { chainId?: number }): Promise<FundingResult> {
    const response = await api.post(ENDPOINTS.fundWallets, params);
    return response.data;
  }

  // Random batch funding
  static async fundWalletsRandom(params: RandomBatchFundingDto & { chainId?: number }): Promise<FundingResult> {
    const response = await api.post(ENDPOINTS.fundWalletsRandom, params);
    return response.data;
  }

  // Fund selected wallets with chain support and optional amounts
  static async fundSelectedWallets(
    walletIds: string[], 
    chainId?: number, 
    amounts?: number[]
  ): Promise<FundingResult> {
    const response = await api.post('/api/funding/selected-wallets', {
      walletIds,
      amounts,
      chainId
    });
    return response.data;
  }

  // 🎲 NEW: Fund selected wallets with Multi-CEX rotation (BNB only)
  static async fundSelectedWalletsMultiCex(params: {
    walletIds: string[];
    chainId: number;
    useMultiCex: boolean;
    randomizeAmounts?: boolean;
    amountRange?: {
      min: number;
      max: number;
    };
    amounts?: number[];
  }): Promise<FundingResult> {
    const response = await api.post('/api/funding/selected-wallets', params);
    return response.data;
  }

  // Check transaction status
  static async checkTransactionStatus(txHash: string): Promise<Transaction> {
    const response = await api.get(ENDPOINTS.transactionStatus(txHash));
    return response.data;
  }

  // Get wallet balance
  static async getWalletBalance(walletId: string): Promise<{ balance: string }> {
    const response = await api.get(ENDPOINTS.walletBalance(walletId));
    return response.data;
  }

  // Get funder balance
  static async getFunderBalance(): Promise<{ balance: string }> {
    const response = await api.get(ENDPOINTS.funderInfo);
    return response.data;
  }

  // Get funder balance for specific chain
  static async getFunderBalanceForChain(chainId: number): Promise<SingleChainFunderInfo> {
    const response = await api.get(`${ENDPOINTS.funderInfo}?chainId=${chainId}`);
    return response.data;
  }

  // Get funder information for all supported chains
  static async getFunderInfoAll(): Promise<MultiChainFunderInfo> {
    const response = await api.get(ENDPOINTS.funderInfoAll);
    return response.data;
  }

  // Get CEX balance
  static async getCexBalance(chainId?: number): Promise<CexBalance> {
    const params = chainId ? `?chainId=${chainId}` : '';
    const response = await api.get(`${ENDPOINTS.cexBalance}${params}`);
    return response.data;
  }

  // Get funding transaction history
  static async getFundingHistory(limit?: number, offset?: number): Promise<IFundingTransaction[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await api.get(`${ENDPOINTS.history}?${params.toString()}`);
    return response.data;
  }

  // Get specific funding transaction
  static async getFundingTransaction(id: string): Promise<IFundingTransaction> {
    const response = await api.get(ENDPOINTS.transactions(id));
    return response.data;
  }

  // Get funding statistics
  static async getFundingStatistics(): Promise<FundingStatistics> {
    const response = await api.get(ENDPOINTS.statistics);
    return response.data;
  }

  // Check funding status
  static async checkFundingStatus(walletAddresses: string[]): Promise<{
    [address: string]: {
      funded: boolean;
      amount?: bigint;
      lastFundedAt?: Date;
    };
  }> {
    const response = await api.post(ENDPOINTS.check, { walletAddresses });
    return response.data;
  }
}
