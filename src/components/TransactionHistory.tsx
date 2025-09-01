import React from 'react';
import { Card } from './common/Card';
import { StatusBadge } from './common/StatusBadge';
import { CopyButton } from './common/CopyButton';
import { IFundingTransaction } from '../types/funding';
import { formatCurrency, formatDate, formatAddress } from '../utils/formatters';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  DollarSign
} from 'lucide-react';

interface TransactionHistoryProps {
  transactions: IFundingTransaction[] | undefined;
  isLoading: boolean;
  onRefresh?: () => void;
  maxItems?: number;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading,
  onRefresh,
  maxItems = 10
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getExplorerUrl = (txHash: string) => {
    // Base chain explorer
    return `https://basescan.org/tx/${txHash}`;
  };

  // Safely handle different data structures
  const getDisplayTransactions = () => {
    if (!transactions) return [];
    
    // If it's already an array, use it
    if (Array.isArray(transactions)) {
      return transactions.slice(0, maxItems);
    }
    
    // If it's an object with a transactions property
    if (transactions && typeof transactions === 'object' && 'transactions' in transactions) {
      const txArray = (transactions as any).transactions;
      if (Array.isArray(txArray)) {
        return txArray.slice(0, maxItems);
      }
    }
    
    // If it's an object with a data property
    if (transactions && typeof transactions === 'object' && 'data' in transactions) {
      const txArray = (transactions as any).data;
      if (Array.isArray(txArray)) {
        return txArray.slice(0, maxItems);
      }
    }
    
    // Fallback: try to convert to array if it's an object
    if (transactions && typeof transactions === 'object') {
      const txArray = Object.values(transactions);
      if (txArray.length > 0 && Array.isArray(txArray[0])) {
        return txArray[0].slice(0, maxItems);
      }
    }
    
    console.warn('TransactionHistory: Unexpected data structure:', transactions);
    return [];
  };

  if (isLoading) {
    return (
      <Card title="Transaction History" subtitle="Recent funding transactions">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const displayTransactions = getDisplayTransactions();

  return (
    <Card title="Transaction History" subtitle="Recent funding transactions">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {displayTransactions.length} recent transactions
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Transaction Hash */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(transaction.status)}
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {transaction.txHash ? 
                        `${transaction.txHash?.slice(0, 8) || 'N/A'}...${transaction.txHash?.slice(-6) || 'N/A'}` :
                        transaction.id?.slice(0, 8) || 'N/A'
                      }
                    </span>
                    {transaction.txHash && (
                      <>
                        <CopyButton text={transaction.txHash} size="sm" />
                        <a
                          href={getExplorerUrl(transaction.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {formatAddress(transaction.walletAddress)}
                  </span>
                  <CopyButton text={transaction.walletAddress} size="sm" />
                </div>
              </div>

              {/* Amount */}
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <StatusBadge status={transaction.status} />
                <span className={`text-xs ${getStatusColor(transaction.status)}`}>
                  {transaction.status === 'pending' && 'Processing...'}
                  {transaction.status === 'completed' && 'Confirmed'}
                  {transaction.status === 'failed' && 'Failed'}
                </span>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>
                  From: {formatAddress(transaction.fromAddress)}
                </span>
                <span>
                  {formatDate(transaction.createdAt)}
                </span>
              </div>
              
              {/* Completion Time */}
              {transaction.completedAt && transaction.status === 'completed' && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Completed: {formatDate(transaction.completedAt)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayTransactions.length === 0 && (
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No funding history</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Funding transactions will appear here once you start funding wallets
          </p>
        </div>
      )}

      {/* View More Link */}
      {transactions && transactions.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            View all {transactions.length} transactions
          </button>
        </div>
      )}
    </Card>
  );
};
