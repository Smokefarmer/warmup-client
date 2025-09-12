import api from './api';
import { 
  ProtectedToken, 
  CreateProtectedTokenDto, 
  BulkCreateProtectedTokensDto,
  ProtectedTokenCheckResponse,
  ProtectedTokenStatistics
} from '../types/protectedToken';

export class ProtectedTokenService {
  // Get all protected tokens
  static async getProtectedTokens(): Promise<ProtectedToken[]> {
    try {
      const response = await api.get('/api/protected-tokens');
      console.log('Protected tokens API response:', response.data);
      
      // The API returns an object with protectedTokens array inside
      const tokens = response.data?.protectedTokens || response.data;
      
      // Ensure we always return an array
      if (!Array.isArray(tokens)) {
        console.warn('API returned non-array data for protected tokens:', response.data);
        return [];
      }
      
      return tokens;
    } catch (error) {
      console.error('Error fetching protected tokens:', error);
      throw error;
    }
  }

  // Add a single protected token
  static async createProtectedToken(token: CreateProtectedTokenDto): Promise<ProtectedToken> {
    try {
      const response = await api.post('/api/protected-tokens', token);
      return response.data;
    } catch (error) {
      console.error('Error creating protected token:', error);
      throw error;
    }
  }

  // Add multiple protected tokens at once
  static async createBulkProtectedTokens(data: BulkCreateProtectedTokensDto): Promise<ProtectedToken[]> {
    try {
      const response = await api.post('/api/protected-tokens/bulk', data);
      return response.data;
    } catch (error) {
      console.error('Error creating bulk protected tokens:', error);
      throw error;
    }
  }

  // Check if a token is protected
  static async checkTokenProtection(tokenAddress: string): Promise<ProtectedTokenCheckResponse> {
    try {
      const response = await api.get(`/api/protected-tokens/check/${tokenAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error checking token protection:', error);
      throw error;
    }
  }

  // Remove protection from a token
  static async removeProtectedToken(tokenAddress: string): Promise<void> {
    try {
      await api.delete(`/api/protected-tokens/${tokenAddress}`);
    } catch (error) {
      console.error('Error removing protected token:', error);
      throw error;
    }
  }

  // Get protected token statistics
  static async getProtectedTokenStatistics(): Promise<ProtectedTokenStatistics> {
    try {
      const response = await api.get('/api/protected-tokens/statistics');
      console.log('Protected tokens statistics API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching protected token statistics:', error);
      throw error;
    }
  }
}
