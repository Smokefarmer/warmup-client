import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { SystemHealth } from '../../services/monitoringService';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

interface ActivityFeedProps {
  recentActivity: SystemHealth['recentActivity'];
  isLive?: boolean;
  onRefresh?: () => void;
}

interface ActivityItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  details?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  recentActivity,
  isLive = false,
  onRefresh
}) => {
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(isLive);

  // Generate activity items from recent activity data
  useEffect(() => {
    const generateActivityItems = (): ActivityItem[] => {
      const items: ActivityItem[] = [];
      const now = new Date();

      // Recent successful trades
      if (recentActivity.lastHour.successfulTrades > 0) {
        items.push({
          id: 'success-trades-hour',
          type: 'success',
          message: `${recentActivity.lastHour.successfulTrades} successful trades completed`,
          timestamp: new Date(now.getTime() - Math.random() * 3600000), // Random time within last hour
          details: 'Trading operations executed successfully'
        });
      }

      // Failed trades
      if (recentActivity.lastHour.failedTrades > 0) {
        items.push({
          id: 'failed-trades-hour',
          type: 'error',
          message: `${recentActivity.lastHour.failedTrades} trades failed`,
          timestamp: new Date(now.getTime() - Math.random() * 3600000),
          details: 'Some trading operations encountered errors'
        });
      }

      // Emergency recoveries
      if (recentActivity.lastHour.emergencyRecoveries > 0) {
        items.push({
          id: 'emergency-recoveries-hour',
          type: 'warning',
          message: `${recentActivity.lastHour.emergencyRecoveries} emergency recoveries initiated`,
          timestamp: new Date(now.getTime() - Math.random() * 3600000),
          details: 'SOL recovery operations triggered'
        });
      }

      // Transaction volume updates
      if (recentActivity.lastHour.transactions > 0) {
        items.push({
          id: 'transaction-volume',
          type: 'info',
          message: `${recentActivity.lastHour.transactions} total transactions processed`,
          timestamp: new Date(now.getTime() - Math.random() * 1800000), // Random time within last 30 min
          details: 'Network activity summary'
        });
      }

      // 24-hour summary
      items.push({
        id: 'daily-summary',
        type: 'info',
        message: `Daily Summary: ${recentActivity.last24Hours.transactions} transactions, ${recentActivity.last24Hours.successfulTrades} successful`,
        timestamp: new Date(now.getTime() - Math.random() * 86400000), // Random time within last 24 hours
        details: '24-hour performance overview'
      });

      // Sort by timestamp (most recent first)
      return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    setActivityItems(generateActivityItems());
  }, [recentActivity]);

  // Auto-refresh simulation for live feed
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      // Simulate new activity by adding a random item
      const newItem: ActivityItem = {
        id: `live-${Date.now()}`,
        type: Math.random() > 0.7 ? 'success' : Math.random() > 0.5 ? 'info' : 'warning',
        message: `Live update: ${Math.floor(Math.random() * 10) + 1} new transactions`,
        timestamp: new Date(),
        details: 'Real-time activity update'
      };

      setActivityItems(prev => [newItem, ...prev.slice(0, 9)]); // Keep only latest 10 items
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <Card className="activity-feed">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Zap className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Live Activity Feed
          </h2>
          {isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isAutoRefresh
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            Auto-refresh {isAutoRefresh ? 'ON' : 'OFF'}
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="summary-card text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ArrowUpRight className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {recentActivity.lastHour.successfulTrades}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Successful (1h)</p>
        </div>

        <div className="summary-card text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ArrowDownRight className="w-4 h-4 text-red-600" />
            <span className="text-lg font-bold text-red-600">
              {recentActivity.lastHour.failedTrades}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Failed (1h)</p>
        </div>

        <div className="summary-card text-center p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-lg font-bold text-yellow-600">
              {recentActivity.lastHour.emergencyRecoveries}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Recoveries (1h)</p>
        </div>

        <div className="summary-card text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">
              {recentActivity.lastHour.transactions}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total (1h)</p>
        </div>
      </div>

      {/* Activity Items List */}
      <div className="activity-list space-y-3 max-h-96 overflow-y-auto">
        {activityItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity to display</p>
          </div>
        ) : (
          activityItems.map((item) => (
            <div
              key={item.id}
              className={`activity-item border-l-4 p-4 rounded-r-lg transition-all duration-200 hover:shadow-sm ${getActivityColor(item.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 ml-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                  {item.details && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live Feed Status */}
      {isLive && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live feed active - Updates every 15 seconds</span>
            </div>
            <span className="text-xs text-gray-400">
              Last update: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
