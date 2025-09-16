import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BalanceService, UpdateTotalFundedRequest, BulkUpdateBalancesRequest } from '../services/balanceService';
import { walletKeys } from './useWallets';

// Query keys for balance operations
export const balanceKeys = {
  all: ['balance'] as const,
  summary: () => [...balanceKeys.all, 'summary'] as const,
  totalFunded: () => [...balanceKeys.all, 'totalFunded'] as const,
};

// Get balance summary
export const useBalanceSummary = () => {
  return useQuery({
    queryKey: balanceKeys.summary(),
    queryFn: () => BalanceService.getBalanceSummary(),
    staleTime: 60000, // 1 minute
  });
};

// Update totalFunded for single wallet
export const useUpdateTotalFundedForWallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ walletId, fromBlock }: { walletId: string; fromBlock?: number }) => 
      BalanceService.updateTotalFundedForWallet(walletId, fromBlock),
    onSuccess: (_, { walletId }) => {
      // Invalidate wallet data and balance summary
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(walletId) });
      queryClient.invalidateQueries({ queryKey: balanceKeys.summary() });
    },
  });
};

// Update totalFunded for multiple wallets
export const useUpdateTotalFundedForWallets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: UpdateTotalFundedRequest) => 
      BalanceService.updateTotalFundedForWallets(request),
    onSuccess: () => {
      // Invalidate all wallet data and balance summary
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.details() });
      queryClient.invalidateQueries({ queryKey: balanceKeys.summary() });
    },
  });
};

// Force update all wallet balances
export const useForceUpdateAllBalances = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => BalanceService.forceUpdateAllBalances(),
    onSuccess: () => {
      // Invalidate all wallet data and balance summary to refresh the UI
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.details() });
      queryClient.invalidateQueries({ queryKey: balanceKeys.summary() });
    },
  });
};

// Bulk update balances for selected wallets with rate limiting
export const useBulkUpdateBalances = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: BulkUpdateBalancesRequest) => 
      BalanceService.bulkUpdateBalances(request),
    onSuccess: () => {
      // Invalidate all wallet data and balance summary to refresh the UI
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.details() });
      queryClient.invalidateQueries({ queryKey: balanceKeys.summary() });
    },
  });
};
