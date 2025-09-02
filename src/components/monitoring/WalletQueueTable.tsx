import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { 
  ArrowUpDown, 
  Filter, 
  Search,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { WalletQueueItem } from '../../types/monitoring';

interface WalletQueueTableProps {
  wallets: WalletQueueItem[];
  isLoading?: boolean;
}

type SortField = 'nextExecutionTime' | 'balance' | 'status' | 'type' | 'progress';
type SortDirection = 'asc' | 'desc';

export const WalletQueueTable: React.FC<WalletQueueTableProps> = ({ 
  wallets, 
  isLoading = false 
}) => {
  const [sortField, setSortField] = useState<SortField>('nextExecutionTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and sort wallets
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = !searchTerm || 
      wallet.shortAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || wallet.status.includes(filterStatus);
    
    return matchesSearch && matchesStatus;
  });

  const sortedWallets = [...filteredWallets].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle special sorting cases
    if (sortField === 'nextExecutionTime') {
      aValue = a.timeUntilNextMs || Infinity;
      bValue = b.timeUntilNextMs || Infinity;
    } else if (sortField === 'balance') {
      aValue = parseFloat(a.balance) || 0;
      bValue = parseFloat(b.balance) || 0;
    } else if (sortField === 'progress') {
      aValue = parseFloat(a.progress) || 0;
      bValue = parseFloat(b.progress) || 0;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedWallets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWallets = sortedWallets.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getBalanceStatusColor = (status: WalletQueueItem['balanceStatus']) => {
    switch (status) {
      case 'high':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('✅') || status.includes('Ready')) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (status.includes('❌') || status.includes('Failed')) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    } else if (status.includes('⚠️') || status.includes('Warning')) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    } else {
      return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card title="Wallet Queue" subtitle="Loading wallet queue...">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded mb-2"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Wallet Queue" 
      subtitle={`${filteredWallets.length} wallets • Sorted by ${sortField}`}
    >
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search wallets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Status</option>
            <option value="Ready">Ready</option>
            <option value="Waiting">Waiting</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th 
                onClick={() => handleSort('nextExecutionTime')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Next Execution</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Wallet
              </th>
              <th 
                onClick={() => handleSort('type')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Type</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('balance')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Balance</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('status')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('progress')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Progress</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedWallets.map((wallet) => (
              <tr key={wallet.walletId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {wallet.timeUntilNext ? (
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {wallet.timeUntilNext}
                        </div>
                        {wallet.nextExecutionTime && (
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {new Date(wallet.nextExecutionTime).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Not scheduled</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Wallet className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                        {wallet.shortAddress}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {wallet.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {parseFloat(wallet.balance).toFixed(4)} SOL
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBalanceStatusColor(wallet.balanceStatus)}`}>
                      {wallet.balanceStatus}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(wallet.status)}
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {wallet.status}
                    </span>
                  </div>
                  {wallet.lastResult && !wallet.lastResult.success && wallet.lastResult.error && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {wallet.lastResult.error}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {wallet.progress}
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: wallet.progress }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredWallets.length)} of {filteredWallets.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {filteredWallets.length === 0 && (
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No wallets found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {searchTerm || filterStatus ? 'Try adjusting your filters' : 'Add wallets to this process to get started'}
          </p>
        </div>
      )}
    </Card>
  );
};
