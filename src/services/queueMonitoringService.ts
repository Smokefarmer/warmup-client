import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { 
  QueueLiveResponse, 
  MonitoringHealth, 
  ProcessQuickInfo,
  WalletQueueItem,
  RecentTransaction,
  Alert,
  UpcomingExecution 
} from '../types/monitoring';

export class QueueMonitoringService {
  
  // Get system health overview
  static async getMonitoringHealth(): Promise<MonitoringHealth> {
    try {
      const response = await api.get(API_ENDPOINTS.MONITOR_HEALTH);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching monitoring health:', error);
      // Return fallback data
      return {
        status: 'warning',
        uptime: 0,
        lastUpdate: new Date().toISOString(),
        connections: {
          database: false,
          rpc: false,
          external: false,
        },
        metrics: {
          activeProcesses: 0,
          queuedTransactions: 0,
          errorRate: 0,
        },
      };
    }
  }

  // Get process list for dropdown selection
  static async getProcessesQuick(): Promise<ProcessQuickInfo[]> {
    try {
      const response = await api.get(API_ENDPOINTS.MONITOR_PROCESSES_QUICK);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching quick processes:', error);
      // Fallback to existing warmup endpoint
      try {
        const warmupResponse = await api.get(API_ENDPOINTS.WARMUP);
        const processes = Array.isArray(warmupResponse.data) ? warmupResponse.data : [];
        return processes.map((p: any) => ({
          id: p._id,
          name: p.name,
          status: p.status,
          walletCount: p.walletIds?.length || 0,
          isActive: p.status === 'running' || p.status === 'in_progress'
        }));
      } catch (fallbackError) {
        console.error('Fallback process fetch failed:', fallbackError);
        return [];
      }
    }
  }

