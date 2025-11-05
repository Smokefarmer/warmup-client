import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { WalletService } from '../services/walletService';
import { WalletStatus, WalletType } from '../types/wallet';

// Query keys
export const walletKeys = {
  all: ['wallets'] as const,
  lists: () => [...walletKeys.all, 'list'] as const,
  list: (filters?: any) => [...walletKeys.lists(), filters] as const,
  archived: () => [...walletKeys.all, 'archived'] as const,
  details: () => [...walletKeys.all, 'detail'] as const,
  detail: (id: string) => [...walletKeys.details(), id] as const,
  statistics: () => [...walletKeys.all, 'statistics'] as const,
};

// Get all wallets
export const useWallets = () => {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: WalletService.getWallets,
    staleTime: 30000, // 30 seconds
  });
};

// Get available wallets (not in any process)
export const useAvailableWallets = () => {
  return useQuery({
    queryKey: ['wallets', 'available'],
    queryFn: () => WalletService.getAvailableWallets(),
    staleTime: 30000, // 30 seconds
  });
};

// Get archived wallets
export const useArchivedWallets = () => {
  return useQuery({
    queryKey: ['wallets', 'archived'],
    queryFn: WalletService.getArchivedWallets,
    staleTime: 30000, // 30 seconds
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

// Create wallet
export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: WalletService.createWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create wallet';
      toast.error(`Failed to create wallet: ${message}`);
    },
  });
};

// Create batch wallets
export const useCreateBatchWallets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: WalletService.createBatchWallets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Batch wallets created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create batch wallets';
      toast.error(`Failed to create batch wallets: ${message}`);
    },
  });
};

// Update wallet status
export const useUpdateWalletStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WalletStatus }) =>
      WalletService.updateWalletStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'archived'] });
      toast.success('Wallet status updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update wallet status';
      toast.error(`Failed to update wallet status: ${message}`);
    },
  });
};

// Update wallet type
export const useUpdateWalletType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: WalletType }) =>
      WalletService.updateWalletType(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'archived'] });
      toast.success('Wallet type updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update wallet type';
      toast.error(`Failed to update wallet type: ${message}`);
    },
  });
};

// Archive wallet
export const useArchiveWallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: WalletService.archiveWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'archived'] });
      toast.success('Wallet archived successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to archive wallet';
      toast.error(`Failed to archive wallet: ${message}`);
    },
  });
};

// Unarchive wallet
export const useUnarchiveWallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: WalletService.unarchiveWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'archived'] });
      toast.success('Wallet unarchived successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to unarchive wallet';
      toast.error(`Failed to unarchive wallet: ${message}`);
    },
  });
};

// Sell all tokens in wallet
export const useSellAllTokens = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: WalletService.sellAllTokens,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      if (data.success) {
        toast.success(`Sold ${data.totalTokensSold} tokens, recovered ${data.totalSolRecovered} SOL`);
      } else {
        toast.error(`Failed to sell tokens: ${data.error}`);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to sell tokens';
      toast.error(`Failed to sell tokens: ${message}`);
    },
  });
};

// Send SOL back to funder
export const useSendBackToFunder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ walletId, funderAddress, amount }: { walletId: string; funderAddress: string; amount?: string }) =>
      WalletService.sendBackToFunder(walletId, funderAddress, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      if (data.success) {
        toast.success(`Successfully sent ${data.amountSent} SOL back to funder`);
      } else {
        toast.error(`Failed to send back to funder: ${data.error}`);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to send back to funder';
      toast.error(`Failed to send back to funder: ${message}`);
    },
  });
};

// Send to funder via CEX (wallet -> CEX -> funder)
export const useSendToFunderViaCex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ walletId, funderAddress, amount }: { walletId: string; funderAddress: string; amount?: string }) =>
      WalletService.sendToFunderViaCex(walletId, funderAddress, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      if (data.success) {
        toast.success(`Successfully sent ${data.amountSent} SOL to funder via ${data.cex}`);
      } else {
        toast.error(`Failed to send to funder via CEX: ${data.error}`);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to send to funder via CEX';
      toast.error(`Failed to send to funder via CEX: ${message}`);
    },
  });
};

