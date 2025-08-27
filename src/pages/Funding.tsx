import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FunderStatusCard } from '../components/FunderStatusCard';
import { MultiChainFunderStatusCard } from '../components/MultiChainFunderStatusCard';
import { WalletCard } from '../components/WalletCard';
import { FundingModal } from '../components/FundingModal';
import { TransactionHistory } from '../components/TransactionHistory';
import { QuickActions } from '../components/QuickActions';
import { 
  useFunderStatus, 
  useFundingHistory, 
  useFundWallet,
  useFundWalletsBatch,
  useFundWalletsRandom
} from '../hooks/useFunding';
import { useWallets, walletKeys } from '../hooks/useWallets';
import { useMultiChain } from '../hooks/useMultiChain';
import { IWallet, IWarmUpWallet, WalletStatus } from '../types/wallet';
import { getChainName } from '../config/chains';
import { 
  DollarSign, 
  Wallet, 
  Send, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  Network,
  ExternalLink
} from 'lucide-react';

export const Funding: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedChainId, setSelectedChainId] = useState<string>('');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    mode: 'single' | 'batch' | 'random';
    wallets: IWarmUpWallet[];
  }>({
    isOpen: false,
    mode: 'single',
    wallets: []
  });

  // Data hooks
  const { data: funderStatus, isLoading: funderLoading, refetch: refetchFunder } = useFunderStatus();
  const { data: fundingHistory, isLoading: historyLoading, refetch: refetchHistory } = useFundingHistory();
  
  // Multi-chain functionality
  const { 
    enabledChains,
    getChainName: getChainNameFromService,
    getExplorerUrl
  } = useMultiChain();

  // Use the same data source as Wallets page - get ALL wallets
  const { data: allWallets = [], isLoading: walletsLoading, error: walletsError } = useWallets();

  // Debug logging for funding history
  React.useEffect(() => {
    if (fundingHistory) {
      console.log('🔍 Funding History Data:', {
        type: typeof fundingHistory,
        isArray: Array.isArray(fundingHistory),
        keys: typeof fundingHistory === 'object' ? Object.keys(fundingHistory) : 'N/A',
        data: fundingHistory
      });
    }
  }, [fundingHistory]);

  // Mutation hooks
  const fundWalletMutation = useFundWallet();
  const fundBatchMutation = useFundWalletsBatch();
  const fundRandomMutation = useFundWalletsRandom();

  // Computed values - Use the same data source as Wallets page
  const wallets = allWallets;
  const isLoading = funderLoading || historyLoading || walletsLoading;

  // Debug: Log which wallet source is being used
  console.log('🔍 Wallet Source Debug:', {
    walletSource: 'useWallets (same as Wallets page)',
    walletsLength: wallets?.length || 0,
    firstWalletBalance: wallets?.[0]?.nativeTokenBalance || 'N/A',
    walletsLoading,
    isLoading,
    searchTerm,
    selectedChainId,
    walletsError
  });

  // Filter wallets based on search term, chain, and availability
  // For funding, show ALL active wallets regardless of warmup process status
  const filteredWallets = wallets?.filter((wallet: IWallet) => {
    // First filter by search term
    const matchesSearch = (wallet.publicKey || wallet.address).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Then filter by chain if selected
    const matchesChain = !selectedChainId || wallet.chainId === parseInt(selectedChainId);
    
    // For funding, only filter by status - show all active wallets
    // Handle both uppercase and lowercase status values from API
    const isAvailable = wallet.status === WalletStatus.ACTIVE || String(wallet.status).toLowerCase() === 'active';
    
    const result = matchesSearch && matchesChain && isAvailable;
    
    // Debug individual wallet filtering
    if (!result) {
      console.log('🔍 Wallet filtered out:', {
        address: wallet.publicKey || wallet.address,
        status: wallet.status,
        chainId: wallet.chainId,
        matchesSearch,
        matchesChain,
        isAvailable,
        searchTerm,
        selectedChainId
      });
    }
    
    return result;
  }) || [];

  // Debug logging for wallet data (moved after filteredWallets is defined)
  React.useEffect(() => {
    if (wallets && wallets.length > 0) {
      console.log('🔍 Wallet Data:', {
        count: wallets.length,
        firstWallet: wallets[0],
        balances: wallets.map((w: IWallet) => ({
          address: w.publicKey || w.address,
          balance: w.nativeTokenBalance,
          totalFunded: w.totalFunded,
          status: w.status,
          chainId: w.chainId,
          allKeys: Object.keys(w)
        })),
        filteredCount: filteredWallets.length
      });
    }
  }, [wallets, filteredWallets]);

  // Check if wallet is available for funding
  const isWalletAvailable = useCallback((wallet: IWallet) => {
    // For funding, a wallet is available if it's active (regardless of warmup process status)
    // Handle both uppercase and lowercase status values from API
    const isActive = wallet.status === WalletStatus.ACTIVE || String(wallet.status).toLowerCase() === 'active';
    
    // Debug: Log availability check for first few calls
    if (Math.random() < 0.1) { // Only log 10% of calls to avoid spam
      console.log('🔍 isWalletAvailable Debug:', {
        walletId: wallet._id,
        status: wallet.status,
        statusType: typeof wallet.status,
        isActive,
        walletStatusActive: WalletStatus.ACTIVE,
        statusLowercase: String(wallet.status).toLowerCase()
      });
    }
    
    return isActive;
  }, []);

  // Handle wallet selection
  const handleWalletSelection = useCallback((walletId: string) => {
    setSelectedWallets(prev => 
      prev.includes(walletId) 
        ? prev.filter(id => id !== walletId)
        : [...prev, walletId]
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (filteredWallets && filteredWallets.length > 0) {
      setSelectedWallets(filteredWallets.map((wallet: IWallet) => wallet._id));
    }
  }, [filteredWallets]);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedWallets([]);
  }, []);

  // Handle single wallet funding
  const handleFundSingle = useCallback(async (walletId: string, amount: string) => {
    try {
      return await fundWalletMutation.mutateAsync({
        walletId,
        amount
      });
    } catch (error: any) {
      toast.error(`Failed to fund wallet: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }, [fundWalletMutation]);

  // Handle batch funding
  const handleFundBatch = useCallback(async (walletIds: string[], amount: string) => {
    try {
      return await fundBatchMutation.mutateAsync({
        walletIds,
        amount
      });
    } catch (error: any) {
      toast.error(`Failed to fund wallets: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }, [fundBatchMutation]);

  // Handle random funding
  const handleFundRandom = useCallback(async (walletIds: string[], minAmount: string, maxAmount: string) => {
    try {
      return await fundRandomMutation.mutateAsync({
        walletIds,
        minAmount,
        maxAmount
      });
    } catch (error: any) {
      toast.error(`Failed to fund wallets with random amounts: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }, [fundRandomMutation]);

  // Handle funding success
  const handleFundingSuccess = useCallback((result: any) => {
    console.log('🔍 Funding Success - Raw Result:', result);
    console.log('🔍 Funding Success - Result Type:', typeof result);
    console.log('🔍 Funding Success - Result Keys:', result ? Object.keys(result) : 'No result');
    
    // Handle different response formats
    let transactionCount = 0;
    let totalAmount = '0';
    let success = false;
    
    if (result) {
      // Check if result has success property
      success = result.success || result.status === 'success';
      
      // Try different possible structures for transaction count
      if (result.transactions && Array.isArray(result.transactions)) {
        transactionCount = result.transactions.length;
        console.log('🔍 Found transactions array:', result.transactions);
      } else if (result.transactionCount !== undefined) {
        transactionCount = result.transactionCount;
        console.log('🔍 Found transactionCount:', result.transactionCount);
      } else if (result.count !== undefined) {
        transactionCount = result.count;
        console.log('🔍 Found count:', result.count);
      } else if (result.fundedWallets && Array.isArray(result.fundedWallets)) {
        transactionCount = result.fundedWallets.length;
        console.log('🔍 Found fundedWallets array:', result.fundedWallets);
      } else if (result.walletIds && Array.isArray(result.walletIds)) {
        transactionCount = result.walletIds.length;
        console.log('🔍 Found walletIds array:', result.walletIds);
      }
      
      // Try different possible structures for total amount
      if (result.totalAmount) {
        totalAmount = result.totalAmount;
        console.log('🔍 Found totalAmount:', result.totalAmount);
      } else if (result.amount) {
        totalAmount = result.amount;
        console.log('🔍 Found amount:', result.amount);
      } else if (result.totalFunded) {
        totalAmount = result.totalFunded;
        console.log('🔍 Found totalFunded:', result.totalFunded);
      } else if (result.transactions && Array.isArray(result.transactions)) {
        // Calculate total from transactions
        totalAmount = result.transactions.reduce((sum: number, tx: any) => {
          const amount = parseFloat(tx.amount || 0);
          return sum + amount;
        }, 0).toString();
        console.log('🔍 Calculated total from transactions:', totalAmount);
      }
    }
    
    console.log('🔍 Final Values:', { success, transactionCount, totalAmount });
    
    if (success) {
      toast.success(
        `Successfully funded ${transactionCount} wallet${transactionCount !== 1 ? 's' : ''} with ${totalAmount} ETH`,
        {
          duration: 5000,
        }
      );
    } else {
      const errorCount = result?.errors?.length || 0;
      toast.error(
        `Funding failed for ${errorCount} wallet${errorCount !== 1 ? 's' : ''}. Please check the details.`,
        {
          duration: 6000,
        }
      );
    }
    
    // Force refresh wallet data after funding
    console.log('🔍 Forcing wallet data refresh...');
    queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
    queryClient.invalidateQueries({ queryKey: ['availableWallets'] });
    
    // The mutations will automatically invalidate queries and refresh data
  }, [queryClient]);

  // Open funding modal
  const openFundingModal = useCallback((mode: 'single' | 'batch' | 'random', wallets: IWarmUpWallet[]) => {
    setModalConfig({
      isOpen: true,
      mode,
      wallets
    });
  }, []);

  // Close funding modal
  const closeFundingModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Handle mode change in modal
  const handleModalModeChange = useCallback((newMode: 'single' | 'batch' | 'random') => {
    setModalConfig(prev => ({ ...prev, mode: newMode }));
  }, []);

  // Handle fund all
  const handleFundAll = useCallback(() => {
    const selectedWalletsList = filteredWallets.filter((wallet: IWallet) => 
      selectedWallets.includes(wallet._id)
    );
    if (selectedWalletsList.length > 0) {
      openFundingModal('batch', selectedWalletsList as IWarmUpWallet[]);
    }
  }, [filteredWallets, selectedWallets, openFundingModal]);

  // Handle random fund
  const handleRandomFund = useCallback(() => {
    const selectedWalletsList = filteredWallets.filter((wallet: IWallet) => 
      selectedWallets.includes(wallet._id)
    );
    if (selectedWalletsList.length > 0) {
      openFundingModal('random', selectedWalletsList as IWarmUpWallet[]);
    }
  }, [filteredWallets, selectedWallets, openFundingModal]);

  // Handle single wallet fund
  const handleSingleFund = useCallback((wallet: IWallet) => {
    openFundingModal('single', [wallet] as IWarmUpWallet[]);
  }, [openFundingModal]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    refetchFunder();
    refetchHistory();
    // Force complete refresh of all wallet data
    queryClient.invalidateQueries({ queryKey: walletKeys.lists() });
    queryClient.invalidateQueries({ queryKey: ['availableWallets'] });
    queryClient.invalidateQueries({ queryKey: walletKeys.details() });
    // Force refetch
    queryClient.refetchQueries({ queryKey: walletKeys.lists() });
    queryClient.refetchQueries({ queryKey: ['availableWallets'] });
    toast.success('Data refreshed successfully');
  }, [refetchFunder, refetchHistory, queryClient]);

  // Get chain statistics
  const getChainStats = () => {
    const stats: Record<number, number> = {};
    filteredWallets.forEach(wallet => {
      stats[wallet.chainId] = (stats[wallet.chainId] || 0) + 1;
    });
    return stats;
  };

  const chainStats = getChainStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Wallet Funding</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fund your multi-chain wallets for warmup operations with advanced batch and random funding options
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={handleRefresh}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh All Data</span>
        </Button>
      </div>

      {/* Funder Status Card */}
      <MultiChainFunderStatusCard
        onRefresh={refetchFunder}
      />

      {/* Quick Actions */}
      <QuickActions
        onFundAll={handleFundAll}
        onRandomFund={handleRandomFund}
        onRefresh={handleRefresh}
        selectedCount={selectedWallets.length}
        totalCount={filteredWallets.length}
        isLoading={fundWalletMutation.isPending || fundBatchMutation.isPending || fundRandomMutation.isPending}
        funderAvailable={funderStatus?.available}
      />

      {/* Wallet List */}
      <Card title="Wallet List" subtitle="Select wallets to fund">
        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search wallets by address or type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                value={selectedChainId}
                onChange={(e) => setSelectedChainId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Chains</option>
                {enabledChains?.map(chain => (
                  <option key={chain.chainId || chain.id} value={chain.chainId || chain.id}>
                    {chain.name || getChainNameFromService(chain.chainId || chain.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chain Statistics */}
          {Object.keys(chainStats).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Available Wallets by Chain
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(chainStats).map(([chainId, count]) => (
                  <div key={chainId} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                    <div className="flex items-center">
                      <Network className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">
                        {getChainNameFromService(parseInt(chainId))}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {count} wallet{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selection Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredWallets.length} of {wallets?.length || 0} wallets available
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedChainId && ` on ${getChainNameFromService(parseInt(selectedChainId))}`}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedWallets.length} selected
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
        </div>

        {/* Wallet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWallets.map((wallet: IWallet) => {
            const explorerUrl = getExplorerUrl(wallet.chainId, wallet.publicKey || wallet.address);
            
            // Debug: Log wallet data for first few wallets
            if (filteredWallets.indexOf(wallet) < 3) {
              console.log('🔍 Wallet Card Debug:', {
                walletId: wallet._id,
                status: wallet.status,
                statusType: typeof wallet.status,
                isAvailable: isWalletAvailable(wallet),
                hasWarmupProcessId: 'warmupProcessId' in wallet,
                walletKeys: Object.keys(wallet)
              });
            }
            
            // Create a proper IWarmUpWallet object with correct status
            const warmupWallet: IWarmUpWallet = {
              ...wallet,
              warmupStatus: 'pending' as any, // Default value
              transactionCount: 0,
              totalVolume: BigInt(0),
              profitLoss: BigInt(0),
              // Convert status to proper enum if needed
              status: String(wallet.status).toUpperCase() as WalletStatus
            };
            
            return (
              <div key={wallet._id} className="relative">
                <WalletCard
                  wallet={warmupWallet}
                  isSelected={selectedWallets.includes(wallet._id)}
                  isAvailable={isWalletAvailable(wallet)}
                  onSelect={handleWalletSelection}
                  onFund={handleSingleFund}
                  showCheckbox={true}
                />
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 bg-white dark:bg-gray-800 rounded-full p-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredWallets.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              {searchTerm || selectedChainId ? 'No wallets found' : 'No wallets available'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {searchTerm 
                ? `No wallets match "${searchTerm}"`
                : selectedChainId
                ? `No wallets available on ${getChainNameFromService(parseInt(selectedChainId))}`
                : 'Create some wallets first or check wallet availability'
              }
            </p>
          </div>
        )}
      </Card>

      {/* Transaction History */}
      <TransactionHistory
        transactions={fundingHistory}
        isLoading={historyLoading}
        onRefresh={refetchHistory}
        maxItems={10}
      />

      {/* Funding Modal */}
      <FundingModal
        isOpen={modalConfig.isOpen}
        onClose={closeFundingModal}
        wallets={modalConfig.wallets}
        mode={modalConfig.mode}
        onSuccess={handleFundingSuccess}
        onFundSingle={handleFundSingle}
        onFundBatch={handleFundBatch}
        onFundRandom={handleFundRandom}
        onModeChange={handleModalModeChange}
        isLoading={fundWalletMutation.isPending || fundBatchMutation.isPending || fundRandomMutation.isPending}
      />
    </div>
  );
};
