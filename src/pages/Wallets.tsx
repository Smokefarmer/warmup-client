import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { CopyButton } from '../components/common/CopyButton';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { VirtualWalletList } from '../components/VirtualWalletList';
import { BalanceSummary } from '../components/BalanceSummary';
import { MultiChainWalletModal } from '../components/MultiChainWalletModal';
import { GenerateWalletModal } from '../components/GenerateWalletModal';
import { StrategicWalletGenerator } from '../components/StrategicWalletGenerator';
import { ArchivedWalletsView } from '../components/ArchivedWalletsView';
import { BulkWalletCleanup } from '../components/BulkWalletCleanup';
import { useWallets, useUpdateWalletStatus, useUpdateWalletType, useArchiveWallet } from '../hooks/useWallets';
import { useWalletSelection } from '../hooks/useWalletSelection';
import { useScanProgress } from '../hooks/useScanProgress';
import { useUpdateTotalFundedForWallets } from '../hooks/useBalance';

import { useMultiChain } from '../hooks/useMultiChain';
import { formatAddress, formatWalletBalance, formatDate, formatMixedBalance } from '../utils/formatters';
import { WalletType, WalletStatus, ChainId } from '../types/wallet';
import { getChainName, getChainDecimals, getChainSymbol } from '../config/chains';
import { 
  Plus, 
  Search, 
  Trash2, 
  Play, 
  Pause,
  Ban,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Network,
  ExternalLink,
  Zap,
  Archive,
  ArrowRight,
  Target,
  Settings
} from 'lucide-react';

