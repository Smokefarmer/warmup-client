import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { 
  MonitoringService, 
  SystemHealth, 
  ProcessStatistics, 
  WalletStatistics, 
  BalanceSummary 
} from '../services/monitoringService';

// Query keys for monitoring
export const monitoringKeys = {
  all: ['monitoring'] as const,
  health: () => [...monitoringKeys.all, 'health'] as const,
  processes: () => [...monitoringKeys.all, 'processes'] as const,
  wallets: (type?: string) => [...monitoringKeys.all, 'wallets', type] as const,
  balances: () => [...monitoringKeys.all, 'balances'] as const,
};

// Hook for system health monitoring with auto-refresh
export const useSystemHealth = (refreshInterval: number = 30000) => {
  return useQuery({
    queryKey: monitoringKeys.health(),
    queryFn: MonitoringService.getSystemHealth,
    refetchInterval: refreshInterval,
    staleTime: 15000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3) return true;
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for process statistics
export const useProcessStatistics = (refreshInterval: number = 60000) => {
  return useQuery({
    queryKey: monitoringKeys.processes(),
    queryFn: MonitoringService.getProcessStatistics,
    refetchInterval: refreshInterval,
    staleTime: 30000,
  });
};

// Hook for wallet statistics
export const useWalletStatistics = (type?: string, refreshInterval: number = 60000) => {
  return useQuery({
    queryKey: monitoringKeys.wallets(type),
    queryFn: () => MonitoringService.getWalletStatistics(type),
    refetchInterval: refreshInterval,
    staleTime: 30000,
  });
};

// Hook for balance summary
export const useBalanceSummary = (refreshInterval: number = 45000) => {
  return useQuery({
    queryKey: monitoringKeys.balances(),
    queryFn: MonitoringService.getBalanceSummary,
    refetchInterval: refreshInterval,
    staleTime: 20000,
  });
};

// Advanced hook for real-time health monitoring with WebSocket-like behavior
export const useRealTimeHealth = (options?: {
  refreshInterval?: number;
  onHealthChange?: (health: SystemHealth) => void;
  onError?: (error: Error) => void;
}) => {
  const { refreshInterval = 10000, onHealthChange, onError } = options || {};
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void) | null>(null);

  const {
    data: health,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: monitoringKeys.health(),
    queryFn: MonitoringService.getSystemHealth,
    refetchInterval: refreshInterval,
    staleTime: 5000,
  });

  // Handle success and error states with useEffect
  useEffect(() => {
    if (health) {
      setIsConnected(true);
      setLastUpdate(new Date());
      onHealthChange?.(health);
    }
  }, [health, onHealthChange]);

  useEffect(() => {
    if (error) {
      setIsConnected(false);
      onError?.(error as Error);
    }
  }, [error, onError]);

  // Start real-time monitoring
  const startMonitoring = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    cleanupRef.current = MonitoringService.startHealthMonitoring(
      (updatedHealth) => {
        queryClient.setQueryData(monitoringKeys.health(), updatedHealth);
        setLastUpdate(new Date());
        onHealthChange?.(updatedHealth);
      },
      refreshInterval
    );
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setIsConnected(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    health,
    error,
    isLoading,
    isConnected,
    lastUpdate,
    refetch,
    startMonitoring,
    stopMonitoring
  };
};

// Hook for monitoring specific process with live updates
export const useProcessLiveMonitoring = (processId: string, enabled: boolean = true) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveStats, setLiveStats] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startLiveMonitoring = () => {
    if (!enabled || !processId || isMonitoring) return;

    setIsMonitoring(true);
    
    const pollStats = async () => {
      try {
        const stats = await MonitoringService.getDetailedProcessStatistics(processId);
        setLiveStats(stats);
      } catch (error) {
        console.error('Error polling process stats:', error);
      }
    };

    // Initial fetch
    pollStats();

    // Set up polling every 5 seconds
    intervalRef.current = setInterval(pollStats, 5000);
  };

  const stopLiveMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  };

  // Auto start/stop based on enabled flag
  useEffect(() => {
    if (enabled) {
      startLiveMonitoring();
    } else {
      stopLiveMonitoring();
    }

    return () => {
      stopLiveMonitoring();
    };
  }, [enabled, processId]);

  return {
    liveStats,
    isMonitoring,
    startLiveMonitoring,
    stopLiveMonitoring
  };
};

// Hook for aggregated dashboard data
export const useDashboardData = (refreshInterval: number = 30000) => {
  const healthQuery = useSystemHealth(refreshInterval);
  const processesQuery = useProcessStatistics(60000);
  const walletsQuery = useWalletStatistics(undefined, 60000);
  const balancesQuery = useBalanceSummary(45000);

  return {
    health: healthQuery.data,
    processes: processesQuery.data,
    wallets: walletsQuery.data,
    balances: balancesQuery.data,
    isLoading: healthQuery.isLoading || processesQuery.isLoading || walletsQuery.isLoading || balancesQuery.isLoading,
    error: healthQuery.error || processesQuery.error || walletsQuery.error || balancesQuery.error,
    refetchAll: () => {
      healthQuery.refetch();
      processesQuery.refetch();
      walletsQuery.refetch();
      balancesQuery.refetch();
    }
  };
};

// Hook for connection status monitoring
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check API connectivity
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const result = await MonitoringService.testMonitoringConnectivity();
        setApiStatus(result.available ? 'connected' : 'disconnected');
      } catch (error) {
        setApiStatus('disconnected');
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    apiStatus,
    isFullyConnected: isOnline && apiStatus === 'connected'
  };
};