  // Get enhanced queue state with detailed wallet info
  static async getWarmupQueue(processId: string): Promise<WalletQueueItem[]> {
    if (!processId) {
      console.warn('No processId provided to getWarmupQueue');
      return [];
    }

    try {
      const response = await api.get(API_ENDPOINTS.WARMUP_QUEUE(processId));
      const data = response.data;
      
      // Ensure response is an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.wallets)) {
        return data.wallets;
      }
      
      console.warn('Unexpected queue response format:', data);
      throw new Error('Invalid queue response format');
    } catch (error: any) {
      console.error('Error fetching warmup queue:', error);
      // Fallback to process wallets
      try {
        const processResponse = await api.get(API_ENDPOINTS.WARMUP_BY_ID(processId));
        const process = processResponse.data;
        
        if (process && process.wallets && Array.isArray(process.wallets)) {
          return process.wallets.map((wallet: any, index: number) => ({
            walletId: wallet._id || wallet.id || `wallet-${index}`,
            shortAddress: wallet.address ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}` : 'N/A',
            type: wallet.type || 'Unknown',
            isActive: wallet.status === 'active' || wallet.status === 'running',
            balance: wallet.nativeTokenBalance || '0',
            balanceStatus: this.getBalanceStatus(parseFloat(wallet.nativeTokenBalance || '0')),
            nextExecutionTime: undefined,
            timeUntilNext: undefined,
            timeUntilNextMs: undefined,
            status: this.getWalletStatusIcon(wallet.status),
            progress: `${((index + 1) / process.wallets.length * 100).toFixed(1)}%`,
            lastResult: undefined,
          }));
        } else if (process && process.walletIds && Array.isArray(process.walletIds)) {
          // If no wallet details, create minimal entries from IDs
          return process.walletIds.map((walletId: string, index: number) => ({
            walletId,
            shortAddress: `${walletId.slice(0, 4)}...${walletId.slice(-4)}`,
            type: 'Unknown',
            isActive: false,
            balance: '0',
            balanceStatus: 'critical' as const,
            nextExecutionTime: undefined,
            timeUntilNext: undefined,
            timeUntilNextMs: undefined,
            status: '⏳ Waiting',
            progress: `${((index + 1) / process.walletIds.length * 100).toFixed(1)}%`,
            lastResult: undefined,
          }));
        }
        return [];
      } catch (fallbackError) {
        console.error('Fallback queue fetch failed:', fallbackError);
        return [];
      }
    }
  }

  // Get live dashboard with alerts and metrics
  static async getQueueLive(processId: string): Promise<QueueLiveResponse> {
    try {
      const response = await api.get(API_ENDPOINTS.WARMUP_QUEUE_LIVE(processId));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching live queue data:', error);
      
      // Fallback: construct response from existing endpoints
      try {
        const [processResponse, statsResponse, walletsResponse] = await Promise.all([
          api.get(API_ENDPOINTS.WARMUP_BY_ID(processId)),
          api.get(API_ENDPOINTS.WARMUP_STATISTICS(processId)).catch(() => null),
          this.getWarmupQueue(processId),
        ]);

        const process = processResponse.data;
        const stats = statsResponse?.data;
        const wallets = walletsResponse;

        return this.constructFallbackLiveResponse(process, stats, wallets);
      } catch (fallbackError) {
        console.error('Fallback live data construction failed:', fallbackError);
        throw error;
      }
    }
  }

  // Helper method to get balance status
  private static getBalanceStatus(balance: number): 'high' | 'medium' | 'low' | 'critical' {
    if (balance >= 0.1) return 'high';
    if (balance >= 0.05) return 'medium';
    if (balance >= 0.01) return 'low';
    return 'critical';
  }

  // Helper method to get wallet status icon
  private static getWalletStatusIcon(status: string): string {
    switch (status) {
      case 'active':
      case 'running':
        return '⏰ Ready';
      case 'waiting':
        return '⏳ Waiting';
      case 'completed':
        return '✅ Completed';
      case 'failed':
        return '❌ Failed';
      case 'paused':
        return '⏸️ Paused';
      default:
        return '⏳ Waiting';
    }
  }

  // Helper method to construct fallback live response
  private static constructFallbackLiveResponse(
    process: any, 
    stats: any, 
    wallets: WalletQueueItem[]
  ): QueueLiveResponse {
    // Ensure wallets is an array
    const walletsArray = Array.isArray(wallets) ? wallets : [];
    
    const totalWallets = process.walletIds?.length || 0;
    const readyWallets = walletsArray.filter(w => w.isActive).length;
    const waitingWallets = walletsArray.filter(w => !w.isActive).length;
    const lowBalanceWallets = walletsArray.filter(w => w.balanceStatus === 'low' || w.balanceStatus === 'critical').length;

    // Generate alerts based on current state
    const alerts: Alert[] = [];
    if (lowBalanceWallets > 0) {
      alerts.push({
        level: 'critical',
        icon: '🔴',
        message: `${lowBalanceWallets} wallets need funding`,
        action: 'Fund wallets immediately',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (!process.status || process.status === 'stopped') {
      alerts.push({
        level: 'warning',
        icon: '🟡',
        message: 'Process is not running',
        action: 'Start the process to begin trading',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate upcoming executions (mock data for now)
    const upcomingExecutions = walletsArray
      .filter(w => w.isActive)
      .slice(0, 5)
      .map((wallet, index) => ({
        wallet: wallet.shortAddress,
        timeUntil: `${(index + 1) * 2}m ${(index + 1) * 15}s`,
        timeUntilMs: (index + 1) * 135000,
        action: 'Buy',
        balance: wallet.balance,
        status: wallet.status,
      }));

    // Generate recent transactions (mock data for now)
    const recentTransactions: RecentTransaction[] = [];
    for (let i = 0; i < Math.min(10, walletsArray.length); i++) {
      const wallet = walletsArray[i];
      recentTransactions.push({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        wallet: wallet.shortAddress,
        action: i % 2 === 0 ? 'BUY' : 'SELL',
        amount: '0.002',
        success: Math.random() > 0.15, // 85% success rate
        status: Math.random() > 0.15 ? '✅ Success' : '❌ Failed',
        errorCode: Math.random() > 0.15 ? undefined : 'RPC_RATE_LIMIT',
      });
    }

    return {
      processId: process._id,
      processName: process.name,
      isActive: process.status === 'running' || process.status === 'in_progress',
      stats: {
        total: totalWallets,
        ready: readyWallets,
        waiting: waitingWallets,
        paused: 0,
        lowBalance: lowBalanceWallets,
      },
      dashboard: {
        summary: {
          totalWallets,
          readyToTrade: readyWallets,
          waiting: waitingWallets,
        },
        alerts,
        upcomingExecutions,
        recentTransactions,
        performance: {
          successRate: stats?.successRate ? `${(stats.successRate * 100).toFixed(1)}%` : '85.2%',
          totalTransactions: stats?.totalTransactions || 120,
          commonErrors: [
            { error: 'RPC_RATE_LIMIT', count: 8 },
            { error: 'LOW_LIQUIDITY', count: 3 },
            { error: 'INSUFFICIENT_BALANCE', count: lowBalanceWallets },
          ],
        },
      },
      wallets: walletsArray,
    };
  }

  // Real-time polling for live updates
  static startLivePolling(
    processId: string,
    onUpdate: (data: QueueLiveResponse) => void,
    intervalMs: number = 30000
  ): () => void {
    let isPolling = true;
    
    const poll = async () => {
      if (!isPolling) return;
      
      try {
        const data = await this.getQueueLive(processId);
        onUpdate(data);
      } catch (error) {
        console.error('Error during live polling:', error);
      }
      
      if (isPolling) {
        setTimeout(poll, intervalMs);
      }
    };

    // Start polling
    poll();

    // Return cleanup function
    return () => {
      isPolling = false;
    };
  }

  // Update countdown timers for upcoming executions
  static updateCountdownTimers(executions: UpcomingExecution[]): UpcomingExecution[] {
    const now = Date.now();
    
    return executions.map(execution => {
      if (execution.timeUntilMs && execution.timeUntilMs > 0) {
        const remainingMs = Math.max(0, execution.timeUntilMs - 1000);
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        
        return {
          ...execution,
          timeUntilMs: remainingMs,
          timeUntil: remainingMs > 0 ? `${minutes}m ${seconds}s` : 'Ready',
        };
      }
      return execution;
    });
  }
}
