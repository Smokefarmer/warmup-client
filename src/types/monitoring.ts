// Types for the new monitoring dashboard based on the requirements

export interface QueueLiveResponse {
  processId: string;
  processName: string;
  isActive: boolean;
  stats: {
    total: number;
    ready: number;
    waiting: number;
    paused: number;
    lowBalance: number;
  };
  dashboard: {
    summary: {
      totalWallets: number;
      readyToTrade: number;
      waiting: number;
    };
    alerts: Alert[];
    upcomingExecutions: UpcomingExecution[];
    recentTransactions: RecentTransaction[];
    performance: {
      successRate: string;
      totalTransactions: number;
      commonErrors: CommonError[];
    };
  };
  wallets: WalletQueueItem[];
}

export interface Alert {
  level: 'critical' | 'warning' | 'info';
  icon: string;
  message: string;
  action: string;
  timestamp?: string;
}

export interface UpcomingExecution {
  wallet: string;
  timeUntil: string;
  timeUntilMs: number;
  action: string;
  balance: string;
  status?: string;
}

export interface RecentTransaction {
  timestamp: string;
  wallet: string;
  action: 'BUY' | 'SELL' | 'TRANSFER';
  amount: string;
  success: boolean;
  status: string;
  errorCode?: string;
  txHash?: string;
}

export interface CommonError {
  error: string;
  count: number;
  description?: string;
}

export interface WalletQueueItem {
  walletId: string;
  shortAddress: string;
  type: string;
  isActive: boolean;
  balance: string;
  balanceStatus: 'high' | 'medium' | 'low' | 'critical';
  nextExecutionTime?: string;
  timeUntilNext?: string;
  timeUntilNextMs?: number;
  status: string;
  progress: string;
  lastResult?: {
    success: boolean;
    action: string;
    error?: string;
    timestamp?: string;
  };
}

export interface MonitoringHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastUpdate: string;
  connections: {
    database: boolean;
    rpc: boolean;
    external: boolean;
  };
  metrics: {
    activeProcesses: number;
    queuedTransactions: number;
    errorRate: number;
  };
}

export interface ProcessQuickInfo {
  id: string;
  name: string;
  status: string;
  walletCount: number;
  isActive: boolean;
}

// Dashboard configuration
export interface DashboardConfig {
  refreshInterval: number;
  alertThresholds: {
    lowBalance: number;
    errorRate: number;
    queueDelay: number;
  };
  colors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// Status icons mapping
export const STATUS_ICONS = {
  success: '✅',
  error: '❌',
  ready: '⏰',
  waiting: '⏳',
  lowBalance: '⚠️',
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
  paused: '⏸️',
  running: '▶️',
  stopped: '⏹️',
} as const;

export type StatusIcon = keyof typeof STATUS_ICONS;
