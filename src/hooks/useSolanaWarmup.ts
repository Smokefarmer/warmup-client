import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { SolanaWarmupService, SolanaWarmupConfiguration } from '../services/solanaWarmupService';
import { MultiChainService } from '../services/multiChainService';
import { ChainId, WalletType } from '../types/wallet';
import { IWarmupProcess, IWarmupStatistics } from '../types/warmup';

export interface UseSolanaWarmupOptions {
  onProgress?: (stats: any) => void;
  onComplete?: (finalStats: any) => void;
  onError?: (error: any) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useSolanaWarmup = (options: UseSolanaWarmupOptions = {}) => {
  const queryClient = useQueryClient();
  const {
    onProgress,
    onComplete,
    onError,
    autoRefresh = true,
    refreshInterval = 5000
  } = options;

  // State management
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringCleanupRef = useRef<(() => void) | null>(null);

  // Create Solana warmup process mutation
  const createProcessMutation = useMutation({
    mutationFn: async ({
      walletIds,
      name,
      customConfig
    }: {
      walletIds: string[];
      name?: string;
      customConfig?: Partial<SolanaWarmupConfiguration>;
    }) => {
      return await SolanaWarmupService.createSolanaWarmupProcess(
        walletIds,
        name,
        customConfig
      );
    },
    onSuccess: (process) => {
      setCurrentProcessId(process._id);
      toast.success(`Solana warmup process created: ${process.name}`);
      queryClient.invalidateQueries({ queryKey: ['solana-warmup-processes'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create warmup process';
      toast.error(`Failed to create warmup process: ${message}`);
      if (onError) onError(error);
    }
  });

  // Start warmup process mutation
  const startProcessMutation = useMutation({
    mutationFn: async (processId: string) => {
      return await SolanaWarmupService.startSolanaWarmupProcess(processId);
    },
    onSuccess: (process) => {
      toast.success('Solana warmup process started!');
      setCurrentProcessId(process._id);
      queryClient.invalidateQueries({ queryKey: ['solana-warmup-processes'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to start warmup process';
      toast.error(`Failed to start warmup process: ${message}`);
      if (onError) onError(error);
    }
  });

  // Stop warmup process mutation
  const stopProcessMutation = useMutation({
    mutationFn: async (processId: string) => {
      return await SolanaWarmupService.stopSolanaWarmupProcess(processId);
    },
    onSuccess: (process) => {
      toast.success('Solana warmup process stopped!');
      queryClient.invalidateQueries({ queryKey: ['solana-warmup-processes'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to stop warmup process';
      toast.error(`Failed to stop warmup process: ${message}`);
      if (onError) onError(error);
    }
  });



  // Generate Solana wallets mutation
  const generateWalletsMutation = useMutation({
    mutationFn: async ({
      count,
      chainId,
      typeDistribution
    }: {
      count: number;
      chainId?: ChainId;
      typeDistribution?: {
        trendTrader?: number;
        majorTrader?: number;
        holder?: number;
        trencher?: number;
      };
    }) => {
      return await MultiChainService.generateSolanaWalletsBatch(
        count,
        chainId || ChainId.SOLANA_DEVNET,
        typeDistribution
      );
    },
    onSuccess: (wallets) => {
      toast.success(`${wallets.length} Solana wallets generated successfully!`);
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to generate wallets';
      toast.error(`Failed to generate wallets: ${message}`);
      if (onError) onError(error);
    }
  });

  // Get process statistics query
  const processStatsQuery = useQuery({
    queryKey: ['solana-warmup-stats', currentProcessId],
    queryFn: () => currentProcessId ? SolanaWarmupService.getSolanaProcessStats(currentProcessId) : null,
    enabled: !!currentProcessId && autoRefresh,
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: true
  });

  // Get transaction logs query
  const transactionLogsQuery = useQuery({
    queryKey: ['solana-warmup-transactions', currentProcessId],
    queryFn: () => currentProcessId ? SolanaWarmupService.getSolanaTransactionLogs(currentProcessId) : [],
    enabled: !!currentProcessId,
    refetchInterval: autoRefresh ? refreshInterval : false
  });

  // Get all Solana warmup processes query
  const processesQuery = useQuery({
    queryKey: ['solana-warmup-processes'],
    queryFn: () => SolanaWarmupService.getSolanaProcessStats('all'), // This would need to be adjusted based on your API
    refetchInterval: autoRefresh ? refreshInterval * 2 : false
  });

  // Start monitoring a process
  const startMonitoring = useCallback(async (processId: string) => {
    if (isMonitoring) {
      stopMonitoring();
    }

    setIsMonitoring(true);
    setCurrentProcessId(processId);

    try {
      const cleanup = await SolanaWarmupService.monitorSolanaProcess(
        processId,
        (stats) => {
          if (onProgress) onProgress(stats);
          queryClient.setQueryData(['solana-warmup-stats', processId], stats);
        },
        (finalStats) => {
          setIsMonitoring(false);
          if (onComplete) onComplete(finalStats);
          queryClient.setQueryData(['solana-warmup-stats', processId], finalStats);
          toast.success('Solana warmup process completed!');
        },
        (error) => {
          if (onError) onError(error);
          toast.error('Monitoring error occurred');
        },
        refreshInterval
      );

      monitoringCleanupRef.current = cleanup;
    } catch (error) {
      setIsMonitoring(false);
      if (onError) onError(error);
    }
  }, [isMonitoring, onProgress, onComplete, onError, refreshInterval, queryClient]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (monitoringCleanupRef.current) {
      monitoringCleanupRef.current();
      monitoringCleanupRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Complete workflow: generate wallets, create process, and start
  const setupAndStartWarmup = useCallback(async ({
    walletCount = 5,
    customConfig,
    processName = "Solana Multi-Strategy Warmup",
    chainId = ChainId.SOLANA_DEVNET,
    typeDistribution = {
      trendTrader: 2,
      majorTrader: 1,
      holder: 1,
      trencher: 1
    }
  }: {
    walletCount?: number;
    customConfig?: Partial<SolanaWarmupConfiguration>;
    processName?: string;
    chainId?: ChainId;
    typeDistribution?: {
      trendTrader?: number;
      majorTrader?: number;
      holder?: number;
      trencher?: number;
    };
  }) => {
    try {
      // Step 1: Generate wallets
      const wallets = await generateWalletsMutation.mutateAsync({
        count: walletCount,
        chainId,
        typeDistribution
      });

      // Step 2: Extract wallet IDs
      const walletIds = wallets.map(wallet => wallet._id);

      // Step 3: Validate wallets
      const validation = await SolanaWarmupService.validateSolanaWallets(walletIds);
      if (!validation.valid) {
        throw new Error(`Wallet validation failed: ${validation.errors.join(', ')}`);
      }

      // Step 4: Create process
      const process = await createProcessMutation.mutateAsync({
        walletIds: validation.validWallets,
        name: processName,
        customConfig
      });

      // Step 5: Start process
      await startProcessMutation.mutateAsync(process._id);

      // Step 6: Start monitoring
      await startMonitoring(process._id);

      return {
        success: true,
        processId: process._id,
        wallets
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Workflow failed';
      toast.error(`Workflow failed: ${message}`);
      throw error;
    }
  }, [generateWalletsMutation, createProcessMutation, startProcessMutation, startMonitoring]);

  // Get comprehensive stats
  const getComprehensiveStats = useCallback(async (processId: string) => {
    try {
      const processStats = await SolanaWarmupService.getSolanaProcessStats(processId);
      const transactionLogs = await SolanaWarmupService.getSolanaTransactionLogs(processId, { limit: 100 });
      const overallStats = await SolanaWarmupService.getSolanaOverallStats();

      return {
        process: processStats,
        transactions: transactionLogs,
        overall: overallStats,
        summary: {
          totalWallets: processStats.totalWallets,
          completedWallets: processStats.completedWallets,
          successRate: processStats.successRate,
          totalSOLVolume: processStats.solanaSpecific?.totalSOLVolume || '0',
          averageTransactionTime: processStats.solanaSpecific?.averageTransactionTime || 0,
          totalTransactions: processStats.totalTransactions
        }
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to get comprehensive stats';
      toast.error(`Failed to get comprehensive stats: ${message}`);
      throw error;
    }
  }, []);

  return {
    // State
    currentProcessId,
    isMonitoring,
    isCreating: createProcessMutation.isPending,
    isStarting: startProcessMutation.isPending,
    isStopping: stopProcessMutation.isPending,
    isGeneratingWallets: generateWalletsMutation.isPending,

    // Data
    processStats: processStatsQuery.data,
    transactionLogs: transactionLogsQuery.data,
    processes: processesQuery.data,
    isLoading: processStatsQuery.isLoading || transactionLogsQuery.isLoading,
    error: processStatsQuery.error || transactionLogsQuery.error,

    // Actions
    createProcess: createProcessMutation.mutate,
    startProcess: startProcessMutation.mutate,
    stopProcess: stopProcessMutation.mutate,
    generateWallets: generateWalletsMutation.mutate,
    setupAndStartWarmup,
    startMonitoring,
    stopMonitoring,
    getComprehensiveStats,

    // Mutations (for direct access)
    createProcessMutation,
    startProcessMutation,
    stopProcessMutation,
    generateWalletsMutation
  };
};
