import React, { useState } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { StatusBadge } from './common/StatusBadge';
import { CopyButton } from './common/CopyButton';
import { SkeletonLoader } from './common/SkeletonLoader';
import { useArchivedWallets, useUnarchiveWallet } from '../hooks/useWallets';
import { formatAddress, formatWalletBalance, formatDate } from '../utils/formatters';
import { WalletStatus } from '../types/wallet';
import { getChainName, getExplorerUrl } from '../config/chains';
import { 
  Archive, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  Wallet,
  Network,
  Calendar,
  ArrowLeft
} from 'lucide-react';

interface ArchivedWalletsViewProps {
  onBack: () => void;
}

export const ArchivedWalletsView: React.FC<ArchivedWalletsViewProps> = ({ onBack }) => {
  const { data: archivedWallets = [], isLoading, error, refetch } = useArchivedWallets();
  const unarchiveMutation = useUnarchiveWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleUnarchive = (id: string) => {
    if (window.confirm('Are you sure you want to unarchive this wallet? It will be restored to active status.')) {
      setSelectedWallet(id);
      unarchiveMutation.mutate(id, {
        onSuccess: () => {
          setSelectedWallet(null);
        },
        onError: () => {
          setSelectedWallet(null);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Active Wallets
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Archived Wallets</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage archived wallets</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <Card>
          <SkeletonLoader type="table-row" count={5} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Active Wallets
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Archived Wallets</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage archived wallets</p>
            </div>
          </div>
        </div>
        
        <Card>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg font-semibold mb-2">Error Loading Archived Wallets</div>
              <div className="text-gray-600 dark:text-gray-400 mb-4">
                {error.message || 'Failed to load archived wallet data.'}
              </div>
              <Button variant="primary" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Active Wallets
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Archived Wallets</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {archivedWallets.length} archived wallet{archivedWallets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Archived Wallets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Type</th>
                <th>Status</th>
                <th>Chain</th>
                <th>Total Funded</th>
                <th>Balance</th>
                <th>Transactions</th>
                <th>Archived</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedWallets.map((wallet) => {
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
                          {getChainName(wallet.chainId)}
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
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-1" />
                        {wallet.archivedAt ? formatDate(wallet.archivedAt) : 'Unknown'}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleUnarchive(wallet._id)}
                          loading={selectedWallet === wallet._id && unarchiveMutation.isPending}
                          disabled={unarchiveMutation.isPending}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Unarchive
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {archivedWallets.length === 0 && (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No archived wallets found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{archivedWallets.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Archived</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {archivedWallets.reduce((sum, wallet) => sum + BigInt(wallet.totalFunded || '0'), BigInt(0)).toString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Funded</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {archivedWallets.reduce((sum, wallet) => sum + wallet.buyTxCount + wallet.sellTxCount, 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
