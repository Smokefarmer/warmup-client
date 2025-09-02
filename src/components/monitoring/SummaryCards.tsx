import React from 'react';
import { Card } from '../common/Card';
import { 
  Users, 
  Clock, 
  Play, 
  Pause, 
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle 
} from 'lucide-react';

interface SummaryCardsProps {
  stats: {
    total: number;
    ready: number;
    waiting: number;
    paused: number;
    lowBalance: number;
  };
  performance?: {
    successRate: string;
    totalTransactions: number;
  };
  isLoading?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  stats, 
  performance,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Wallets */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Wallets</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.total.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Ready to Trade */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ready to Trade</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.ready.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Waiting */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Waiting</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.waiting.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Low Balance Alert */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              stats.lowBalance > 0 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                stats.lowBalance > 0 ? 'text-red-600' : 'text-gray-400'
              }`} />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Balance</p>
            <p className={`text-2xl font-bold ${
              stats.lowBalance > 0 ? 'text-red-600' : 'text-gray-400'
            }`}>
              {stats.lowBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Cards - if available */}
      {performance && (
        <>
          <Card className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {performance.successRate}
                </p>
              </div>
            </div>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {performance.totalTransactions.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
