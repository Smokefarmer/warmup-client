import api from './api';
import { 
  IFunder, 
  IFundingTransaction, 
  FundWalletsDto, 
  FundingStatistics 
} from '../types/funding';

export class FundingService {
  // Get funder information
  static async getFunder(): Promise<IFunder> {
    const response = await api.get('/funding/funder');
    return response.data;
  }

  // Fund multiple wallets
  static async fundWallets(funding: FundWalletsDto): Promise<IFundingTransaction[]> {
    const response = await api.post('/funding/fund', funding);
    return response.data;
  }

  // Get funding transaction history
  static async getFundingHistory(limit?: number, offset?: number): Promise<IFundingTransaction[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await api.get(`/funding/history?${params.toString()}`);
    return response.data;
  }

  // Get specific funding transaction
  static async getFundingTransaction(id: string): Promise<IFundingTransaction> {
    const response = await api.get(`/funding/transactions/${id}`);
    return response.data;
  }

  // Get funding statistics
  static async getFundingStatistics(): Promise<FundingStatistics> {
    const response = await api.get('/funding/statistics');
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
    const response = await api.post('/funding/check', { walletAddresses });
    return response.data;
  }
}
