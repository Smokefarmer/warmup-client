import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { AnalyticsService, AnalyticsData } from '../services/analyticsService';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap, 
  Activity,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Server,
  Database,
  Wifi
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  color?: 'green' | 'red' | 'blue' | 'purple' | 'yellow';
  icon?: React.ReactNode;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend = 'stable', 
  color = 'blue',
  icon,
  subtitle
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'red':
        return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      case 'purple':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            {getTrendIcon()}
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses()}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [analyticsData, healthData] = await Promise.all([
        AnalyticsService.getAnalytics(),
        AnalyticsService.getSystemHealth()
      ]);
      
      setAnalytics(analyticsData);
      setSystemHealth(healthData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case 'degraded':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
    }
  };

  const getHealthLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'degraded':
        return 'Degraded';
      default:
        return 'Down';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Failed to load analytics</p>
          <Button variant="secondary" onClick={fetchAnalytics} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              📈 Analytics Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAnalytics}
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate"
          value={analytics.efficiency.successRate}
          trend="up"
          color="green"
          icon={<Target className="w-5 h-5" />}
        />
        <MetricCard
          title="Total Plans"
          value={analytics.overview.totalPlans}
          trend="stable"
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          title="SOL Spent"
          value={`${analytics.overview.totalSolSpent} SOL`}
          trend="up"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Cost Efficiency"
          value={`${analytics.efficiency.costPerWallet} SOL`}
          trend="down"
          color="green"
          icon={<Zap className="w-5 h-5" />}
          subtitle="per wallet"
        />
      </div>

      {/* Method Comparison */}
      <Card title="Funding Method Comparison" className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Performance by Method
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center mb-3">
              <Zap className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-600">Direct Transfer</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Count:</span>
                <span className="font-medium">{analytics.fundingMethods.directTransfer.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Cost:</span>
                <span className="font-medium">{analytics.fundingMethods.directTransfer.averageCost} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                <span className="font-medium text-green-600">{analytics.fundingMethods.directTransfer.successRate}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
              • Lower cost (~0.005 SOL)<br />
              • Faster execution<br />
              • Visible as SOL transfers
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center mb-3">
              <Target className="w-5 h-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-purple-600">WSOL Clean Funds</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Count:</span>
                <span className="font-medium">{analytics.fundingMethods.wsolCleanFunds.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Cost:</span>
                <span className="font-medium">{analytics.fundingMethods.wsolCleanFunds.averageCost} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                <span className="font-medium text-green-600">{analytics.fundingMethods.wsolCleanFunds.successRate}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-600 dark:text-purple-400">
              • Higher cost (~0.01 SOL)<br />
              • Enhanced privacy<br />
              • Appears as token transfers
            </div>
          </div>
        </div>
      </Card>

      {/* System Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card title="System Status" subtitle="Current system health" className="p-6">
          {systemHealth ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Server className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">API Server</span>
                </div>
                <div className="flex items-center">
                  {getHealthIcon(systemHealth.apiServer)}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {getHealthLabel(systemHealth.apiServer)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Database</span>
                </div>
                <div className="flex items-center">
                  {getHealthIcon(systemHealth.database)}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {getHealthLabel(systemHealth.database)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wifi className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Blockchain Connection</span>
                </div>
                <div className="flex items-center">
                  {getHealthIcon(systemHealth.blockchain)}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {getHealthLabel(systemHealth.blockchain)}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last checked: {new Date(systemHealth.lastChecked).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity" subtitle="Latest operations" className="p-6">
          <div className="space-y-3">
            {analytics.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={activity.id || index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.walletsAffected} wallets
                  </p>
                  {activity.amount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.amount} SOL
                    </p>
                  )}
                </div>
              </div>
            ))}
            {analytics.recentActivity.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card title="Performance Overview" subtitle="Key system metrics" className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analytics.performanceMetrics.totalTransactions.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analytics.performanceMetrics.totalVolume} SOL
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analytics.performanceMetrics.errorRate}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics.performanceMetrics.uptime}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Uptime</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
