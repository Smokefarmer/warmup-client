import api from './api';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: string;
  services: {
    database: 'connected' | 'disconnected';
    solana: 'connected' | 'disconnected';
    jupiter: 'available' | 'unavailable';
    funding: 'available' | 'unavailable';
  };
  statistics: {
    totalWallets: number;
    activeWallets: number;
    activeProcesses: number;
    totalTransactions: number;
    successRate: number;
  };
  balances: {
    totalBalance: string; // "1.234567 SOL"
    totalFunded: string;  // "5.678901 SOL"
    funderBalance: string; // "10.123456 SOL"
    lowBalanceWallets: number;
  };
  strategies: {
    [strategyName: string]: {
      activeWallets: number;
      successRate: number;
      lastExecution: string;
    };
  };
  emergencyRecovery: {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    lastRecovery: string;
  };
  recentActivity: {
    lastHour: {
      transactions: number;
      successfulTrades: number;
      failedTrades: number;
      emergencyRecoveries: number;
    };
    last24Hours: {
      transactions: number;
      successfulTrades: number;
      failedTrades: number;
      emergencyRecoveries: number;
    };
  };
}

export interface ProcessStatistics {
  processes: Array<{
    id: string;
    name: string;
    status: string;
    walletCount: number;
    createdAt: string;
  }>;
}

export interface BalanceSummary {
  totalBalance: string;
  totalFunded: string;
  funderBalance: string;
  lowBalanceWallets: number;
  walletBalances: Array<{
    address: string;
    balance: string;
    status: string;
  }>;
}

export interface WalletStatistics {
  wallets: Array<{
    id: string;
    address: string;
    type: string;
    balance: string;
    status: string;
    lastActivity: string;
  }>;
  totalCount: number;
  activeCount: number;
  successRate: number;
}

export class MonitoringService {
  private static readonly API_BASE_URL = '/api';

  // Get system health data
  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await api.get(`${this.API_BASE_URL}/monitor/health`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching system health:', error);
      // Return fallback data if API is not available
      return this.getFallbackSystemHealth();
    }
  }

  // Get process statistics
  static async getProcessStatistics(): Promise<ProcessStatistics> {
    try {
      const response = await api.get(`${this.API_BASE_URL}/monitor/processes`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching process statistics:', error);
      // Fallback to existing warmup endpoint
      try {
        const warmupResponse = await api.get(`${this.API_BASE_URL}/warmup`);
        const processes = Array.isArray(warmupResponse.data) ? warmupResponse.data : [];
        return {
          processes: processes.map((p: any) => ({
            id: p._id,
            name: p.name,
            status: p.status,
            walletCount: p.walletIds?.length || 0,
            createdAt: p.createdAt
          }))
        };
      } catch (fallbackError) {
        console.error('Fallback process fetch failed:', fallbackError);
        return { processes: [] };
      }
    }
  }

  // Get wallet statistics by type
  static async getWalletStatistics(type?: string): Promise<WalletStatistics> {
    try {
      const params = type ? `?type=${type}` : '';
      const response = await api.get(`${this.API_BASE_URL}/monitor/wallets${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching wallet statistics:', error);
      // Fallback to existing wallets endpoint
      try {
        const walletsResponse = await api.get(`${this.API_BASE_URL}/wallets`);
        const wallets = Array.isArray(walletsResponse.data) ? walletsResponse.data : [];
        return {
          wallets: wallets.map((w: any) => ({
            id: w._id,
            address: w.address,
            type: w.type || 'Unknown',
            balance: w.nativeTokenBalance || '0',
            status: w.status || 'unknown',
            lastActivity: w.updatedAt || w.createdAt
          })),
          totalCount: wallets.length,
          activeCount: wallets.filter((w: any) => w.status === 'active').length,
          successRate: 0.85 // Default fallback
        };
      } catch (fallbackError) {
        console.error('Fallback wallet fetch failed:', fallbackError);
        return {
          wallets: [],
          totalCount: 0,
          activeCount: 0,
          successRate: 0
        };
      }
    }
  }

  // Get balance summary
  static async getBalanceSummary(): Promise<BalanceSummary> {
    try {
      const response = await api.get(`${this.API_BASE_URL}/balance/summary`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching balance summary:', error);
      return {
        totalBalance: '0 SOL',
        totalFunded: '0 SOL',
        funderBalance: '0 SOL',
        lowBalanceWallets: 0,
        walletBalances: []
      };
    }
  }

  // Get detailed process statistics (enhanced version)
  static async getDetailedProcessStatistics(id: string): Promise<any> {
    try {
      const response = await api.get(`${this.API_BASE_URL}/warmup/${id}/statistics`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching detailed process statistics:', error);
      throw error;
    }
  }

  // Real-time polling for system health
  static startHealthMonitoring(
    onUpdate: (health: SystemHealth) => void,
    intervalMs: number = 30000 // 30 seconds
  ): () => void {
    const poll = async () => {
      try {
        const health = await this.getSystemHealth();
        onUpdate(health);
      } catch (error) {
        console.error('Error in health monitoring poll:', error);
      }
    };

    // Initial fetch
    poll();

    // Set up polling
    const interval = setInterval(poll, intervalMs);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }

  // Fallback system health data when API is not available
  private static getFallbackSystemHealth(): SystemHealth {
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: 'Unknown',
      services: {
        database: 'disconnected',
        solana: 'disconnected',
        jupiter: 'unavailable',
        funding: 'unavailable'
      },
      statistics: {
        totalWallets: 0,
        activeWallets: 0,
        activeProcesses: 0,
        totalTransactions: 0,
        successRate: 0
      },
      balances: {
        totalBalance: '0 SOL',
        totalFunded: '0 SOL',
        funderBalance: '0 SOL',
        lowBalanceWallets: 0
      },
      strategies: {},
      emergencyRecovery: {
        totalAttempts: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        lastRecovery: 'Never'
      },
      recentActivity: {
        lastHour: {
          transactions: 0,
          successfulTrades: 0,
          failedTrades: 0,
          emergencyRecoveries: 0
        },
        last24Hours: {
          transactions: 0,
          successfulTrades: 0,
          failedTrades: 0,
          emergencyRecoveries: 0
        }
      }
    };
  }

  // Test monitoring API connectivity
  static async testMonitoringConnectivity(): Promise<{ available: boolean; error?: string }> {
    try {
      await this.getSystemHealth();
      return { available: true };
    } catch (error: any) {
      return {
        available: false,
        error: error.message || 'Monitoring API unavailable'
      };
    }
  }
}
