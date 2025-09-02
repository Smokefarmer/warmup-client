import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useMemo } from 'react';
import { QueueMonitoringService } from '../services/queueMonitoringService';
import { 
  QueueLiveResponse, 
  MonitoringHealth, 
  ProcessQuickInfo,
  UpcomingExecution 
} from '../types/monitoring';

// Query keys for queue monitoring
export const queueMonitoringKeys = {
  all: ['queueMonitoring'] as const,
  health: () => [...queueMonitoringKeys.all, 'health'] as const,
  processesQuick: () => [...queueMonitoringKeys.all, 'processesQuick'] as const,
  queue: (processId: string) => [...queueMonitoringKeys.all, 'queue', processId] as const,
  queueLive: (processId: string) => [...queueMonitoringKeys.all, 'queueLive', processId] as const,
};

// Hook for monitoring health
export const useMonitoringHealth = (refreshInterval: number = 60000) => {
  return useQuery({
    queryKey: queueMonitoringKeys.health(),
    queryFn: QueueMonitoringService.getMonitoringHealth,
    refetchInterval: refreshInterval,
    staleTime: 30000,
    retry: 2,
  });
};

// Hook for quick process list
export const useProcessesQuick = () => {
  return useQuery({
    queryKey: queueMonitoringKeys.processesQuick(),
    queryFn: QueueMonitoringService.getProcessesQuick,
    staleTime: 60000,
  });
};

// Hook for warmup queue
export const useWarmupQueue = (processId: string) => {
  return useQuery({
    queryKey: queueMonitoringKeys.queue(processId),
    queryFn: () => QueueMonitoringService.getWarmupQueue(processId),
    enabled: !!processId,
    staleTime: 30000,
  });
};

// Hook for live queue monitoring with real-time updates
export const useQueueLive = (processId: string, autoRefresh: boolean = true) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLiveMode, setIsLiveMode] = useState(autoRefresh);
  const cleanupRef = useRef<(() => void) | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queueMonitoringKeys.queueLive(processId),
    queryFn: () => QueueMonitoringService.getQueueLive(processId),
    enabled: !!processId,
    refetchInterval: isLiveMode ? 30000 : false,
    staleTime: 15000,

  });

  // Update last update time when data changes
  useEffect(() => {
    if (query.data) {
      setLastUpdate(new Date());
    }
  }, [query.data]);

  // Start live polling
  const startLiveMode = () => {
    if (!processId || isLiveMode) return;
    
    setIsLiveMode(true);
    
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    cleanupRef.current = QueueMonitoringService.startLivePolling(
      processId,
      (data) => {
        queryClient.setQueryData(queueMonitoringKeys.queueLive(processId), data);
        setLastUpdate(new Date());
      },
      30000
    );
  };

  // Stop live polling
  const stopLiveMode = () => {
    setIsLiveMode(false);
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    ...query,
    lastUpdate,
    isLiveMode,
    startLiveMode,
    stopLiveMode,
  };
};

// Hook for countdown timer management
export const useCountdownTimers = (executions: UpcomingExecution[] = []) => {
  const [timers, setTimers] = useState<UpcomingExecution[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const executionsRef = useRef<UpcomingExecution[]>([]);

  // Only update if executions actually changed
  useEffect(() => {
    const executionsChanged = executions.length !== executionsRef.current.length ||
      executions.some((exec, index) => 
        !executionsRef.current[index] || 
        exec.wallet !== executionsRef.current[index].wallet ||
        exec.timeUntilMs !== executionsRef.current[index].timeUntilMs
      );
    
    if (executionsChanged) {
      executionsRef.current = executions;
      setTimers(executions);
    }
  }, [executions]);

  useEffect(() => {
    if (timers.length > 0 && timers.some(t => t.timeUntilMs && t.timeUntilMs > 0)) {
      intervalRef.current = setInterval(() => {
        setTimers(current => QueueMonitoringService.updateCountdownTimers(current));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timers]);

  return timers;
};

// Hook for dashboard auto-refresh
export const useDashboardAutoRefresh = (
  processId: string,
  enabled: boolean = true,
  intervalMs: number = 30000
) => {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(enabled);
  const [refreshCount, setRefreshCount] = useState(0);
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: queueMonitoringKeys.queueLive(processId) });
    queryClient.invalidateQueries({ queryKey: queueMonitoringKeys.queue(processId) });
    queryClient.invalidateQueries({ queryKey: queueMonitoringKeys.health() });
    setRefreshCount(prev => prev + 1);
  };

  const startAutoRefresh = () => {
    setIsAutoRefreshing(true);
  };

  const stopAutoRefresh = () => {
    setIsAutoRefreshing(false);
  };

  useEffect(() => {
    if (!isAutoRefreshing || !processId) return;

    const interval = setInterval(refreshAll, intervalMs);
    return () => clearInterval(interval);
  }, [isAutoRefreshing, processId, intervalMs, queryClient]);

  return {
    isAutoRefreshing,
    refreshCount,
    refreshAll,
    startAutoRefresh,
    stopAutoRefresh,
  };
};

// Hook for alert management
export const useAlertManager = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const clearDismissedAlerts = () => {
    setDismissedAlerts(new Set());
  };

  const filterAlerts = (alerts: any[]) => {
    return alerts.filter(alert => {
      const alertId = `${alert.level}-${alert.message}`;
      return !dismissedAlerts.has(alertId);
    });
  };

  return {
    dismissedAlerts,
    dismissAlert,
    clearDismissedAlerts,
    filterAlerts,
  };
};

// Hook for process selection
export const useProcessSelection = (initialProcessId?: string) => {
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(initialProcessId || null);
  const { data: processes } = useProcessesQuick();

  // Auto-select first active process if none selected
  useEffect(() => {
    if (!selectedProcessId && processes && processes.length > 0) {
      const activeProcess = processes.find(p => p.isActive) || processes[0];
      setSelectedProcessId(activeProcess.id);
    }
  }, [processes, selectedProcessId]);

  const selectProcess = (processId: string) => {
    setSelectedProcessId(processId);
    // Remember selection in localStorage
    localStorage.setItem('selectedProcessId', processId);
  };

  // Load saved selection on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedProcessId');
    if (saved && !initialProcessId) {
      setSelectedProcessId(saved);
    }
  }, [initialProcessId]);

  return {
    selectedProcessId,
    selectProcess,
    processes: processes || [],
  };
};
