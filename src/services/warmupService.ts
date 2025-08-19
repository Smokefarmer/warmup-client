import api from './api';
import { 
  IWarmupProcess, 
  IWarmupStatistics, 
  CreateWarmupProcessDto, 
  WarmupFilters 
} from '../types/warmup';

export class WarmupService {
  // Get all warmup processes with optional filters
  static async getWarmupProcesses(filters?: WarmupFilters): Promise<IWarmupProcess[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/api/warmup?${params.toString()}`);
    return response.data;
  }

  // Get specific warmup process by ID
  static async getWarmupProcess(id: string): Promise<IWarmupProcess> {
    const response = await api.get(`/api/warmup/${id}`);
    return response.data;
  }

  // Create new warmup process
  static async createWarmupProcess(process: CreateWarmupProcessDto): Promise<IWarmupProcess> {
    const response = await api.post('/api/warmup', process);
    return response.data;
  }

  // Start warmup process
  static async startWarmupProcess(id: string): Promise<IWarmupProcess> {
    const response = await api.post(`/api/warmup/${id}/start`);
    return response.data;
  }

  // Stop warmup process
  static async stopWarmupProcess(id: string): Promise<IWarmupProcess> {
    const response = await api.post(`/api/warmup/${id}/stop`);
    return response.data;
  }

  // Add wallets to warmup process
  static async addWalletsToProcess(id: string, walletIds: string[]): Promise<IWarmupProcess> {
    const response = await api.put(`/api/warmup/${id}/wallets`, { walletIds });
    return response.data;
  }

  // Get warmup process statistics
  static async getWarmupStatistics(id: string): Promise<IWarmupStatistics> {
    const response = await api.get(`/api/warmup/${id}/statistics`);
    return response.data;
  }

  // Delete warmup process
  static async deleteWarmupProcess(id: string): Promise<void> {
    await api.delete(`/api/warmup/${id}`);
  }

  // Get global warmup statistics
  static async getGlobalWarmupStatistics(): Promise<IWarmupStatistics> {
    const response = await api.get('/api/warmup/statistics');
    return response.data;
  }
}
