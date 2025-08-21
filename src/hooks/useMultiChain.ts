import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChainId, 
  CreateMultiChainWalletDto, 
  IWarmUpWallet,
  WalletType 
} from '../types/wallet';
import { 
  MultiChainService, 
  WalletBalance, 
  TransactionStatus, 
  MultiChainProcess 
} from '../services/multiChainService';
import { toast } from 'react-hot-toast';

export const useMultiChain = () => {
  const queryClient = useQueryClient();
  const [selectedChain, setSelectedChain] = useState<ChainId>(ChainId.BASE);

  // Get supported chains from backend (with fallback to local config)
  const { data: supportedChains } = useQuery({
    queryKey: ['supportedChains'],
    queryFn: async () => {
      try {
        return await MultiChainService.getSupportedChainsFromBackend();
      } catch (error) {
        console.warn('Falling back to local chain config');
        return MultiChainService.getSupportedChains();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get enabled chains from backend (with fallback to local config)
  const { data: enabledChains } = useQuery({
    queryKey: ['enabledChains'],
    queryFn: async () => {
      try {
        return await MultiChainService.getEnabledChains();
      } catch (error) {
        console.warn('Falling back to local chain config');
        return MultiChainService.getSupportedChains();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get wallets by chain
  const { data: walletsByChain, isLoading: walletsLoading } = useQuery({
    queryKey: ['walletsByChain', selectedChain],
    queryFn: () => MultiChainService.getWalletsByChain(selectedChain),
    enabled: !!selectedChain,
    retry: 2,
    retryDelay: 1000,
  });

  // Get available wallets
  const { data: availableWallets, isLoading: availableWalletsLoading } = useQuery({
    queryKey: ['availableWallets'],
    queryFn: () => MultiChainService.getAvailableWallets(),
    retry: 2,
    retryDelay: 1000,
  });

  // Get multi-chain processes
  const { data: multiChainProcesses, isLoading: processesLoading } = useQuery({
    queryKey: ['multiChainProcesses'],
    queryFn: () => MultiChainService.getMultiChainProcesses(),
    refetchInterval: 10000, // Refetch every 10 seconds
    retry: 2,
    retryDelay: 1000,
  });

  // Get multi-chain statistics
  const { data: multiChainStats } = useQuery({
    queryKey: ['multiChainStats'],
    queryFn: () => MultiChainService.getMultiChainStatistics(),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2,
    retryDelay: 1000,
  });

  // Create multi-chain wallet mutation
  const createWalletMutation = useMutation({
    mutationFn: (walletData: CreateMultiChainWalletDto) => 
      MultiChainService.createWallet(walletData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletsByChain'] });
      queryClient.invalidateQueries({ queryKey: ['availableWallets'] });
      toast.success('Multi-chain wallet created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create wallet';
      toast.error(`Failed to create wallet: ${message}`);
    },
  });

  // Create multiple multi-chain wallets mutation
  const createBatchWalletsMutation = useMutation({
    mutationFn: (wallets: CreateMultiChainWalletDto[]) => 
      MultiChainService.createMultiChainWallets(wallets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletsByChain'] });
      queryClient.invalidateQueries({ queryKey: ['availableWallets'] });
      toast.success('Multi-chain wallets created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create wallets';
      toast.error(`Failed to create wallets: ${message}`);
    },
  });

  // Create multi-chain process mutation
  const createProcessMutation = useMutation({
    mutationFn: ({ name, walletIds }: { name: string; walletIds: string[] }) => 
      MultiChainService.createMultiChainProcess(name, walletIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multiChainProcesses'] });
      toast.success('Multi-chain process created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create process';
      toast.error(`Failed to create process: ${message}`);
    },
  });

  // Start multi-chain process mutation
  const startProcessMutation = useMutation({
    mutationFn: (processId: string) => MultiChainService.startMultiChainProcess(processId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multiChainProcesses'] });
      toast.success('Multi-chain process started successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to start process';
      toast.error(`Failed to start process: ${message}`);
    },
  });

  // Stop multi-chain process mutation
  const stopProcessMutation = useMutation({
    mutationFn: (processId: string) => MultiChainService.stopMultiChainProcess(processId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multiChainProcesses'] });
      toast.success('Multi-chain process stopped successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to stop process';
      toast.error(`Failed to stop process: ${message}`);
    },
  });

  // Get wallet balance
  const getWalletBalance = useCallback(async (chainId: ChainId, publicKey: string): Promise<WalletBalance> => {
    try {
      return await MultiChainService.getWalletBalance(chainId, publicKey);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to get wallet balance';
      toast.error(`Failed to get wallet balance: ${message}`);
      throw error;
    }
  }, []);

  // Get transaction status
  const getTransactionStatus = useCallback(async (chainId: ChainId, txHash: string): Promise<TransactionStatus> => {
    try {
      return await MultiChainService.getTransactionStatus(chainId, txHash);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to get transaction status';
      toast.error(`Failed to get transaction status: ${message}`);
      throw error;
    }
  }, []);

  // Get multi-chain balances
  const getMultiChainBalances = useCallback(async (wallets: { chainId: ChainId; publicKey: string }[]): Promise<WalletBalance[]> => {
    try {
      return await MultiChainService.getMultiChainBalances(wallets);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to get multi-chain balances';
      toast.error(`Failed to get multi-chain balances: ${message}`);
      throw error;
    }
  }, []);

  // Get multi-chain transaction statuses
  const getMultiChainTransactionStatuses = useCallback(async (transactions: { chainId: ChainId; txHash: string }[]): Promise<TransactionStatus[]> => {
    try {
      return await MultiChainService.getMultiChainTransactionStatuses(transactions);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to get multi-chain transaction statuses';
      toast.error(`Failed to get multi-chain transaction statuses: ${message}`);
      throw error;
    }
  }, []);

  // Create Base wallet helper
  const createBaseWallet = useCallback((publicKey: string, type: WalletType = WalletType.TREND_TRADER) => {
    return createWalletMutation.mutate({
      publicKey,
      chainId: ChainId.BASE,
      type,
      chainSpecificData: {
        [ChainId.BASE]: {
          privateKey: '', // This should be provided by the user or generated
        }
      }
    });
  }, [createWalletMutation]);

  // Create Solana wallet helper
  const createSolanaWallet = useCallback((publicKey: string, type: WalletType = WalletType.TREND_TRADER) => {
    return createWalletMutation.mutate({
      publicKey,
      chainId: ChainId.SOLANA,
      type,
      chainSpecificData: {
        [ChainId.SOLANA]: {
          privateKey: '', // This should be provided by the user or generated
        }
      }
    });
  }, [createWalletMutation]);

  // Generate Solana wallet (backend generates keypair)
  const generateSolanaWallet = useCallback(async (type: string, chainId: ChainId = ChainId.SOLANA_DEVNET) => {
    try {
      return await MultiChainService.generateSolanaWallet(type, chainId);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to generate Solana wallet';
      toast.error(`Failed to generate Solana wallet: ${message}`);
      throw error;
    }
  }, []);

  // Generate multiple Solana wallets
  const generateSolanaWalletsBatch = useCallback(async (
    count: number,
    chainId: ChainId = ChainId.SOLANA_DEVNET,
    typeDistribution?: {
      trendTrader?: number;
      majorTrader?: number;
      holder?: number;
      trencher?: number;
    }
  ) => {
    try {
      return await MultiChainService.generateSolanaWalletsBatch(count, chainId, typeDistribution);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to generate Solana wallets';
      toast.error(`Failed to generate Solana wallets: ${message}`);
      throw error;
    }
  }, []);

  // Fund Solana wallet
  const fundSolanaWallet = useCallback(async (walletId: string, amount: string) => {
    try {
      return await MultiChainService.fundSolanaWallet(walletId, amount);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fund Solana wallet';
      toast.error(`Failed to fund Solana wallet: ${message}`);
      throw error;
    }
  }, []);

  // Fund multiple Solana wallets with same amount
  const fundSolanaWalletsBatch = useCallback(async (walletIds: string[], amount: string) => {
    try {
      return await MultiChainService.fundSolanaWalletsBatch(walletIds, amount);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fund Solana wallets';
      toast.error(`Failed to fund Solana wallets: ${message}`);
      throw error;
    }
  }, []);

  // Fund multiple Solana wallets with random amounts
  const fundSolanaWalletsRandom = useCallback(async (
    walletIds: string[],
    minAmount: string,
    maxAmount: string
  ) => {
    try {
      return await MultiChainService.fundSolanaWalletsRandom(walletIds, minAmount, maxAmount);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fund Solana wallets with random amounts';
      toast.error(`Failed to fund Solana wallets with random amounts: ${message}`);
      throw error;
    }
  }, []);

  // Create multi-chain process helper
  const createMultiChainProcess = useCallback((name: string, walletIds: string[]) => {
    return createProcessMutation.mutate({ name, walletIds });
  }, [createProcessMutation]);

  // Get Base balance helper
  const getBaseBalance = useCallback((publicKey: string) => {
    return getWalletBalance(ChainId.BASE, publicKey);
  }, [getWalletBalance]);

  // Get Solana balance helper
  const getSolanaBalance = useCallback((publicKey: string) => {
    return getWalletBalance(ChainId.SOLANA, publicKey);
  }, [getWalletBalance]);

  // Get Base transaction status helper
  const getBaseTransactionStatus = useCallback((txHash: string) => {
    return getTransactionStatus(ChainId.BASE, txHash);
  }, [getTransactionStatus]);

  // Get Solana transaction status helper
  const getSolanaTransactionStatus = useCallback((txHash: string) => {
    return getTransactionStatus(ChainId.SOLANA, txHash);
  }, [getTransactionStatus]);

  return {
    // State
    selectedChain,
    setSelectedChain,
    
    // Data
    supportedChains,
    enabledChains,
    walletsByChain,
    availableWallets,
    multiChainProcesses,
    multiChainStats,
    
    // Loading states
    walletsLoading,
    availableWalletsLoading,
    processesLoading,
    
    // Mutations
    createWalletMutation,
    createBatchWalletsMutation,
    createProcessMutation,
    startProcessMutation,
    stopProcessMutation,
    
    // Helper functions
    createBaseWallet,
    createSolanaWallet,
    generateSolanaWallet,
    generateSolanaWalletsBatch,
    fundSolanaWallet,
    fundSolanaWalletsBatch,
    fundSolanaWalletsRandom,
    createMultiChainProcess,
    getWalletBalance,
    getTransactionStatus,
    getMultiChainBalances,
    getMultiChainTransactionStatuses,
    getBaseBalance,
    getSolanaBalance,
    getBaseTransactionStatus,
    getSolanaTransactionStatus,
    
    // Utility functions
    getChainConfig: MultiChainService.getChainConfig,
    getChainName: MultiChainService.getChainName,
    isChainSupported: MultiChainService.isChainSupported,
    formatBalance: MultiChainService.formatBalance,
    validateAddress: MultiChainService.validateAddress,
    getExplorerUrl: MultiChainService.getExplorerUrl,
  };
};