export const Wallets: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showStrategicGenerator, setShowStrategicGenerator] = useState(false);
  const [showArchivedWallets, setShowArchivedWallets] = useState(false);
  const [showBulkCleanup, setShowBulkCleanup] = useState(false);
  const [activeJobs, setActiveJobs] = useState<string[]>([]);

  // Only log in development
  if (import.meta.env.DEV) {
    console.log('🔍 Wallets Component - About to call useWallets hook');
  }
  const { data: wallets = [], isLoading, error } = useWallets();
  
  // Multi-chain functionality
  const { 
    supportedChains, 
    enabledChains,
    getChainName: getChainNameFromService,
    getExplorerUrl 
  } = useMultiChain();
  

  
  // Wallet selection management
  const {
    selectedWallets,
    selectedWalletsData,
    selectedWalletIds,
    filteredWallets,
    filters,
    selectAll,
    indeterminate,
    selectionSummary,
    toggleWalletSelection,
    toggleSelectAll,
    clearSelection,
    updateFilters,
  } = useWalletSelection(wallets);

  // Scan progress management
  const {
    progress,
    startScan,
    updateCurrentWallet,
    addResult,
    requestCancel,
    completeScan,
    resetProgress,
    formatEstimatedTime,
  } = useScanProgress();

  // Balance update mutation
  const updateTotalFundedMutation = useUpdateTotalFundedForWallets();



  // Debug logging (development only)
  if (import.meta.env.DEV) {
    console.log('🔍 Wallets Debug:', {
      wallets,
      isLoading,
      error,
      walletsType: typeof wallets,
      isArray: Array.isArray(wallets),
      length: wallets?.length
    });
  }
  const updateStatusMutation = useUpdateWalletStatus();
  const updateTypeMutation = useUpdateWalletType();
  const archiveMutation = useArchiveWallet();

  // Handle scan all wallets
  const handleScanAll = useCallback(async () => {
    if (wallets.length === 0) return;

    startScan(wallets.length);
    setShowResults(true);

    try {
      const result = await updateTotalFundedMutation.mutateAsync({
        type: 'all'
      });

      if (result) {
        result.forEach((item, index) => {
          updateCurrentWallet(item.walletId, index + 1);
          addResult(item);
        });
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      completeScan();
    }
  }, [wallets.length, startScan, updateTotalFundedMutation, updateCurrentWallet, addResult, completeScan]);

  // Handle scan selected wallets
  const handleScanSelected = useCallback(async () => {
    if (selectedWalletIds.length === 0) return;

    startScan(selectedWalletIds.length);
    setShowResults(true);

    try {
      const result = await updateTotalFundedMutation.mutateAsync({
        walletIds: selectedWalletIds
      });

      if (result) {
        result.forEach((item, index) => {
          updateCurrentWallet(item.walletId, index + 1);
          addResult(item);
        });
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      completeScan();
    }
  }, [selectedWalletIds, startScan, updateTotalFundedMutation, updateCurrentWallet, addResult, completeScan]);

  // Handle cancel scan
  const handleCancelScan = useCallback(() => {
    requestCancel();
    completeScan();
  }, [requestCancel, completeScan]);

  // Handle clear results
  const handleClearResults = useCallback(() => {
    setShowResults(false);
    resetProgress();
  }, [resetProgress]);

  const handleStatusUpdate = (id: string, status: WalletStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleTypeUpdate = (id: string, type: WalletType) => {
    updateTypeMutation.mutate({ id, type });
  };

  const handleArchive = (id: string) => {
    if (window.confirm('Are you sure you want to archive this wallet? It will be moved to the archived wallets section.')) {
      archiveMutation.mutate(id);
    }
  };

  const handleCreateWallet = (wallet: any) => {
    if (import.meta.env.DEV) {
      console.log('Wallet created successfully:', wallet);
    }
    // The wallet list will automatically refresh due to query invalidation
  };

  const handleGenerateWallet = (wallet: any) => {
    if (import.meta.env.DEV) {
      console.log('Wallet generated successfully:', wallet);
    }
    // The wallet list will automatically refresh due to query invalidation
  };

  const handleJobStarted = (jobId: string) => {
    setActiveJobs(prev => [...prev, jobId]);
  };

  const handleJobComplete = (jobId: string, result: any) => {
    setActiveJobs(prev => prev.filter(id => id !== jobId));
    if (import.meta.env.DEV) {
      console.log('Strategic wallet generation completed:', result);
    }
  };

  // Show archived wallets view
  if (showArchivedWallets) {
    return (
      <ArchivedWalletsView onBack={() => setShowArchivedWallets(false)} />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Wallets</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your wallet collection</p>
          </div>
        </div>
        
        <Card>
          <SkeletonLoader type="button" count={2} />
        </Card>
        
        <Card>
          <SkeletonLoader type="card" count={1} />
        </Card>
        
        <Card>
          <SkeletonLoader type="table-row" count={5} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error Loading Wallets</div>
          <div className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || 'Failed to load wallet data. Please check your API connection.'}
          </div>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Strategic Wallet Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Advanced wallet generation and management system</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            size="md"
            onClick={() => setShowArchivedWallets(true)}
          >
            <Archive className="w-4 h-4 mr-2" />
            Archived
          </Button>
          <Button 
            variant={showStrategicGenerator ? 'primary' : 'secondary'} 
            size="md"
            onClick={() => setShowStrategicGenerator(!showStrategicGenerator)}
          >
            <Target className="w-4 h-4 mr-2" />
            Strategic Generation
          </Button>
          <Button 
            variant="secondary" 
            size="md"
            onClick={() => setShowGenerateModal(true)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Quick Generate
          </Button>
          <Button 
            variant="secondary" 
            size="md"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Strategic Wallet Generation */}
      {showStrategicGenerator && (
        <StrategicWalletGenerator 
          onJobStarted={handleJobStarted}
        />
      )}

      {/* Scan and Update Total Funded Actions */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleScanAll}
            loading={progress.isScanning}
            disabled={wallets.length === 0 || progress.isScanning}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Scan and Update Total Funded
          </Button>

          {selectedWalletIds.length > 0 && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleScanSelected}
              loading={progress.isScanning}
              disabled={progress.isScanning}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Scan Selected Wallets ({selectedWalletIds.length})
            </Button>
          )}

          {progress.isScanning && (
            <Button
              variant="danger"
              size="lg"
              onClick={handleCancelScan}
            >
              <X className="w-5 h-5 mr-2" />
              Cancel Scan
            </Button>
          )}

          {showResults && !progress.isScanning && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleClearResults}
            >
              Clear Results
            </Button>
          )}
        </div>

        {/* Selection Summary */}
        {selectedWalletIds.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedWalletIds.length} wallets selected
                </span>
                <div className="flex space-x-2 text-xs">
                  <span className="text-green-600 dark:text-green-400">
                    {selectionSummary.active} active
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {selectionSummary.paused} paused
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    {selectionSummary.banned} banned
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => setShowBulkCleanup(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Bulk Cleanup
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearSelection}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Progress Bar */}
      {progress.isScanning && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
                <span className="font-medium">Scanning...</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {progress.currentIndex} / {progress.totalWallets}
              </div>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {progress.currentWallet && (
                  <>Scanning: {formatAddress(progress.currentWallet)}</>
                )}
              </span>
              {progress.estimatedTimeRemaining && (
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {formatEstimatedTime(progress.estimatedTimeRemaining / 1000)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by address..."
                className="input pl-10"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => updateFilters({ type: e.target.value })}
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
              className="input"
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
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
              className="input"
              value={filters.chainId}
              onChange={(e) => updateFilters({ chainId: e.target.value })}
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
      </Card>

      {/* Wallets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    ref={(input) => {
                      if (input) input.indeterminate = indeterminate;
                    }}
                    onChange={toggleSelectAll}
                    disabled={filteredWallets.length === 0}
                  />
                </th>
                <th>Address</th>
                <th>Type</th>
                <th>Status</th>
                <th>Chain</th>
                <th>Total Funded</th>
                <th>Balance</th>
                <th>Transactions</th>
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
                        checked={selectedWallets.has(wallet._id)}
                        onChange={() => toggleWalletSelection(wallet._id)}
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
                        {formatWalletBalance(BigInt(wallet.totalFunded || '0'), wallet.chainId)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatWalletBalance(BigInt(wallet.nativeTokenBalance || '0'), wallet.chainId)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{wallet.buyTxCount + wallet.sellTxCount}</span>
                    </td>
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
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No wallets found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Balance Summary */}
      <BalanceSummary />

      {/* Scan Results */}
      {showResults && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Scan Results
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>{progress.results.filter(r => r.success).length} successful</span>
                </div>
                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span>{progress.errors.length} failed</span>
                </div>
              </div>
            </div>

            {progress.results.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {progress.results.map((result, index) => (
                  <div
                    key={`${result.walletId}-${index}`}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className="font-mono text-sm">
                          {formatAddress(result.walletId)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {result.transactionsFound} transactions found
                      </div>
                    </div>
                    
                    {result.success && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Total Funded: {formatMixedBalance(BigInt(result.oldTotalFunded))} →{' '}
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatMixedBalance(BigInt(result.newTotalFunded))}
                          </span>
                        </span>
                      </div>
                    )}
                    
                    {!result.success && result.error && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredWallets.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Wallets</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">
              {filteredWallets.filter(w => w.status === WalletStatus.ACTIVE).length}
            </p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning-600">
              {filteredWallets.filter(w => w.status === WalletStatus.PAUSED).length}
            </p>
            <p className="text-sm text-gray-500">Paused</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-danger-600">
              {filteredWallets.filter(w => w.status === WalletStatus.BANNED).length}
            </p>
            <p className="text-sm text-gray-500">Banned</p>
          </div>
        </Card>
      </div>

      {/* Multi-Chain Wallet Creation Modal */}
      <MultiChainWalletModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateWallet}
      />

      {/* Generate Wallet Modal */}
      <GenerateWalletModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={handleGenerateWallet}
      />

      {/* Bulk Wallet Cleanup Modal */}
      {showBulkCleanup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Bulk Wallet Cleanup
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBulkCleanup(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <BulkWalletCleanup
                wallets={selectedWalletsData}
                onComplete={() => {
                  setShowBulkCleanup(false);
                  clearSelection();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
