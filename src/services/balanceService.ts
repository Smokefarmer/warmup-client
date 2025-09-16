import api from './api';

export interface UpdateTotalFundedResponse {
  success: boolean;
  walletId: string;
  oldTotalFunded: string;
  newTotalFunded: string;
  transactionsFound: number;
  error?: string;
}

export interface UpdateTotalFundedRequest {
  walletIds?: string[];
  type?: 'active' | 'paused' | 'all';
  fromBlock?: number;
}

export interface ForceUpdateAllBalancesResponse {
  success: boolean;
  message: string;
  totalWalletsProcessed: number;
  updatedWallets: UpdateTotalFundedResponse[];
  errors?: string[];
}

export interface BulkUpdateBalancesRequest {
  walletIds: string[];
  delayBetweenBatches?: number;
  batchSize?: number;
}

export interface BulkUpdateBalancesResponse {
  success: boolean;
  message: string;
  totalWalletsProcessed: number;
  processedBatches: number;
  averageTimePerBatch: number;
  errors?: string[];
}

export interface BalanceSummary {
  totalWallets: number;
  totalFunded: string;
  averageFunded: string;
  activeWallets: number;
  pausedWallets: number;
  bannedWallets: number;
}

export class BalanceService {
  // Update totalFunded for single wallet
  static async updateTotalFundedForWallet(
    walletId: string, 
    fromBlock?: number
  ): Promise<UpdateTotalFundedResponse> {
    const params = new URLSearchParams();
    if (fromBlock) params.append('fromBlock', fromBlock.toString());

    const response = await api.post(`/api/balance/total-funded/wallet/${walletId}?${params.toString()}`);
    return response.data;
  }

  // Update totalFunded for multiple wallets
  static async updateTotalFundedForWallets(
    request: UpdateTotalFundedRequest
  ): Promise<UpdateTotalFundedResponse[]> {
    const response = await api.post('/api/balance/total-funded/wallets', request);
    return response.data;
  }

  // Get balance summary
  static async getBalanceSummary(): Promise<BalanceSummary> {
    const response = await api.get('/api/balance/summary');
    return response.data;
  }

  // Get wallet list for selection with filters
  static async getWalletsForSelection(
    type?: string,
    status?: string
  ): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    const response = await api.get(`/api/wallets?${params.toString()}`);
    return response.data;
  }

  // Force update all wallet balances
  static async forceUpdateAllBalances(): Promise<ForceUpdateAllBalancesResponse> {
    const response = await api.post('/api/balance/force-update-all');
    return response.data;
  }

  // Bulk update balances for selected wallets with rate limiting
  static async bulkUpdateBalances(
    request: BulkUpdateBalancesRequest
  ): Promise<BulkUpdateBalancesResponse> {
    const response = await api.post('/api/balance/bulk-update', request);
    return response.data;
  }
}
