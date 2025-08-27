import api from './api';
import { 
  IWarmupProcess, 
  IWarmupStatistics, 
  CreateWarmupProcessDto 
} from '../types/warmup';
import { ChainId, WalletType } from '../types/wallet';

export interface SolanaWarmupConfiguration {
  maxConcurrentWallets: number;
  transactionInterval: number; // seconds
  maxTransactionsPerWallet: number;
  minTransactionAmount: string; // SOL amount
  maxTransactionAmount: string; // SOL amount
  priorityMode: 'round-robin' | 'sequential' | 'random';
  retryAttempts: number;
  retryDelay: number; // seconds
  gasOptimization: boolean;
  slippageTolerance: number; // percentage
}

export interface CreateSolanaWarmupProcessDto extends CreateWarmupProcessDto {
  configuration?: SolanaWarmupConfiguration;
  chainId?: ChainId;
}

export interface SolanaWarmupStatistics extends IWarmupStatistics {
  solanaSpecific: {
    totalSOLVolume: string;
    averageSOLPerTransaction: string;
    gasFeesTotal: string;
    successfulTransactions: number;
    failedTransactions: number;
    averageTransactionTime: number;
  };
}

export class SolanaWarmupService {
  private static readonly API_BASE_URL = '/api';
  private static readonly headers = {
    'Content-Type': 'application/json',
  };

  // Default Solana warmup configuration
  static readonly DEFAULT_CONFIG: SolanaWarmupConfiguration = {
    maxConcurrentWallets: 5,
    transactionInterval: 30, // 30 seconds
    maxTransactionsPerWallet: 10,
    minTransactionAmount: '0.001', // 0.001 SOL
    maxTransactionAmount: '0.01',  // 0.01 SOL
    priorityMode: 'round-robin',
    retryAttempts: 3,
    retryDelay: 5, // 5 seconds
    gasOptimization: true,
    slippageTolerance: 0.5 // 0.5%
  };

  /**
   * Create a Solana warmup process with enhanced configuration
   */
  static async createSolanaWarmupProcess(
    walletIds: string[], 
    name: string = "Solana Multi-Strategy Warmup",
    customConfig?: Partial<SolanaWarmupConfiguration>
  ): Promise<IWarmupProcess> {
    // Only include configuration fields that the backend expects
    const configuration = customConfig ? {
      maxConcurrentWallets: customConfig.maxConcurrentWallets || this.DEFAULT_CONFIG.maxConcurrentWallets,
      transactionInterval: customConfig.transactionInterval || this.DEFAULT_CONFIG.transactionInterval,
      maxTransactionsPerWallet: customConfig.maxTransactionsPerWallet || this.DEFAULT_CONFIG.maxTransactionsPerWallet,
      minTransactionAmount: customConfig.minTransactionAmount || this.DEFAULT_CONFIG.minTransactionAmount,
      maxTransactionAmount: customConfig.maxTransactionAmount || this.DEFAULT_CONFIG.maxTransactionAmount,
      priorityMode: customConfig.priorityMode || this.DEFAULT_CONFIG.priorityMode,
      retryAttempts: customConfig.retryAttempts || this.DEFAULT_CONFIG.retryAttempts,
      retryDelay: customConfig.retryDelay || this.DEFAULT_CONFIG.retryDelay,
      gasOptimization: customConfig.gasOptimization || this.DEFAULT_CONFIG.gasOptimization,
      slippageTolerance: customConfig.slippageTolerance || this.DEFAULT_CONFIG.slippageTolerance
    } : undefined;

    const processData: CreateSolanaWarmupProcessDto = {
      name,
      walletIds,
      configuration
    };

    console.log('🔍 Creating Solana warmup process:', {
      name,
      walletCount: walletIds.length,
      configuration
    });

    try {
      const response = await api.post(`${this.API_BASE_URL}/warmup`, processData, {
        headers: this.headers
      });
      
      console.log('✅ Solana warmup process created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating Solana warmup process:', error.response?.data);
      throw error;
    }
  }

