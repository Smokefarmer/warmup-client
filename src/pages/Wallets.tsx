import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { useWallets, useUpdateWalletStatus, useUpdateWalletType, useDeleteWallet } from '../hooks/useWallets';
import { formatAddress, formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import { WalletType, WalletStatus } from '../types/wallet';
import { 
  Plus, 
  Filter, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  Ban,
  Wallet
} from 'lucide-react';

export const Wallets: React.FC = () => {
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    chainId: '',
    search: ''
  });

  const { data: wallets, isLoading } = useWallets();
  const updateStatusMutation = useUpdateWalletStatus();
  const updateTypeMutation = useUpdateWalletType();
  const deleteMutation = useDeleteWallet();

  const filteredWallets = wallets?.filter(wallet => {
    if (filters.type && wallet.type !== filters.type) return false;
    if (filters.status && wallet.status !== filters.status) return false;
    if (filters.chainId && wallet.chainId.toString() !== filters.chainId) return false;
    if (filters.search && !wallet.address.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }) || [];

  const handleStatusUpdate = (id: string, status: WalletStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleTypeUpdate = (id: string, type: WalletType) => {
    updateTypeMutation.mutate({ id, type });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this wallet?')) {
      deleteMutation.mutate(id);
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
          <h1 className="text-3xl font-bold text-gray-900">Wallets</h1>
          <p className="text-gray-600 mt-1">Manage your wallet collection</p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="w-4 h-4 mr-2" />
          Create Wallet
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by address..."
                className="input pl-10"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Types</option>
              {Object.values(WalletType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              {Object.values(WalletStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chain ID</label>
            <select
              className="input"
              value={filters.chainId}
              onChange={(e) => setFilters(prev => ({ ...prev, chainId: e.target.value }))}
            >
              <option value="">All Chains</option>
              <option value="1">Ethereum (1)</option>
              <option value="137">Polygon (137)</option>
              <option value="56">BSC (56)</option>
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
                <th>Address</th>
                <th>Type</th>
                <th>Status</th>
                <th>Chain ID</th>
                <th>Balance</th>
                <th>Transactions</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWallets.map((wallet) => (
                <tr key={wallet.id}>
                  <td>
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-mono text-sm">{formatAddress(wallet.address)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-medium text-gray-900">{wallet.type}</span>
                  </td>
                  <td>
                    <StatusBadge status={wallet.status} />
                  </td>
                  <td>
                    <span className="text-sm text-gray-900">{wallet.chainId}</span>
                  </td>
                  <td>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(wallet.balance)}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-900">{wallet.transactionCount || 0}</span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500">{formatDate(wallet.createdAt)}</span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      {wallet.status === WalletStatus.ACTIVE && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleStatusUpdate(wallet.id, WalletStatus.PAUSED)}
                          loading={updateStatusMutation.isPending}
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {wallet.status === WalletStatus.PAUSED && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusUpdate(wallet.id, WalletStatus.ACTIVE)}
                          loading={updateStatusMutation.isPending}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {wallet.status !== WalletStatus.BANNED && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleStatusUpdate(wallet.id, WalletStatus.BANNED)}
                          loading={updateStatusMutation.isPending}
                        >
                          <Ban className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(wallet.id)}
                        loading={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredWallets.length === 0 && (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No wallets found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{filteredWallets.length}</p>
            <p className="text-sm text-gray-500">Total Wallets</p>
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
    </div>
  );
};
