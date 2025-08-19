import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletService } from '../services/walletService';
import { 
  IWarmUpWallet, 
  CreateWalletDto, 
  CreateBatchWalletsDto, 
  WalletFilters,
  WalletType,
  WalletStatus 
} from '../types/wallet';

// Query keys
export const walletKeys = {
  all: ['wallets'] as const,
  lists: () => [...walletKeys.all, 'list'] as const,
  list: (filters: WalletFilters) => [...walletKeys.lists(), filters] as const,
  available: () => [...walletKeys.all, 'available'] as const,
  details: () => [...walletKeys.all, 'detail'] as const,
  detail: (id: string) => [...walletKeys.details(), id] as const,
  statistics: () => [...walletKeys.all, 'statistics'] as const,
};

// Get all wallets
export const useWallets = (filters?: WalletFilters) => {
  return useQuery({
    queryKey: walletKeys.list(filters || {}),
    queryFn: () => WalletService.getWallets(filters),
    staleTime: 30000, // 30 seconds
  });
};

// Get available wallets
export const useAvailableWallets = () => {
  return useQuery({
    queryKey: walletKeys.available(),
    queryFn: () => WalletService.getAvailableWallets(),
    staleTime: 30000,
  });
};

// Get specific wallet
export const useWallet = (id: string) => {
  return useQuery({
    queryKey: walletKeys.detail(id),
    queryFn: () => WalletService.getWallet(id),
    enabled: !!id,
    staleTime: 30000,
  });
};

// Get wallet statistics
export const useWalletStatistics = () => {
  return useQuery({
    queryKey: walletKeys.statistics(),
    queryFn: () => WalletService.getWalletStatistics(),
    staleTime: 60000, // 1 minute
  });
};

// Create single wallet
export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (wallet: CreateWalletDto) => WalletService.createWallet(wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.available() });
      queryClient.invalidateQueries({ queryKey: walletKeys.statistics() });
    },
  });
};

// Create batch wallets
export const useCreateBatchWallets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (batch: CreateBatchWalletsDto) => WalletService.createBatchWallets(batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.available() });
      queryClient.invalidateQueries({ queryKey: walletKeys.statistics() });
    },
  });
};

// Update wallet status
export const useUpdateWalletStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WalletStatus }) => 
      WalletService.updateWalletStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: walletKeys.available() });
    },
  });
};

// Update wallet type
export const useUpdateWalletType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: WalletType }) => 
      WalletService.updateWalletType(id, type),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(id) });
    },
  });
};

// Delete wallet
export const useDeleteWallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => WalletService.deleteWallet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: walletKeys.available() });
      queryClient.invalidateQueries({ queryKey: walletKeys.statistics() });
    },
  });
};
