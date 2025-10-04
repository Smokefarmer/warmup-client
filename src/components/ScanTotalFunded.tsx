import React, { useState, useCallback, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { StatusBadge } from './common/StatusBadge';
import { SkeletonLoader } from './common/SkeletonLoader';
import { VirtualWalletList } from './VirtualWalletList';
import { BalanceSummary } from './BalanceSummary';
import { useWallets } from '../hooks/useWallets';
import { useWalletSelection } from '../hooks/useWalletSelection';
import { useScanProgress } from '../hooks/useScanProgress';
import { useUpdateTotalFundedForWallets } from '../hooks/useBalance';
import { useDebounce } from '../hooks/useDebounce';
import { formatAddress, formatWalletBalance, formatMixedBalance } from '../utils/formatters';
import { WalletType, WalletStatus } from '../types/wallet';
import { 
  Search, 
  CheckSquare, 
  Square, 
  MinusSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  X
} from 'lucide-react';

export const ScanTotalFunded: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  // Get wallets data
  const { data: wallets = [], isLoading: walletsLoading } = useWallets();
  
  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Wallet selection management
  const {
    selectedWallets,
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

  // Update filters when search changes
  useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch, updateFilters]);

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

  if (walletsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Scan and Update Total Funded
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manually trigger blockchain scanning for incoming ETH transfers
            </p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Scan and Update Total Funded
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manually trigger blockchain scanning for incoming ETH transfers
          </p>
        </div>
      </div>

      {/* Action Buttons */}
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
              <Button
                variant="secondary"
                size="sm"
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by address..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
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
          
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={toggleSelectAll}
              disabled={filteredWallets.length === 0}
            >
              {indeterminate ? (
                <MinusSquare className="w-4 h-4 mr-2" />
              ) : selectAll ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              {selectAll ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Wallets List */}
      <Card>
        {filteredWallets.length > 100 ? (
          <VirtualWalletList
            wallets={filteredWallets}
            selectedWallets={selectedWallets}
            onWalletSelect={toggleWalletSelection}
            onSelectAll={toggleSelectAll}
            selectAll={selectAll}
            indeterminate={indeterminate}
            containerHeight={400}
          />
        ) : (
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
                  <th>Total Funded</th>
                  <th>Balance</th>
                  <th>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.map((wallet) => (
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
                        <span className="font-mono text-sm">{formatAddress(wallet.address)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {wallet.type}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={wallet.status} />
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatWalletBalance(wallet.totalFunded || '0', wallet.chainId)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatWalletBalance(wallet.nativeTokenBalance || '0', wallet.chainId)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {wallet.buyTxCount + wallet.sellTxCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredWallets.length === 0 && (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No wallets found</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Balance Summary */}
      <BalanceSummary />

      {/* Results */}
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
    </div>
  );
};
