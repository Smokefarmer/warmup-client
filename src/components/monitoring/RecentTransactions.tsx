import React from 'react';
import { Card } from '../common/Card';
import { CheckCircle, XCircle, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { RecentTransaction } from '../../types/monitoring';

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
  isLoading?: boolean;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  transactions, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card title="Recent Transactions" subtitle="Last 10 transactions">
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card title="Recent Transactions" subtitle="Last 10 transactions">
        <div className="text-center py-8">
          <ArrowRightLeft className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No recent transactions</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Transactions will appear here once trading starts
          </p>
        </div>
      </Card>
    );
  }

  const getActionIcon = (action: RecentTransaction['action']) => {
    switch (action) {
      case 'BUY':
        return TrendingUp;
      case 'SELL':
        return TrendingDown;
      case 'TRANSFER':
        return ArrowRightLeft;
      default:
        return ArrowRightLeft;
    }
  };

  const getActionColor = (action: RecentTransaction['action']) => {
    switch (action) {
      case 'BUY':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'SELL':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'TRANSFER':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <Card title="Recent Transactions" subtitle={`Last ${transactions.length} transactions`}>
      <div className="space-y-3">
        {transactions.map((transaction, index) => {
          const ActionIcon = getActionIcon(transaction.action);
          const actionColor = getActionColor(transaction.action);
          
          return (
            <div
              key={`${transaction.wallet}-${transaction.timestamp}-${index}`}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {transaction.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {transaction.wallet}
                  </p>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColor}`}>
                    <ActionIcon className="w-3 h-3 mr-1" />
                    {transaction.action}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {transaction.amount} SOL
                  </p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(transaction.timestamp).toLocaleTimeString()}
                  </p>
                  {transaction.txHash && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-blue-500 dark:text-blue-400 font-mono">
                        {transaction.txHash.slice(0, 8)}...
                      </p>
                    </>
                  )}
                </div>

                {/* Error Code */}
                {!transaction.success && transaction.errorCode && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      {transaction.errorCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center text-xs font-medium ${
                  transaction.success 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {transaction.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <div className="text-gray-500 dark:text-gray-400">
              Success Rate: {' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {((transactions.filter(t => t.success).length / transactions.length) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Total: {' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {transactions.length} transactions
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