  /**
   * Start a Solana warmup process
   */
  static async startSolanaWarmupProcess(processId: string): Promise<IWarmupProcess> {
    console.log('🚀 Starting Solana warmup process:', processId);
    
    try {
      const response = await api.post(`${this.API_BASE_URL}/warmup/${processId}/start`, {}, {
        headers: this.headers
      });
      
      console.log('✅ Solana warmup process started:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error starting Solana warmup process:', error.response?.data);
      throw error;
    }
  }

  /**
   * Stop a Solana warmup process
   */
  static async stopSolanaWarmupProcess(processId: string): Promise<IWarmupProcess> {
    console.log('⏹️ Stopping Solana warmup process:', processId);
    
    try {
      const response = await api.post(`${this.API_BASE_URL}/warmup/${processId}/stop`, {}, {
        headers: this.headers
      });
      
      console.log('✅ Solana warmup process stopped:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error stopping Solana warmup process:', error.response?.data);
      throw error;
    }
  }



  /**
   * Get Solana-specific process statistics
   */
  static async getSolanaProcessStats(processId: string): Promise<SolanaWarmupStatistics> {
    try {
      const response = await api.get(`${this.API_BASE_URL}/warmup/${processId}/statistics`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching Solana process statistics:', error.response?.data);
      throw error;
    }
  }

  /**
   * Get Solana transaction logs with enhanced filtering
   */
  static async getSolanaTransactionLogs(
    processId: string, 
    filters?: {
      status?: 'pending' | 'completed' | 'failed';
      limit?: number;
      offset?: number;
      walletId?: string;
    }
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.walletId) params.append('walletId', filters.walletId);

    try {
      const response = await api.get(`${this.API_BASE_URL}/warmup/${processId}/transactions?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching Solana transaction logs:', error.response?.data);
      throw error;
    }
  }

  /**
   * Get multi-chain overview with Solana focus
   */
  static async getSolanaOverallStats(): Promise<any> {
    try {
      const response = await api.get(`${this.API_BASE_URL}/warmup/statistics/multi-chain`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching Solana overall stats:', error.response?.data);
      throw error;
    }
  }

  /**
   * Enhanced monitoring with real-time updates
   */
  static async monitorSolanaProcess(
    processId: string,
    onUpdate: (stats: SolanaWarmupStatistics) => void,
    onComplete?: (finalStats: SolanaWarmupStatistics) => void,
    onError?: (error: any) => void,
    intervalMs: number = 5000
  ): Promise<() => void> {
    let isMonitoring = true;
    
    const poll = async () => {
      if (!isMonitoring) return;
      
      try {
        const stats = await this.getSolanaProcessStats(processId);
        onUpdate(stats);
        
        // Check if process is completed
        if (stats.status === 'completed' || stats.status === 'failed') {
          if (onComplete) onComplete(stats);
          return;
        }
        
        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        console.error('Error monitoring Solana process:', error);
        if (onError) onError(error);
        // Continue polling even on error
        setTimeout(poll, intervalMs);
      }
    };
    
    poll();
    
    // Return cleanup function
    return () => {
      isMonitoring = false;
    };
  }

  /**
   * Validate Solana wallet batch before creating warmup process
   */
  static async validateSolanaWallets(walletIds: string[]): Promise<{
    valid: boolean;
    validWallets: string[];
    invalidWallets: string[];
    errors: string[];
  }> {
    const result = {
      valid: false,
      validWallets: [] as string[],
      invalidWallets: [] as string[],
      errors: [] as string[]
    };

    try {
      // Check if wallets exist and are Solana wallets
      for (const walletId of walletIds) {
        try {
          const response = await api.get(`${this.API_BASE_URL}/wallets/${walletId}`);
          const wallet = response.data;
          
          if (wallet.chainId === ChainId.SOLANA_DEVNET || wallet.chainId === ChainId.SOLANA_MAINNET) {
            result.validWallets.push(walletId);
          } else {
            result.invalidWallets.push(walletId);
            result.errors.push(`Wallet ${walletId} is not a Solana wallet`);
          }
        } catch (error) {
          result.invalidWallets.push(walletId);
          result.errors.push(`Wallet ${walletId} not found`);
        }
      }
      
      result.valid = result.validWallets.length > 0;
      
      if (result.validWallets.length === 0) {
        result.errors.push('No valid Solana wallets found');
      }
      
      return result;
    } catch (error) {
      result.errors.push('Failed to validate wallets');
      return result;
    }
  }
}
