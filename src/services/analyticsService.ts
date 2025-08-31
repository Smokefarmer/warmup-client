import api from './api';

export interface AnalyticsData {
  overview: {
    totalPlans: number;
    totalWallets: number;
    totalSolSpent: string;
    activeJobs: number;
  };
  efficiency: {
    successRate: string; // percentage
    costPerWallet: string; // SOL
    averageExecutionTime: number; // seconds
  };
  fundingMethods: {
    directTransfer: {
      count: number;
      averageCost: string;
      successRate: string;
    };
    wsolCleanFunds: {
      count: number;
      averageCost: string;
      successRate: string;
    };
  };
  recentActivity: Array<{
    id: string;
    type: string;
    timestamp: string;
    status: string;
    walletsAffected: number;
    amount?: string;
  }>;
  performanceMetrics: {
    totalTransactions: number;
    totalVolume: string;
    errorRate: string;
    uptime: string;
  };
}

export class AnalyticsService {
  // Get comprehensive analytics
  static async getAnalytics(): Promise<AnalyticsData> {
    try {
      const response = await api.get('/api/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Get efficiency metrics
  static async getEfficiencyMetrics(timeRange?: string): Promise<AnalyticsData['efficiency']> {
    try {
      const params = timeRange ? `?timeRange=${timeRange}` : '';
      const response = await api.get(`/api/analytics/efficiency${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching efficiency metrics:', error);
      throw error;
    }
  }

  // Get funding method comparison
  static async getFundingMethodComparison(): Promise<AnalyticsData['fundingMethods']> {
    try {
      const response = await api.get('/api/analytics/funding-methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching funding method comparison:', error);
      throw error;
    }
  }

  // Get system health metrics
  static async getSystemHealth(): Promise<{
    apiServer: 'healthy' | 'degraded' | 'down';
    database: 'healthy' | 'degraded' | 'down';
    blockchain: 'healthy' | 'degraded' | 'down';
    lastChecked: string;
  }> {
    try {
      const response = await api.get('/api/analytics/system-health');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  // Get performance trends
  static async getPerformanceTrends(timeRange: '24h' | '7d' | '30d' = '7d'): Promise<{
    successRate: Array<{ timestamp: string; value: number }>;
    executionTime: Array<{ timestamp: string; value: number }>;
    costEfficiency: Array<{ timestamp: string; value: number }>;
  }> {
    try {
      const response = await api.get(`/api/analytics/trends?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      throw error;
    }
  }
}
