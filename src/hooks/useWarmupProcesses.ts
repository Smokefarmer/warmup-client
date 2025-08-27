import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WarmupService } from '../services/warmupService';
import { 
  IWarmupProcess, 
  IWarmupStatistics, 
  CreateWarmupProcessDto, 
  WarmupFilters 
} from '../types/warmup';

// Query keys
export const warmupKeys = {
  all: ['warmup'] as const,
  lists: () => [...warmupKeys.all, 'list'] as const,
  list: (filters: WarmupFilters) => [...warmupKeys.lists(), filters] as const,
  details: () => [...warmupKeys.all, 'detail'] as const,
  detail: (id: string) => [...warmupKeys.details(), id] as const,
  statistics: () => [...warmupKeys.all, 'statistics'] as const,
  processStatistics: (id: string) => [...warmupKeys.all, 'process-statistics', id] as const,
};

// Get all warmup processes
export const useWarmupProcesses = (filters?: WarmupFilters) => {
  return useQuery({
    queryKey: warmupKeys.list(filters || {}),
    queryFn: () => WarmupService.getWarmupProcesses(filters),
    staleTime: 30000, // 30 seconds
  });
};

// Get specific warmup process
export const useWarmupProcess = (id: string) => {
  return useQuery({
    queryKey: warmupKeys.detail(id),
    queryFn: () => WarmupService.getWarmupProcess(id),
    enabled: !!id,
    staleTime: 30000,
  });
};

// Get global warmup statistics
export const useGlobalWarmupStatistics = () => {
  return useQuery({
    queryKey: warmupKeys.statistics(),
    queryFn: () => WarmupService.getGlobalWarmupStatistics(),
    staleTime: 60000, // 1 minute
  });
};

// Get process-specific statistics
export const useWarmupProcessStatistics = (id: string) => {
  return useQuery({
    queryKey: warmupKeys.processStatistics(id),
    queryFn: () => WarmupService.getWarmupStatistics(id),
    enabled: !!id,
    staleTime: 30000,
  });
};

// Create warmup process
export const useCreateWarmupProcess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (process: CreateWarmupProcessDto) => WarmupService.createWarmupProcess(process),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warmupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warmupKeys.statistics() });
    },
  });
};

// Start warmup process
export const useStartWarmupProcess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => WarmupService.startWarmupProcess(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: warmupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warmupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: warmupKeys.processStatistics(id) });
      queryClient.invalidateQueries({ queryKey: warmupKeys.statistics() });
    },
  });
};

// Stop warmup process
export const useStopWarmupProcess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => WarmupService.stopWarmupProcess(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: warmupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warmupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: warmupKeys.processStatistics(id) });
      queryClient.invalidateQueries({ queryKey: warmupKeys.statistics() });
    },
  });
};



// Add wallets to process
export const useAddWalletsToProcess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, walletIds }: { id: string; walletIds: string[] }) => 
      WarmupService.addWalletsToProcess(id, walletIds),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: warmupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warmupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: warmupKeys.processStatistics(id) });
    },
  });
};

// Delete warmup process
export const useDeleteWarmupProcess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => WarmupService.deleteWarmupProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warmupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warmupKeys.statistics() });
    },
  });
};