// ============ TOKEN MANAGEMENT HOOKS ============

// Get wallets with token information
export const useWalletsWithTokenInfo = (type?: string) => {
  return useQuery({
    queryKey: ['wallets-with-token-info', type],
    queryFn: () => WalletService.getWalletsWithTokenInfo(type),
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry if endpoint doesn't exist yet
  });
};

// Get single wallet with token information
export const useWalletWithTokenInfo = (walletId: string) => {
  return useQuery({
    queryKey: ['wallet-with-token-info', walletId],
    queryFn: () => WalletService.getWalletWithTokenInfo(walletId),
    enabled: !!walletId,
    staleTime: 30000,
  });
};

// Get wallet token limits
export const useWalletTokenLimits = (walletId: string) => {
  return useQuery({
    queryKey: ['wallet-token-limits', walletId],
    queryFn: () => WalletService.getWalletTokenLimits(walletId),
    enabled: !!walletId,
    staleTime: 30000,
  });
};

// Get wallet token holdings
export const useWalletTokenHoldings = (walletId: string) => {
  return useQuery({
    queryKey: ['wallet-token-holdings', walletId],
    queryFn: () => WalletService.getWalletTokenHoldings(walletId),
    enabled: !!walletId,
    staleTime: 30000,
  });
};

// Get bulk token holdings
export const useBulkTokenHoldings = (params?: {
  limit?: number;
  offset?: number;
  includeEmpty?: boolean;
}) => {
  return useQuery({
    queryKey: ['bulk-token-holdings', params],
    queryFn: () => WalletService.getBulkTokenHoldings(params),
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute
  });
};


// Get system token limits
export const useSystemTokenLimits = () => {
  return useQuery({
    queryKey: ['system-token-limits'],
    queryFn: () => WalletService.getSystemTokenLimits(),
    staleTime: 60000, // 1 minute
    retry: false, // Don't retry if endpoint doesn't exist yet
    enabled: true, // Keep enabled but handle errors gracefully
  });
};

// Get token conflict statistics by type
export const useTokenConflictStats = (walletType: string) => {
  return useQuery({
    queryKey: ['token-conflict-stats', walletType],
    queryFn: () => WalletService.getTokenConflictStats(walletType),
    enabled: !!walletType,
    staleTime: 60000,
  });
};

// Refresh wallet token count
export const useRefreshTokenCount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (walletId: string) => WalletService.refreshTokenCount(walletId),
    onSuccess: (data, walletId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets-with-token-info'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-with-token-info', walletId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-token-limits', walletId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-token-holdings', walletId] });
      queryClient.invalidateQueries({ queryKey: ['token-statistics'] });
      
      if (data.refreshed) {
        toast.success(`Token count updated: ${data.update.previousCount} → ${data.update.newCount}`);
      } else {
        toast.success('Token count is up to date');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to refresh token count';
      toast.error(`Failed to refresh token count: ${message}`);
    },
  });
};

// ============ WALLET TAG HOOKS ============

// Update wallet tag
export const useUpdateWalletTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ walletId, tag }: { walletId: string; tag: string }) => 
      WalletService.updateWalletTag(walletId, tag),
    onSuccess: (data, { tag }) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets-with-token-info'] });
      queryClient.invalidateQueries({ queryKey: ['archived-wallets'] });
      toast.success(`Tag updated: "${tag}"`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update tag';
      toast.error(`Failed to update tag: ${message}`);
    },
  });
};

// Remove wallet tag
export const useRemoveWalletTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (walletId: string) => WalletService.removeWalletTag(walletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets-with-token-info'] });
      queryClient.invalidateQueries({ queryKey: ['archived-wallets'] });
      toast.success('Tag removed');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to remove tag';
      toast.error(`Failed to remove tag: ${message}`);
    },
  });
};
