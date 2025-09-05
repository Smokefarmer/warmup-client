import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { CopyButton } from '../components/common/CopyButton';
import { StrategicWalletGenerator } from '../components/StrategicWalletGenerator';
import { GenerateWalletModal } from '../components/GenerateWalletModal';

import { 
  useWallets, 
  useArchivedWallets,
  useUpdateWalletStatus, 
  useUpdateWalletType, 
  useArchiveWallet,
  useWalletsWithTokenInfo,
  useRefreshTokenCount,
  useTokenStatistics,
  useUpdateWalletTag,
  useRemoveWalletTag
} from '../hooks/useWallets';
import { useForceUpdateAllBalances, useUpdateTotalFundedForWallet } from '../hooks/useBalance';
import { useMultiChain } from '../hooks/useMultiChain';
import { WalletStatus, WalletType } from '../types/wallet';
import { formatAddress, formatDate, formatWalletBalance } from '../utils/formatters';

import { 
  Wallet, 
  Plus, 
  Target, 
  ExternalLink,
  Network,
  Play,
  Pause,
  Ban,
  Archive,
  Search,
  Filter,
  History,
  RefreshCw,
  BarChart3,
  Coins,
  Tag,
  Tags,
  X
} from 'lucide-react';

// Import token components
import { 
  TokenProgressBar, 
  SellProbabilityBadge, 
  TokenStatusIndicator,
  TokenStatisticsCard
} from '../components/token';

