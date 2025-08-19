import api from './api';
import { 
  IWallet, 
  IWarmUpWallet, 
  CreateWalletDto, 
  CreateBatchWalletsDto, 
  WalletFilters,
  WalletType,
  WalletStatus 
} from '../types/wallet';

export class WalletService {
  // Get all wallets with optional filters
  static async getWallets(filters?: WalletFilters): Promise<IWarmUpWallet[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.chainId) params.append('chainId', filters.chainId.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/wallets?${params.toString()}`);
    return response.data;
  }

  // Get available wallets (not in any process)
  static async getAvailableWallets(): Promise<IWarmUpWallet[]> {
    const response = await api.get('/wallets/available');
    return response.data;
  }

  // Get specific wallet by ID
  static async getWallet(id: string): Promise<IWarmUpWallet> {
    const response = await api.get(`/wallets/${id}`);
    return response.data;
  }

  // Create single wallet
  static async createWallet(wallet: CreateWalletDto): Promise<IWarmUpWallet> {
    const response = await api.post('/wallets', wallet);
    return response.data;
  }

  // Create batch wallets
  static async createBatchWallets(batch: CreateBatchWalletsDto): Promise<IWarmUpWallet[]> {
    const response = await api.post('/wallets/batch', batch);
    return response.data;
  }

  // Update wallet status
  static async updateWalletStatus(id: string, status: WalletStatus): Promise<IWarmUpWallet> {
    const response = await api.put(`/wallets/${id}/status`, { status });
    return response.data;
  }

  // Update wallet type
  static async updateWalletType(id: string, type: WalletType): Promise<IWarmUpWallet> {
    const response = await api.put(`/wallets/${id}/type`, { type });
    return response.data;
  }

  // Delete wallet
  static async deleteWallet(id: string): Promise<void> {
    await api.delete(`/wallets/${id}`);
  }

  // Get wallet statistics
  static async getWalletStatistics() {
    const response = await api.get('/wallets/statistics');
    return response.data;
  }
}
