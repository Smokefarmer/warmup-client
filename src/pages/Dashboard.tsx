import React from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useWalletStatistics } from '../hooks/useWallets';
import { useGlobalWarmupStatistics } from '../hooks/useWarmupProcesses';
import { useFundingStatistics } from '../hooks/useFunding';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';
import { 
  Wallet, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Users, 
  Clock,
  Play,
  Plus,
  Zap
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: walletStats, isLoading: walletStatsLoading } = useWalletStatistics();
  const { data: warmupStats, isLoading: warmupStatsLoading } = useGlobalWarmupStatistics();
  const { data: fundingStats, isLoading: fundingStatsLoading } = useFundingStatistics();

  const isLoading = walletStatsLoading || warmupStatsLoading || fundingStatsLoading;

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your wallet warmup operations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            Create Wallet
          </Button>
          <Button variant="success" size="md">
            <Play className="w-4 h-4 mr-2" />
            Start Process
          </Button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Wallets */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Wallets</p>
              <p className="text-2xl font-semibold text-gray-900">
                {walletStats?.totalWallets || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Active Processes */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Processes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {warmupStats?.activeWallets || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Total Volume */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Volume</p>
              <p className="text-2xl font-semibold text-gray-900">
                {warmupStats?.totalVolume ? formatCurrency(warmupStats.totalVolume) : '0 ETH'}
              </p>
            </div>
          </div>
        </Card>

        {/* Success Rate */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-info-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-info-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {warmupStats?.successRate ? formatPercentage(warmupStats.successRate) : '0%'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card title="Recent Activity" subtitle="Latest wallet operations">
          <div className="space-y-4">
            {walletStats?.recentTransactions?.slice(0, 5).map((tx: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success-500 rounded-full mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.type} - {tx.walletAddress?.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-500">{tx.timestamp}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
            {(!walletStats?.recentTransactions || walletStats.recentTransactions.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card title="Quick Stats" subtitle="Performance overview">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Transactions</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(warmupStats?.totalTransactions || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Transaction Time</span>
              <span className="text-sm font-medium text-gray-900">
                {warmupStats?.averageTransactionTime ? 
                  `${Math.round(warmupStats.averageTransactionTime)}s` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Profit/Loss</span>
              <span className={`text-sm font-medium ${
                (warmupStats?.totalProfitLoss || 0n) >= 0n ? 'text-success-600' : 'text-danger-600'
              }`}>
                {warmupStats?.totalProfitLoss ? formatCurrency(warmupStats.totalProfitLoss) : '0 ETH'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Funded Wallets</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(fundingStats?.totalTransactions || 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card title="System Status" subtitle="Current system health">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded-full mr-3" />
            <span className="text-sm text-gray-900">API Server</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded-full mr-3" />
            <span className="text-sm text-gray-900">Database</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded-full mr-3" />
            <span className="text-sm text-gray-900">Blockchain Connection</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
