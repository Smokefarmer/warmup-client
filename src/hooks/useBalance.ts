import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BalanceService, UpdateTotalFundedRequest } from '../services/balanceService';
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
