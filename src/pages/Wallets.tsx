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
  useArchiveWallet 
} from '../hooks/useWallets';
import { useUpdateTotalFundedForWallets, useUpdateTotalFundedForWallet } from '../hooks/useBalance';
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
  RefreshCw
} from 'lucide-react';

export const Wallets: React.FC = () => {
  const { data: activeWallets = [], isLoading: activeLoading, refetch: refetchActive } = useWallets();
  const { data: archivedWallets = [], isLoading: archivedLoading, refetch: refetchArchived } = useArchivedWallets();
  const { getExplorerUrl, getChainName: getChainNameFromService, supportedChains } = useMultiChain();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showStrategicGeneration, setShowStrategicGeneration] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedChain, setSelectedChain] = useState('');

  const updateStatusMutation = useUpdateWalletStatus();
  const updateTypeMutation = useUpdateWalletType();
  const archiveMutation = useArchiveWallet();
  const updateAllBalancesMutation = useUpdateTotalFundedForWallets();
  const updateSingleBalanceMutation = useUpdateTotalFundedForWallet();

  // Use the correct wallet data based on current view
  const wallets = showArchived ? archivedWallets : activeWallets;
  const isLoading = showArchived ? archivedLoading : activeLoading;
  const refetch = showArchived ? refetchArchived : refetchActive;

  // Filter wallets based on search term and filters (no need to filter by archived status anymore)
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = !searchTerm || 
      (wallet.publicKey || wallet.address).toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || wallet.type === selectedType;
    const matchesStatus = !selectedStatus || 
      wallet.status === selectedStatus || 
      wallet.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesChain = !selectedChain || wallet.chainId === parseInt(selectedChain);
    
    return matchesSearch && matchesType && matchesStatus && matchesChain;
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
      const result = await updateAllBalancesMutation.mutateAsync({
        type: showArchived ? 'all' : 'active'
      });
      const updatedCount = result?.length || 0;
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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



      {/* Wallets Table */}
      {!showStrategicGeneration && (
        <Card>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Chain</th>
                  <th>Balance</th>
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
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(wallet.createdAt)}</span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {(wallet.status === WalletStatus.ACTIVE || wallet.status === 'active') && (
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
    </div>
  );
};