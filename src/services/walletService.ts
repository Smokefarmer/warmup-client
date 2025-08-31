import api from './api';
import { IWallet, CreateWalletDto, CreateBatchWalletsDto, WalletStatus } from '../types/wallet';
import { MultiChainService } from './multiChainService';

// Strategic wallet generation types
export interface StrategicWalletGenerationConfig {
  count: number;
  planName: string;
  walletTypeDistribution: Array<{
    type: 'TrendTrader' | 'MajorTrader' | 'Holder' | 'Trencher';
    count: number;
  }>;
  withDelays?: boolean;
  delayConfig?: {
    minMs: number;
    maxMs: number;
  };
}

export interface JobStatus {
  id: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    percentage: number;
    message: string;
  };
  startedAt: string;
  estimatedCompletionTime?: string;
  executionTime?: number;
  result?: any;
}

export class WalletService {
  // Get all wallets
  static async getWallets(): Promise<IWallet[]> {
    try {
      const response = await api.get('/api/wallets');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  // Get available wallets (not in any process)
  static async getAvailableWallets(): Promise<IWallet[]> {
    try {
      const response = await api.get('/api/wallets/available');
      return response.data;
    } catch (error) {
      console.error('Error fetching available wallets:', error);
      throw error;
    }
  }

  // Get archived wallets
  static async getArchivedWallets(): Promise<IWallet[]> {
    try {
      const response = await api.get('/api/wallets/archived');
      return response.data;
    } catch (error) {
      console.error('Error fetching archived wallets:', error);
      throw error;
    }
  }

  // Create wallet
  static async createWallet(walletData: CreateWalletDto): Promise<IWallet> {
    try {
      const response = await api.post('/api/wallets', walletData);
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  // Create batch wallets
  static async createBatchWallets(batchData: CreateBatchWalletsDto): Promise<IWallet[]> {
    try {
      const response = await api.post('/api/wallets/batch', batchData);
      return response.data;
    } catch (error) {
      console.error('Error creating batch wallets:', error);
      throw error;
    }
  }

  // Update wallet status
  static async updateWalletStatus(id: string, status: WalletStatus): Promise<IWallet> {
    try {
      const response = await api.put(`/api/wallets/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating wallet status:', error);
      throw error;
    }
  }

  // Update wallet type
  static async updateWalletType(id: string, type: string): Promise<IWallet> {
    try {
      const response = await api.put(`/api/wallets/${id}/type`, { type });
      return response.data;
    } catch (error) {
      console.error('Error updating wallet type:', error);
      throw error;
    }
  }

  // Archive wallet
  static async archiveWallet(id: string): Promise<IWallet> {
    try {
      const response = await api.put(`/api/wallets/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving wallet:', error);
      throw error;
    }
  }

  // Unarchive wallet
  static async unarchiveWallet(id: string): Promise<IWallet> {
    try {
      const response = await api.put(`/api/wallets/${id}/unarchive`);
      return response.data;
    } catch (error) {
      console.error('Error unarchiving wallet:', error);
      throw error;
    }
  }

  // Multi-chain wallet creation (delegates to MultiChainService)
  static async createMultiChainWallet(walletData: any): Promise<IWallet> {
    return MultiChainService.createWallet(walletData);
  }

  // Multi-chain batch wallet creation (delegates to MultiChainService)
  static async createMultiChainWallets(wallets: any[]): Promise<IWallet[]> {
    return MultiChainService.createMultiChainWallets(wallets);
  }

  // Get wallet statistics
  static async getWalletStatistics() {
    try {
      const response = await api.get('/api/wallets/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet statistics:', error);
      throw error;
    }
  }

  // Sell all tokens in a wallet
  static async sellAllTokens(walletId: string) {
    try {
      const response = await api.post(`/api/wallets/${walletId}/sell-all`);
      return response.data;
    } catch (error) {
      console.error('Error selling all tokens:', error);
      throw error;
    }
  }

  // Send SOL back to funder
  static async sendBackToFunder(walletId: string, funderAddress: string, amount?: string) {
    try {
      const body: any = { funderAddress };
      if (amount) {
        body.amount = amount;
      }
      
      const response = await api.post(`/api/wallets/${walletId}/send-back-to-funder`, body);
      return response.data;
    } catch (error) {
      console.error('Error sending back to funder:', error);
      throw error;
    }
  }

  // Strategic wallet generation
  static async generateStrategicWallets(config: StrategicWalletGenerationConfig): Promise<{ jobId: string }> {
    try {
      const response = await api.post('/api/strategic-wallets/generate', config);
      return response.data;
    } catch (error) {
      console.error('Error generating strategic wallets:', error);
      throw error;
    }
  }

  // Get job status
  static async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const response = await api.get(`/api/strategic-wallets/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job status:', error);
      throw error;
    }
  }

  // Get all jobs
  static async getAllJobs(): Promise<JobStatus[]> {
    try {
      const response = await api.get('/api/strategic-wallets/jobs');
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }
}
