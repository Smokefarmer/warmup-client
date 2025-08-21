import api from './api';
import { 
  IWallet, 
  IWarmUpWallet, 
  CreateWalletDto, 
  CreateBatchWalletsDto, 
  WalletFilters,
  WalletType,
  WalletStatus,
  ChainId,
  CreateMultiChainWalletDto
} from '../types/wallet';
import { MultiChainService } from './multiChainService';

export class WalletService {
  // Get all wallets with optional filters
  static async getWallets(filters?: WalletFilters): Promise<IWarmUpWallet[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.chainId) params.append('chainId', filters.chainId.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    console.log('🌐 API Call - getWallets:', {
      url: `/api/wallets?${params.toString()}`,
      baseURL: api.defaults.baseURL,
      fullURL: `${api.defaults.baseURL}/api/wallets?${params.toString()}`
    });

    try {
      const response = await api.get(`/api/wallets?${params.toString()}`);
      console.log('✅ API Response - getWallets:', {
        status: response.status,
        data: response.data,
        dataLength: response.data?.length
      });
      return response.data;
    } catch (error) {
      console.error('❌ API Error - getWallets:', error);
      throw error;
    }
  }

  // Get available wallets (not in any process)
  static async getAvailableWallets(): Promise<IWarmUpWallet[]> {
    console.log('🌐 API Call - getAvailableWallets');
    try {
      const response = await api.get('/api/wallets/available');
      console.log('✅ API Response - getAvailableWallets:', {
        status: response.status,
        data: response.data,
        dataLength: response.data?.length,
        firstWallet: response.data?.[0]
      });
      return response.data;
    } catch (error) {
      console.error('❌ API Error - getAvailableWallets:', error);
      throw error;
    }
  }

  // Get specific wallet by ID
  static async getWallet(id: string): Promise<IWarmUpWallet> {
    const response = await api.get(`/api/wallets/${id}`);
    return response.data;
  }

  // Create single wallet
  static async createWallet(wallet: CreateWalletDto): Promise<IWarmUpWallet> {
    const response = await api.post('/api/wallets', wallet);
    return response.data;
  }

  // Create multi-chain wallet (new method)
  static async createMultiChainWallet(wallet: CreateMultiChainWalletDto): Promise<IWarmUpWallet> {
    return MultiChainService.createWallet(wallet);
  }

  // Create batch wallets
  static async createBatchWallets(batch: CreateBatchWalletsDto): Promise<IWarmUpWallet[]> {
    const response = await api.post('/api/wallets/batch', batch);
    return response.data;
  }

  // Create multi-chain batch wallets (new method)
  static async createMultiChainBatchWallets(wallets: CreateMultiChainWalletDto[]): Promise<IWarmUpWallet[]> {
    return MultiChainService.createMultiChainWallets(wallets);
  }

  // Update wallet status
  static async updateWalletStatus(id: string, status: WalletStatus): Promise<IWarmUpWallet> {
    const response = await api.put(`/api/wallets/${id}/status`, { status });
    return response.data;
  }

  // Update wallet type
  static async updateWalletType(id: string, type: WalletType): Promise<IWarmUpWallet> {
    const response = await api.put(`/api/wallets/${id}/type`, { type });
    return response.data;
  }

  // Delete wallet
  static async deleteWallet(id: string): Promise<void> {
    await api.delete(`/api/wallets/${id}`);
  }

  // Get wallet statistics
  static async getWalletStatistics() {
    const response = await api.get('/api/wallets/statistics');
    return response.data;
  }

  // Get wallets by chain (new method)
  static async getWalletsByChain(chainId: ChainId): Promise<IWarmUpWallet[]> {
    return MultiChainService.getWalletsByChain(chainId);
  }

  // Get wallet balance for specific chain (new method)
  static async getWalletBalance(chainId: ChainId, publicKey: string) {
    return MultiChainService.getWalletBalance(chainId, publicKey);
  }

  // Get transaction status for specific chain (new method)
  static async getTransactionStatus(chainId: ChainId, txHash: string) {
    return MultiChainService.getTransactionStatus(chainId, txHash);
  }

  // Get supported chains (new method)
  static getSupportedChains() {
    return MultiChainService.getSupportedChains();
  }

  // Get chain configuration (new method)
  static getChainConfig(chainId: ChainId) {
    return MultiChainService.getChainConfig(chainId);
  }

  // Validate chain support (new method)
  static isChainSupported(chainId: number): boolean {
    return MultiChainService.isChainSupported(chainId);
  }

  // Get chain name (new method)
  static getChainName(chainId: ChainId): string {
    return MultiChainService.getChainName(chainId);
  }
}
