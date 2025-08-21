import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FundingService } from '../services/fundingService';
import { walletKeys } from './useWallets';
import { 
  IFunder, 
  IFundingTransaction, 
  FundWalletsDto, 
  FundingStatistics,
  FunderStatus,
  SingleWalletFundingDto,
  BatchFundingDto,
  RandomBatchFundingDto,
  FundingResult,
  Transaction,
  FundingWallet,
  SingleChainFunderInfo,
  MultiChainFunderInfo
} from '../types/funding';

// Query keys
export const fundingKeys = {
  all: ['funding'] as const,
  funder: () => [...fundingKeys.all, 'funder'] as const,
  funderStatus: () => [...fundingKeys.all, 'funder-status'] as const,
  funderBalance: () => [...fundingKeys.all, 'funder-balance'] as const,
  funderBalanceForChain: (chainId: number) => [...fundingKeys.all, 'funder-balance', chainId] as const,
  funderInfoAll: () => [...fundingKeys.all, 'funder-info-all'] as const,
  history: () => [...fundingKeys.all, 'history'] as const,
  historyList: (limit?: number, offset?: number) => [...fundingKeys.history(), { limit, offset }] as const,
  transaction: (id: string) => [...fundingKeys.all, 'transaction', id] as const,
  statistics: () => [...fundingKeys.all, 'statistics'] as const,
  walletBalance: (id: string) => [...fundingKeys.all, 'wallet-balance', id] as const,
};

// Get funder information
export const useFunder = () => {
  return useQuery({
    queryKey: fundingKeys.funder(),
    queryFn: () => FundingService.getFunder(),
    staleTime: 60000, // 1 minute
  });
};

// Get enhanced funder status for dashboard
export const useFunderStatus = () => {
  return useQuery({
    queryKey: fundingKeys.funderStatus(),
    queryFn: () => FundingService.getFunderStatus(),
    refetchInterval: 30000, // 30 seconds
    staleTime: 30000,
  });
};

// Get funder balance
export const useFunderBalance = () => {
  return useQuery({
    queryKey: fundingKeys.funderBalance(),
    queryFn: () => FundingService.getFunderBalance(),
    refetchInterval: 30000, // 30 seconds
    staleTime: 30000,
  });
};

// Get funder balance for specific chain
export const useFunderBalanceForChain = (chainId: number) => {
  return useQuery({
    queryKey: fundingKeys.funderBalanceForChain(chainId),
    queryFn: () => FundingService.getFunderBalanceForChain(chainId),
    refetchInterval: 30000, // 30 seconds
    staleTime: 30000,
  });
};

// Get funder information for all supported chains
export const useFunderInfoAll = () => {
  return useQuery({
    queryKey: fundingKeys.funderInfoAll(),
    queryFn: () => FundingService.getFunderInfoAll(),
    refetchInterval: 30000, // 30 seconds
    staleTime: 30000,
  });
};

// Get funding history
export const useFundingHistory = (limit?: number, offset?: number) => {
  return useQuery({
    queryKey: fundingKeys.historyList(limit, offset),
    queryFn: () => FundingService.getFundingHistory(limit, offset),
    staleTime: 30000, // 30 seconds
  });
};

// Get specific funding transaction
export const useFundingTransaction = (id: string) => {
  return useQuery({
    queryKey: fundingKeys.transaction(id),
    queryFn: () => FundingService.getFundingTransaction(id),
    enabled: !!id,
    staleTime: 30000,
  });
};

// Get funding statistics
export const useFundingStatistics = () => {
  return useQuery({
    queryKey: fundingKeys.statistics(),
    queryFn: () => FundingService.getFundingStatistics(),
    staleTime: 60000, // 1 minute
  });
};

// Get wallet balance
export const useWalletBalance = (walletId: string) => {
  return useQuery({
    queryKey: fundingKeys.walletBalance(walletId),
    queryFn: () => FundingService.getWalletBalance(walletId),
    enabled: !!walletId,
    staleTime: 30000,
  });
};

// Check transaction status
export const useTransactionStatus = (txHash: string) => {
  return useQuery({
    queryKey: [...fundingKeys.all, 'tx-status', txHash],
    queryFn: () => FundingService.checkTransactionStatus(txHash),
    enabled: !!txHash,
    refetchInterval: (data) => (data as any)?.status === 'pending' ? 10000 : false, // 10 seconds for pending
    staleTime: 5000,
  });
};

// Fund wallets (legacy)
export const useFundWallets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (funding: FundWalletsDto) => FundingService.fundWallets(funding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundingKeys.funder() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.funderStatus() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.history() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.statistics() });
    },
  });
};

// Single wallet funding
export const useFundWallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: SingleWalletFundingDto) => FundingService.fundWallet(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: fundingKeys.funder() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.funderStatus() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.history() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.walletBalance(variables.walletId) });
      // Invalidate wallet lists to refresh balances
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'available'] });
    },
  });
};

// Batch funding (same amount)
export const useFundWalletsBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: BatchFundingDto) => FundingService.fundWalletsBatch(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: fundingKeys.funder() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.funderStatus() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.history() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.statistics() });
      // Invalidate wallet balances for all funded wallets
      variables.walletIds.forEach(walletId => {
        queryClient.invalidateQueries({ queryKey: fundingKeys.walletBalance(walletId) });
      });
      // Invalidate wallet lists to refresh balances
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'available'] });
    },
  });
};

// Random batch funding
export const useFundWalletsRandom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: RandomBatchFundingDto) => FundingService.fundWalletsRandom(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: fundingKeys.funder() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.funderStatus() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.history() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.statistics() });
      // Invalidate wallet balances for all funded wallets
      variables.walletIds.forEach(walletId => {
        queryClient.invalidateQueries({ queryKey: fundingKeys.walletBalance(walletId) });
      });
      // Invalidate wallet lists to refresh balances
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'available'] });
    },
  });
};

// Check funding status
export const useCheckFundingStatus = (walletAddresses: string[]) => {
  return useQuery({
    queryKey: [...fundingKeys.all, 'check', walletAddresses],
    queryFn: () => FundingService.checkFundingStatus(walletAddresses),
    enabled: walletAddresses.length > 0,
    staleTime: 30000,
  });
};
