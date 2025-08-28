import React from 'react';
import { Card } from '../common/Card';
import { SystemHealth } from '../../services/monitoringService';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle,
  Target
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend
}) => {
  const colorClasses = {
    green: 'border-green-500 bg-green-50 dark:bg-green-900/10',
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/10',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
    red: 'border-red-500 bg-red-50 dark:bg-red-900/10',
    gray: 'border-gray-500 bg-gray-50 dark:bg-gray-900/10'
  };

  const iconColorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  };

  return (
    <Card className={`metric-card border-l-4 ${colorClasses[color]} transition-all duration-200 hover:shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`${iconColorClasses[color]}`}>
              {icon}
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </h3>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            {trend && (
              <div className={`flex items-center text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`} />
                <span className="ml-1">{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

interface MetricsDashboardProps {
  health: SystemHealth;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ health }) => {
  const getSuccessRateColor = (rate: number): 'green' | 'orange' | 'red' => {
    if (rate >= 0.9) return 'green';
    if (rate >= 0.7) return 'orange';
    return 'red';
  };

  const getLowBalanceColor = (count: number): 'green' | 'orange' | 'red' => {
    if (count === 0) return 'green';
    if (count <= 3) return 'orange';
    return 'red';
  };

  return (
    <div className="metrics-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Wallets */}
        <MetricCard
          title="Total Wallets"
          value={health.statistics.totalWallets}
          subtitle={`${health.statistics.activeWallets} active`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />

        {/* Success Rate */}
        <MetricCard
          title="Success Rate"
          value={`${(health.statistics.successRate * 100).toFixed(1)}%`}
          subtitle="Overall performance"
          icon={<Target className="w-6 h-6" />}
          color={getSuccessRateColor(health.statistics.successRate)}
        />

        {/* Total Balance */}
        <MetricCard
          title="Total Balance"
          value={health.balances.totalBalance}
          subtitle={`Funder: ${health.balances.funderBalance}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
        />

        {/* Low Balance Alerts */}
        <MetricCard
          title="Low Balance Alerts"
          value={health.balances.lowBalanceWallets}
          subtitle={health.balances.lowBalanceWallets === 0 ? 'All wallets funded' : 'Wallets need funding'}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={getLowBalanceColor(health.balances.lowBalanceWallets)}
        />
      </div>

      {/* Extended Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* Active Processes */}
        <MetricCard
          title="Active Processes"
          value={health.statistics.activeProcesses}
          subtitle="Currently running"
          icon={<Activity className="w-6 h-6" />}
          color="green"
        />

        {/* Total Transactions */}
        <MetricCard
          title="Total Transactions"
          value={health.statistics.totalTransactions.toLocaleString()}
          subtitle="All time"
          icon={<CheckCircle className="w-6 h-6" />}
          color="blue"
        />

        {/* Recent Activity (Last Hour) */}
        <MetricCard
          title="Last Hour Activity"
          value={health.recentActivity.lastHour.transactions}
          subtitle={`${health.recentActivity.lastHour.successfulTrades} successful`}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />

        {/* Emergency Recoveries */}
        <MetricCard
          title="Recovery Success"
          value={health.emergencyRecovery.totalAttempts > 0 
            ? `${((health.emergencyRecovery.successfulRecoveries / health.emergencyRecovery.totalAttempts) * 100).toFixed(1)}%`
            : 'N/A'
          }
          subtitle={`${health.emergencyRecovery.totalAttempts} attempts`}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={health.emergencyRecovery.failedRecoveries > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Strategy Performance */}
      {Object.keys(health.strategies).length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Strategy Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(health.strategies).map(([strategyName, data]) => (
              <Card key={strategyName} className="strategy-card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {strategyName}
                  </h4>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    data.successRate >= 0.8 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : data.successRate >= 0.6
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {(data.successRate * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Active Wallets:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {data.activeWallets}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Last Execution:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(data.lastExecution).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Success Rate Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        data.successRate >= 0.8 
                          ? 'bg-green-500'
                          : data.successRate >= 0.6
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${data.successRate * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