export const Wallets: React.FC = () => {
  // Token management hooks
  const [showTokenInfo, setShowTokenInfo] = useState(true);
  
  // Conditional data loading based on token info toggle
  const { 
    data: activeWalletsWithToken = [], 
    isLoading: activeLoadingWithToken, 
    error: tokenWalletsError,
    refetch: refetchActiveWithToken 
  } = useWalletsWithTokenInfo();
  
  const { 
    data: activeWalletsRegular = [], 
    isLoading: activeLoadingRegular, 
    refetch: refetchActiveRegular 
  } = useWallets();
  
  // Use token-enabled wallets if available and token info is enabled, otherwise fallback to regular
  const activeWallets = showTokenInfo && !tokenWalletsError ? activeWalletsWithToken : activeWalletsRegular;
  const activeLoading = showTokenInfo && !tokenWalletsError ? activeLoadingWithToken : activeLoadingRegular;
  const refetchActive = showTokenInfo && !tokenWalletsError ? refetchActiveWithToken : refetchActiveRegular;
  const { data: archivedWallets = [], isLoading: archivedLoading, refetch: refetchArchived } = useArchivedWallets();
  const { getExplorerUrl, getChainName: getChainNameFromService, supportedChains } = useMultiChain();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showStrategicGeneration, setShowStrategicGeneration] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Additional token management hooks
  const { data: tokenStatistics, error: tokenStatsError } = useTokenStatistics();
  const refreshTokenCountMutation = useRefreshTokenCount();
  
  // Tag management hooks
  const updateTagMutation = useUpdateWalletTag();
  const removeTagMutation = useRemoveWalletTag();
  
  // Wallet selection for bulk operations
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [bulkTagValue, setBulkTagValue] = useState('');
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const updateStatusMutation = useUpdateWalletStatus();
  const updateTypeMutation = useUpdateWalletType();
  const archiveMutation = useArchiveWallet();
  const updateAllBalancesMutation = useForceUpdateAllBalances();
  const updateSingleBalanceMutation = useUpdateTotalFundedForWallet();

  // Use the correct wallet data based on current view
  const wallets = showArchived ? archivedWallets : activeWallets;
  const isLoading = showArchived ? archivedLoading : activeLoading;
  const refetch = showArchived ? refetchArchived : refetchActive;

  // Get unique tags for filter dropdown
  const uniqueTags = Array.from(new Set(
    wallets
      .filter(wallet => wallet.tag && wallet.tag.trim())
      .map(wallet => wallet.tag!)
  )).sort();

  // Filter wallets based on search term and filters (no need to filter by archived status anymore)
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = !searchTerm || 
      (wallet.publicKey || wallet.address).toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wallet.tag && wallet.tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !selectedType || wallet.type === selectedType;
    const matchesStatus = !selectedStatus || 
      wallet.status === selectedStatus || 
      wallet.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesChain = !selectedChain || wallet.chainId === parseInt(selectedChain);
    const matchesTag = !selectedTag || 
      (selectedTag === 'no-tag' ? !wallet.tag : wallet.tag === selectedTag);
    
    return matchesSearch && matchesType && matchesStatus && matchesChain && matchesTag;
  });

  // Debug logging to see what wallet data we have
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Active wallets:', activeWallets.length);
      console.log('🔍 Archived wallets:', archivedWallets.length);
      console.log('🔍 Showing archived:', showArchived);
      console.log('🔍 Current filtered count:', filteredWallets.length);
    }
  }, [activeWallets.length, archivedWallets.length, showArchived, filteredWallets.length]);

  const handleStatusUpdate = async (walletId: string, status: WalletStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: walletId, status });
      refetch();
    } catch (error) {
      console.error('Failed to update wallet status:', error);
    }
  };

  const handleArchive = async (walletId: string) => {
    try {
      await archiveMutation.mutateAsync(walletId);
      // Refresh both active and archived lists since wallet moved between them
      refetchActive();
      refetchArchived();
    } catch (error) {
      console.error('Failed to archive wallet:', error);
    }
  };

  // Handle force update all balances
  const handleForceUpdateAllBalances = async () => {
    try {
      const result = await updateAllBalancesMutation.mutateAsync();
      const updatedCount = result?.totalWalletsProcessed || 0;
      toast.success(`Successfully updated balances for ${updatedCount} wallets`);
      if (import.meta.env.DEV) {
        console.log('✅ Force updated all wallet balances:', result);
      }
    } catch (error) {
      console.error('Failed to update all balances:', error);
      toast.error('Failed to update wallet balances');
    }
  };

  // Handle force update single wallet balance
  const handleForceUpdateBalance = async (walletId: string) => {
    try {
      const result = await updateSingleBalanceMutation.mutateAsync({ walletId });
      if (result?.success) {
        toast.success(`Balance updated: ${result.newTotalFunded} (was ${result.oldTotalFunded})`);
      } else {
        toast.success('Wallet balance updated successfully');
      }
      if (import.meta.env.DEV) {
        console.log(`✅ Force updated balance for wallet: ${walletId}`, result);
      }
    } catch (error) {
      console.error('Failed to update wallet balance:', error);
      toast.error('Failed to update wallet balance');
    }
  };

  // Wallet selection handlers
  const handleWalletSelection = (walletId: string) => {
    setSelectedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedWallets.size === filteredWallets.length) {
      setSelectedWallets(new Set());
    } else {
      setSelectedWallets(new Set(filteredWallets.map(w => w._id)));
    }
  };

  // Bulk tag operations
  const handleBulkSetTag = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    if (!bulkTagValue.trim()) {
      toast.error('Please enter a tag value');
      return;
    }

    const walletIds = Array.from(selectedWallets);
    let successCount = 0;
    let failCount = 0;

    for (const walletId of walletIds) {
      try {
        await updateTagMutation.mutateAsync({ walletId, tag: bulkTagValue.trim() });
        successCount++;
      } catch (error) {
        console.error(`Failed to set tag for wallet ${walletId}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Tag set for ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to set tag for ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    // Reset state
    setBulkTagValue('');
    setShowBulkTagModal(false);
    setSelectedWallets(new Set());
  };

  const handleBulkRemoveTag = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const walletIds = Array.from(selectedWallets);
    let successCount = 0;
    let failCount = 0;

    for (const walletId of walletIds) {
      try {
        await removeTagMutation.mutateAsync(walletId);
        successCount++;
      } catch (error) {
        console.error(`Failed to remove tag for wallet ${walletId}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Tag removed from ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to remove tag from ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    // Reset selection
    setSelectedWallets(new Set());
  };

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {showStrategicGeneration 
              ? 'Strategic Wallet Generation' 
              : showArchived 
                ? 'Archived Wallets' 
                : 'Wallet Management'
            }
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {showStrategicGeneration 
              ? 'Generate wallets with intelligent distribution and advanced strategies'
              : showArchived
                ? 'View and manage your archived wallets'
                : 'Manage your wallet collection and status'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          {!showStrategicGeneration && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowGenerateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Quick Generate
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowStrategicGeneration(true)}
              >
                <Target className="w-4 h-4 mr-2" />
                Strategic Generation
              </Button>
              <Button
                variant={showArchived ? 'primary' : 'secondary'}
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Active Wallets
                  </>
                ) : (
                  <>
                    <History className="w-4 h-4 mr-2" />
                    Archived Wallets
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={handleForceUpdateAllBalances}
                loading={updateAllBalancesMutation.isPending}
                disabled={filteredWallets.length === 0}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Force Update Balances
              </Button>
              {selectedWallets.size > 0 && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setShowBulkTagModal(true)}
                  >
                    <Tags className="w-4 h-4 mr-2" />
                    Set Tag ({selectedWallets.size})
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleBulkRemoveTag}
                    loading={removeTagMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Tags ({selectedWallets.size})
                  </Button>
                </>
              )}
            </>
          )}
          {showStrategicGeneration && (
            <Button
              variant="secondary"
              onClick={() => setShowStrategicGeneration(false)}
            >
              Back to Wallet List
            </Button>
          )}
        </div>
      </div>

      {/* Strategic Wallet Generation */}
      {showStrategicGeneration && (
        <StrategicWalletGenerator />
      )}

      {/* Filters */}
      {!showStrategicGeneration && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by address or type..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                {Object.values(WalletType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {Object.values(WalletStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
                      
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chain</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
              >
                <option value="">All Chains</option>
                {supportedChains?.map(chain => (
                  <option key={chain.chainId || chain.id} value={chain.chainId || chain.id}>
                    {chain.name || getChainNameFromService(chain.chainId || chain.id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="">All Tags</option>
                <option value="no-tag">No Tag</option>
                {uniqueTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* KPIs */}
      {!showStrategicGeneration && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Filtered */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {showArchived ? 'Archived' : 'Active'} Wallets
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {filteredWallets.length}
                  {filteredWallets.length !== wallets.length && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      /{wallets.length}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Chain Distribution */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Network className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Chains</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {new Set(filteredWallets.map(w => w.chainId)).size}
                </p>
              </div>
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Types</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {new Set(filteredWallets.map(w => w.type)).size}
                </p>
              </div>
            </div>
          </div>

          {/* Total Balance */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Balance</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {(() => {
                    const totalBalance = filteredWallets.reduce((sum, wallet) => {
                      // Convert lamports to SOL properly based on chain
                      const { decimals } = wallet.chainId === 101 ? { decimals: 9 } : { decimals: 18 };
                      const balance = parseFloat(wallet.nativeTokenBalance || '0') / Math.pow(10, decimals);
                      return sum + balance;
                    }, 0);
                    return totalBalance > 0 ? `${totalBalance.toFixed(6)} SOL` : '0 SOL';
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Statistics */}
      {!showStrategicGeneration && tokenStatistics && !tokenStatsError && (
        <TokenStatisticsCard statistics={tokenStatistics} />
      )}
      
      {/* Token Statistics Error (Development Info) */}
      {!showStrategicGeneration && tokenStatsError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Token Statistics Unavailable
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                The token statistics endpoint is not available yet. Token information in the wallet list will still work once the backend endpoints are implemented.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Token Info Toggle */}
      {!showStrategicGeneration && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showTokenInfo}
                onChange={(e) => setShowTokenInfo(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Coins className="w-4 h-4 inline mr-1" />
                Show Token Information
                {tokenWalletsError && (
                  <span className="text-xs text-yellow-600 ml-1">(API not ready)</span>
                )}
              </span>
            </label>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredWallets.length} wallet{filteredWallets.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      )}

      {/* Wallets Table */}
      {!showStrategicGeneration && (
        <Card>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedWallets.size === filteredWallets.length && filteredWallets.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Chain</th>
                  <th>Balance</th>
                  <th>Tag</th>
                  {showTokenInfo && (
                    <>
                      <th>Tokens</th>
                      <th>Sell Probability</th>
                      <th>Status</th>
                    </>
                  )}
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.map((wallet) => {
                  const explorerUrl = getExplorerUrl(wallet.chainId, wallet.publicKey || wallet.address);
                  
                  return (
                    <tr key={wallet._id}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedWallets.has(wallet._id)}
                          onChange={() => handleWalletSelection(wallet._id)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Wallet className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-mono text-sm">{formatAddress(wallet.publicKey || wallet.address)}</span>
                          <CopyButton text={wallet.publicKey || wallet.address} size="sm" className="ml-2" />
                          {explorerUrl && (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{wallet.type}</span>
                      </td>
                      <td>
                        <StatusBadge status={wallet.status} />
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Network className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {getChainNameFromService(wallet.chainId)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatWalletBalance(wallet.nativeTokenBalance || '0', wallet.chainId)}
                        </span>
                      </td>
                      <td>
                        {wallet.tag ? (
                          <div className="flex items-center">
                            <Tag className="w-3 h-3 text-blue-500 mr-1" />
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {wallet.tag}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No tag</span>
                        )}
                      </td>
                      {showTokenInfo && (
                        <>
                          <td>
                            {wallet.tokenInfo ? (
                              <TokenProgressBar
                                current={wallet.tokenInfo.currentTokenCount}
                                max={wallet.tokenInfo.maxTokens}
                                size="sm"
                                showLabels={false}
                                className="w-24"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">No data</span>
                            )}
                          </td>
                          <td>
                            {wallet.tokenInfo ? (
                              <SellProbabilityBadge
                                probability={wallet.tokenInfo.sellProbability}
                                size="sm"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td>
                            {wallet.tokenInfo ? (
                              <TokenStatusIndicator
                                canBuy={wallet.tokenInfo.canBuy}
                                shouldForceSell={wallet.tokenInfo.shouldForceSell}
                                reason={wallet.tokenInfo.reason}
                                size="sm"
                                showReason={false}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </>
                      )}
                      <td>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(wallet.createdAt)}</span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {wallet.status === WalletStatus.ACTIVE && (
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleStatusUpdate(wallet._id, WalletStatus.PAUSED)}
                              loading={updateStatusMutation.isPending}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {wallet.status === WalletStatus.PAUSED && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleStatusUpdate(wallet._id, WalletStatus.ACTIVE)}
                              loading={updateStatusMutation.isPending}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {wallet.status !== WalletStatus.BANNED && wallet.status !== WalletStatus.ARCHIVED && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleStatusUpdate(wallet._id, WalletStatus.BANNED)}
                              loading={updateStatusMutation.isPending}
                            >
                              <Ban className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleForceUpdateBalance(wallet._id)}
                            loading={updateSingleBalanceMutation.isPending}
                            title="Force update wallet balance"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                          
                          {showTokenInfo && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => refreshTokenCountMutation.mutate(wallet._id)}
                              loading={refreshTokenCountMutation.isPending}
                              title="Refresh token count"
                            >
                              <Coins className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleArchive(wallet._id)}
                            loading={archiveMutation.isPending}
                          >
                            <Archive className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredWallets.length === 0 && (
              <div className="text-center py-8">
                {showArchived ? (
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                ) : (
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                )}
                <p className="text-gray-500 dark:text-gray-400">
                  {showArchived 
                    ? 'No archived wallets found'
                    : wallets.length === 0 
                      ? 'No wallets found' 
                      : 'No wallets match your filters'
                  }
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {showArchived
                    ? 'Archived wallets will appear here when you archive active wallets'
                    : wallets.length === 0 
                      ? 'Create your first wallet using the generate buttons above'
                      : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Generate Wallet Modal */}
      <GenerateWalletModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={() => {
          setShowGenerateModal(false);
          refetch();
        }}
      />

      {/* Bulk Tag Modal */}
      {showBulkTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Set Tag for {selectedWallets.size} Wallets
              </h3>
              <button
                onClick={() => setShowBulkTagModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag Value
              </label>
              <input
                type="text"
                placeholder="Enter tag value..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={bulkTagValue}
                onChange={(e) => setBulkTagValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBulkSetTag();
                  }
                }}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowBulkTagModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkSetTag}
                loading={updateTagMutation.isPending}
                disabled={!bulkTagValue.trim()}
              >
                <Tag className="w-4 h-4 mr-2" />
                Set Tag
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};