import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { 
  Monitor, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Activity, 
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { SummaryCards } from './SummaryCards';
import { AlertBanner } from './AlertBanner';
import { UpcomingExecutions } from './UpcomingExecutions';
import { RecentTransactions } from './RecentTransactions';
import { WalletQueueTable } from './WalletQueueTable';
import { 
  useQueueLive, 
  useCountdownTimers, 
  useDashboardAutoRefresh,
  useAlertManager 
} from '../../hooks/useQueueMonitoring';
import { QueueLiveResponse } from '../../types/monitoring';

interface MonitoringDashboardProps {
  processId: string;
  processName: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  processId,
  processName,
  isVisible = true,
  onToggleVisibility
}) => {
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
  // Hooks
  const { 
    data: liveData, 
    isLoading, 
    error, 
    isLiveMode, 
    startLiveMode, 
    stopLiveMode,
    refetch 
  } = useQueueLive(processId, true);
  
  const { 
    isAutoRefreshing, 
    refreshAll, 
    startAutoRefresh, 
    stopAutoRefresh 
  } = useDashboardAutoRefresh(processId, true, 30000);
  
  const { 
    dismissAlert, 
    filterAlerts 
  } = useAlertManager();

  // Update countdown timers for upcoming executions
  const upcomingWithTimers = useCountdownTimers(liveData?.dashboard?.upcomingExecutions || []);

  // Update last update time when data changes
  useEffect(() => {
    if (liveData) {
      setLastUpdateTime(new Date());
    }
  }, [liveData]);

  const handleRefresh = () => {
    refetch();
    refreshAll();
    setLastUpdateTime(new Date());
  };

  const handleToggleLiveMode = () => {
    if (isLiveMode) {
      stopLiveMode();
      stopAutoRefresh();
    } else {
      startLiveMode();
      startAutoRefresh();
    }
  };

  if (!isVisible) {
    return null;
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Monitoring Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || 'Unable to fetch monitoring data'}
          </p>
          <Button variant="primary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const filteredAlerts = liveData ? filterAlerts(liveData.dashboard?.alerts || []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Monitor className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Live Monitoring Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {processName} • Real-time trading queue status
            </p>
          </div>
          {isLiveMode && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">LIVE</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Connection Status */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
            !error 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {!error ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{!error ? 'Connected' : 'Disconnected'}</span>
          </div>

          {/* Last Update Time */}
          <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
            Last update: {lastUpdateTime.toLocaleTimeString()}
          </div>

          {/* Controls */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>

          <Button
            variant={isLiveMode ? "primary" : "secondary"}
            size="sm"
            onClick={handleToggleLiveMode}
          >
            <Activity className="w-4 h-4 mr-1" />
            {isLiveMode ? 'Stop Live' : 'Start Live'}
          </Button>

          {onToggleVisibility && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleVisibility}
            >
              <EyeOff className="w-4 h-4 mr-1" />
              Hide
            </Button>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {filteredAlerts.length > 0 && (
        <AlertBanner 
          alerts={filteredAlerts} 
          onDismiss={dismissAlert}
        />
      )}

      {/* Summary Cards */}
      <SummaryCards 
        stats={liveData?.stats || { total: 0, ready: 0, waiting: 0, paused: 0, lowBalance: 0 }}
        performance={liveData?.dashboard?.performance}
        isLoading={isLoading}
      />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming Executions */}
        <UpcomingExecutions 
          executions={upcomingWithTimers}
          isLoading={isLoading}
        />

        {/* Recent Transactions */}
        <RecentTransactions 
          transactions={liveData?.dashboard?.recentTransactions || []}
          isLoading={isLoading}
        />
      </div>

      {/* Performance Metrics */}
      {liveData?.dashboard?.performance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {liveData.dashboard.performance.successRate}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {liveData.dashboard.performance.totalTransactions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {liveData.dashboard.performance.commonErrors.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Error Types</div>
            </div>
          </Card>
        </div>
      )}

      {/* Common Errors */}
      {liveData?.dashboard?.performance?.commonErrors && liveData.dashboard.performance.commonErrors.length > 0 && (
        <Card title="Common Errors" subtitle="Most frequent error types">
          <div className="space-y-3">
            {liveData.dashboard.performance.commonErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {error.error.replace(/_/g, ' ')}
                  </div>
                  {error.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {error.description}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">
                    {error.count}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    occurrences
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Wallet Queue Table */}
      <WalletQueueTable 
        wallets={liveData?.wallets || []}
        isLoading={isLoading}
      />
    </div>
  );
};
