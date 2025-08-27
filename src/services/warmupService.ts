import api from './api';
import { 
  IWarmupProcess, 
  IWarmupStatistics, 
  CreateWarmupProcessDto, 
  WarmupFilters 
} from '../types/warmup';
import { MultiChainService, MultiChainProcess } from './multiChainService';

export class WarmupService {
  // Base configuration
  private static readonly API_BASE_URL = '/api';
  private static readonly headers = {
    'Content-Type': 'application/json',
  };

  // Get all warmup processes with optional filters
  static async getWarmupProcesses(filters?: WarmupFilters): Promise<IWarmupProcess[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    try {
      const response = await api.get(`${this.API_BASE_URL}/warmup?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('🔍 Error fetching warmup processes:', error.response?.data);
      throw error;
    }
  }

  // Get specific warmup process by ID
  static async getWarmupProcess(id: string): Promise<IWarmupProcess> {
    const response = await api.get(`${this.API_BASE_URL}/warmup/${id}`);
    return response.data;
  }

  // Create new warmup process (POST /warmup)
  static async createWarmupProcess(process: CreateWarmupProcessDto): Promise<IWarmupProcess> {
    // Clean up the process data to ensure it matches backend expectations
    const cleanProcessData = {
      name: process.name,
      walletIds: process.walletIds,
      ...(process.description && { description: process.description }),
      ...(process.configuration && { 
        configuration: {
          ...(process.configuration.maxConcurrentWallets && { maxConcurrentWallets: process.configuration.maxConcurrentWallets }),
          ...(process.configuration.transactionInterval && { transactionInterval: process.configuration.transactionInterval }),
          ...(process.configuration.maxTransactionsPerWallet && { maxTransactionsPerWallet: process.configuration.maxTransactionsPerWallet }),
          ...(process.configuration.minTransactionAmount && { minTransactionAmount: process.configuration.minTransactionAmount }),
          ...(process.configuration.maxTransactionAmount && { maxTransactionAmount: process.configuration.maxTransactionAmount })
        }
      })
    };

    // Debug: Log the request details
    console.log('🔍 WarmupService.createWarmupProcess called with:', {
      url: `${this.API_BASE_URL}/warmup`,
      originalData: process,
      cleanedData: cleanProcessData,
      headers: this.headers
    });

    try {
      const response = await api.post(`${this.API_BASE_URL}/warmup`, cleanProcessData, {
        headers: this.headers
      });
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      console.error('🔍 Backend error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.response?.data?.message,
        validationErrors: error.response?.data?.message
      });
      
      // Log the full error response for debugging
      console.error('🔍 Full error response:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  // Create multi-chain warmup process (new method)
  static async createMultiChainProcess(name: string, walletIds: string[]): Promise<MultiChainProcess> {
    return MultiChainService.createMultiChainProcess(name, walletIds);
  }

  // Get multi-chain processes (new method)
  static async getMultiChainProcesses(): Promise<MultiChainProcess[]> {
    return MultiChainService.getMultiChainProcesses();
  }

  // Get multi-chain process by ID (new method)
  static async getMultiChainProcess(id: string): Promise<MultiChainProcess> {
    return MultiChainService.getMultiChainProcess(id);
  }

  // Start warmup process (POST /warmup/:id/start)
  static async startWarmupProcess(id: string): Promise<IWarmupProcess> {
    const response = await api.post(`${this.API_BASE_URL}/warmup/${id}/start`, {}, {
      headers: this.headers
    });
    return response.data;
  }

  // Start multi-chain process (new method)
  static async startMultiChainProcess(id: string): Promise<MultiChainProcess> {
    return MultiChainService.startMultiChainProcess(id);
  }

  // Stop warmup process (POST /warmup/:id/stop)
  static async stopWarmupProcess(id: string): Promise<IWarmupProcess> {
    const response = await api.post(`${this.API_BASE_URL}/warmup/${id}/stop`, {}, {
      headers: this.headers
    });
    return response.data;
  }



  // Stop multi-chain process (new method)
  static async stopMultiChainProcess(id: string): Promise<MultiChainProcess> {
    return MultiChainService.stopMultiChainProcess(id);
  }

  // Add wallets to warmup process (PUT /warmup/:id/wallets)
  static async addWalletsToProcess(id: string, walletIds: string[]): Promise<IWarmupProcess> {
    const response = await api.put(`${this.API_BASE_URL}/warmup/${id}/wallets`, { 
      walletIds 
    }, {
      headers: this.headers
    });
    return response.data;
  }

  // Get warmup process statistics (GET /warmup/:id/statistics)
  static async getWarmupStatistics(id: string): Promise<IWarmupStatistics> {
    const response = await api.get(`${this.API_BASE_URL}/warmup/${id}/statistics`);
    return response.data;
  }

  // Get multi-chain statistics (new method)
  static async getMultiChainStatistics() {
    return MultiChainService.getMultiChainStatistics();
  }

  // Delete warmup process
  static async deleteWarmupProcess(id: string): Promise<void> {
    await api.delete(`${this.API_BASE_URL}/warmup/${id}`);
  }

  // Get global warmup statistics (GET /warmup/statistics)
  static async getGlobalWarmupStatistics(): Promise<IWarmupStatistics> {
    const response = await api.get(`${this.API_BASE_URL}/warmup/statistics`);
    return response.data;
  }

  // Enhanced error handling wrapper
  static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Retry logic for API calls
  static async retryApiCall<T>(
    apiFunction: () => Promise<T>, 
    maxRetries: number = 3, 
    delayMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiFunction();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Polling-based monitoring for process statistics
  static async pollProcessStatistics(
    processId: string, 
    onUpdate: (stats: IWarmupStatistics) => void,
    intervalMs: number = 5000,
    maxDurationMs: number = 300000 // 5 minutes
  ): Promise<void> {
    const startTime = Date.now();
    
    const poll = async () => {
      try {
        const stats = await this.getWarmupStatistics(processId);
        onUpdate(stats);
        
        // Stop polling if process is completed or stopped
        if (stats.status === 'COMPLETED' || stats.status === 'STOPPED') {
          return;
        }
        
        // Stop polling if max duration exceeded
        if (Date.now() - startTime > maxDurationMs) {
          console.log('Polling stopped: max duration exceeded');
          return;
        }
        
        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        console.error('Error polling process statistics:', error);
        // Continue polling even on error
        setTimeout(poll, intervalMs);
      }
    };
    
    poll();
  }

  // Polling-based monitoring for multi-chain process statistics (new method)
  static async pollMultiChainProcessStatistics(
    processId: string,
    onUpdate: (process: MultiChainProcess) => void,
    intervalMs: number = 5000,
    maxDurationMs: number = 300000 // 5 minutes
  ): Promise<void> {
    const startTime = Date.now();
    
    const poll = async () => {
      try {
        const process = await this.getMultiChainProcess(processId);
        onUpdate(process);
        
        // Stop polling if process is completed or failed
        if (process.status === 'completed' || process.status === 'failed') {
          return;
        }
        
        // Stop polling if max duration exceeded
        if (Date.now() - startTime > maxDurationMs) {
          console.log('Multi-chain polling stopped: max duration exceeded');
          return;
        }
        
        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        console.error('Error polling multi-chain process statistics:', error);
        // Continue polling even on error
        setTimeout(poll, intervalMs);
      }
    };
    
    poll();
  }

  // Test backend connectivity and endpoint availability
  static async testBackendConnectivity(): Promise<{ available: boolean; error?: string }> {
    try {
      console.log('🔍 Testing backend connectivity...');
      
      // Test GET endpoint first
      const getResponse = await api.get(`${this.API_BASE_URL}/warmup`);
      console.log('✅ GET /warmup endpoint available');
      
      // Get available wallets from backend first
      console.log('🔍 Fetching available wallets from backend...');
      const walletsResponse = await api.get('/api/wallets/available');
      const availableWallets = walletsResponse.data;
      console.log('🔍 Available wallets from backend:', availableWallets);
      
      if (!availableWallets || availableWallets.length === 0) {
        return { 
          available: false, 
          error: 'No wallets available in backend. Please create wallets first.' 
        };
      }
      
      // Use the first available wallet ID for testing
      const testWalletId = availableWallets[0]._id;
      console.log('🔍 Using wallet ID for test:', testWalletId);
      
      // Test POST endpoint with minimal valid data
      const testData = {
        name: 'Test Process',
        walletIds: [testWalletId],
        configuration: {
          maxConcurrentWallets: 1
        }
      };
      
      console.log('🔍 Testing POST with data:', testData);
      
      const postResponse = await api.post(`${this.API_BASE_URL}/warmup`, testData, {
        headers: this.headers
      });
      console.log('✅ POST /warmup endpoint available');
      
      return { available: true };
    } catch (error: any) {
      console.error('❌ Backend connectivity test failed:', error.response?.data);
      return { 
        available: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  // Test multi-chain backend connectivity (new method)
  static async testMultiChainBackendConnectivity(): Promise<{ available: boolean; error?: string }> {
    try {
      console.log('🔍 Testing multi-chain backend connectivity...');
      
      // Test multi-chain endpoints
      const multiChainResponse = await api.get('/api/warmup/multi-chain');
      console.log('✅ Multi-chain endpoints available');
      
      return { available: true };
    } catch (error: any) {
      console.error('❌ Multi-chain backend connectivity test failed:', error.response?.data);
      return { 
        available: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }
}
