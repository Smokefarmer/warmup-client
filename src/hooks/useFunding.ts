import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FundingService } from '../services/fundingService';
import { 
  IFunder, 
  IFundingTransaction, 
  FundWalletsDto, 
  FundingStatistics 
} from '../types/funding';

// Query keys
export const fundingKeys = {
  all: ['funding'] as const,
  funder: () => [...fundingKeys.all, 'funder'] as const,
  history: () => [...fundingKeys.all, 'history'] as const,
  historyList: (limit?: number, offset?: number) => [...fundingKeys.history(), { limit, offset }] as const,
  transaction: (id: string) => [...fundingKeys.all, 'transaction', id] as const,
  statistics: () => [...fundingKeys.all, 'statistics'] as const,
};

// Get funder information
export const useFunder = () => {
  return useQuery({
    queryKey: fundingKeys.funder(),
    queryFn: () => FundingService.getFunder(),
    staleTime: 60000, // 1 minute
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

// Fund wallets
export const useFundWallets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (funding: FundWalletsDto) => FundingService.fundWallets(funding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundingKeys.funder() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.history() });
      queryClient.invalidateQueries({ queryKey: fundingKeys.statistics() });
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
