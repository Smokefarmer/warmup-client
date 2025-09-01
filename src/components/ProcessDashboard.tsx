import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { StatusBadge } from './common/StatusBadge';
import { 
  useWarmupProcess, 
  useWarmupProcessStatistics, 
  useStartWarmupProcess, 
  useStopWarmupProcess,
  useAddWalletsToProcess
} from '../hooks/useWarmupProcesses';
import { 
  useSystemHealth, 
  useProcessLiveMonitoring, 
  useConnectionStatus 
} from '../hooks/useMonitoring';
import { 
  SystemStatusCard, 
  MetricsDashboard, 
  EmergencyRecoveryCard, 
  ActivityFeed 
} from './monitoring';
import { formatDate, formatNumber, formatWalletBalance } from '../utils/formatters';
import { 
  Play, 
  Square, 
  Users, 
  Clock, 
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Settings,
  Monitor,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProcessDashboardProps {
  processId: string;
  onBack?: () => void;
}

export const ProcessDashboard: React.FC<ProcessDashboardProps> = ({
  processId,
  onBack
}) => {
  const [showAddWallets, setShowAddWallets] = useState(false);
  const [newWalletIds, setNewWalletIds] = useState('');
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);
  const [showMonitoring, setShowMonitoring] = useState(true);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);

  // Data hooks
  const { data: process, isLoading: processLoading, error: processError } = useWarmupProcess(processId);
  const { data: statistics, isLoading: statsLoading, refetch: refetchStats } = useWarmupProcessStatistics(processId);
  
  // Monitoring hooks
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth(30000);
  const { isFullyConnected } = useConnectionStatus();
  const { 
    liveStats, 
    isMonitoring: isProcessMonitoring, 
    startLiveMonitoring, 
    stopLiveMonitoring 
  } = useProcessLiveMonitoring(processId, isLiveMonitoring);
  
  // Mutation hooks
  const startProcessMutation = useStartWarmupProcess();
  const stopProcessMutation = useStopWarmupProcess();
  const addWalletsMutation = useAddWalletsToProcess();

  // Auto-refresh statistics for active processes
  useEffect(() => {
    if (process?.status === 'running' || process?.status === 'in_progress') {
      const interval = setInterval(() => {
        refetchStats();
      }, 5000); // Refresh every 5 seconds
      
      setMonitoringInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        setMonitoringInterval(null);
      }
    }
  }, [process?.status, refetchStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  const handleStartProcess = async () => {
    try {
      await startProcessMutation.mutateAsync(processId);
      toast.success('Process started successfully!');
    } catch (error: any) {
      toast.error(`Failed to start process: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStopProcess = async () => {
    try {
      await stopProcessMutation.mutateAsync(processId);
      toast.success('Process stopped successfully!');
    } catch (error: any) {
      toast.error(`Failed to stop process: ${error.message || 'Unknown error'}`);
    }
  };



  const handleAddWallets = async () => {
    if (!newWalletIds.trim()) {
      toast.error('Please enter wallet IDs');
      return;
    }

    const walletIds = newWalletIds.split(',').map(id => id.trim()).filter(id => id);
    
    if (walletIds.length === 0) {
      toast.error('Please enter valid wallet IDs');
      return;
    }

    try {
      await addWalletsMutation.mutateAsync({ id: processId, walletIds });
      toast.success(`Added ${walletIds.length} wallet(s) to process`);
      setNewWalletIds('');
      setShowAddWallets(false);
    } catch (error: any) {
      toast.error(`Failed to add wallets: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRefresh = () => {
    refetchStats();
    refetchHealth();
    toast.success('Data refreshed');
  };

  if (processLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (processError || !process) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Process
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {processError?.message || 'Failed to load process data'}
          </p>
          {onBack && (
            <Button variant="primary" onClick={onBack}>
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isActive = process.status === 'running' || process.status === 'in_progress';
  const isPending = process.status === 'pending';
  const isCompleted = process.status === 'completed';
  const isStopped = process.status === 'stopped';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="secondary" onClick={onBack}>
              ← Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {process.name}
            </h1>
            {process.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {process.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 lg:space-x-3">
          {/* Connection Status Indicator */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
            isFullyConnected 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isFullyConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{isFullyConnected ? 'Connected' : 'Offline'}</span>
          </div>

          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={statsLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          {/* Live Monitoring Toggle */}
          <Button
            variant={isLiveMonitoring ? "primary" : "secondary"}
            onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
            disabled={!isFullyConnected}
          >
            <Monitor className="w-4 h-4 mr-2" />
            {isLiveMonitoring ? 'Stop Live Feed' : 'Start Live Feed'}
          </Button>

          {/* Show/Hide Monitoring Dashboard */}
          <Button
            variant="secondary"
            onClick={() => setShowMonitoring(!showMonitoring)}
          >
            {showMonitoring ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showMonitoring ? 'Hide Monitoring' : 'Show Monitoring'}
          </Button>
          
          {(isPending || isStopped || isCompleted) && (
            <Button
              variant="success"
              onClick={handleStartProcess}
              loading={startProcessMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Process
            </Button>
          )}
          
          {(isActive || process.status === 'in_progress') && (
            <Button
              variant="warning"
              onClick={handleStopProcess}
              loading={stopProcessMutation.isPending}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Process
            </Button>
          )}
          
          <Button
            variant="secondary"
            onClick={() => setShowAddWallets(!showAddWallets)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Wallets
          </Button>
        </div>
      </div>

      {/* Add Wallets Section */}
      {showAddWallets && (
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Add Wallets to Process
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wallet IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={newWalletIds}
                  onChange={(e) => setNewWalletIds(e.target.value)}
                  placeholder="wallet-id-1, wallet-id-2, wallet-id-3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={handleAddWallets}
                  loading={addWalletsMutation.isPending}
                  disabled={!newWalletIds.trim()}
                >
                  Add Wallets
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Process Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="w-8 h-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
              <div className="flex items-center mt-1">
                <StatusBadge status={process.status} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Wallets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {process.walletIds?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {process.completedWallets || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(process.createdAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Statistics */}
      {statistics && (
        <Card title="Process Statistics" subtitle="Real-time process performance">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.activeWallets || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Wallets</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.totalTransactions || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mx-auto mb-3">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.successRate ? `${(statistics.successRate * 100).toFixed(1)}%` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg mx-auto mb-3">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.averageTransactionTime ? `${statistics.averageTransactionTime.toFixed(1)}s` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Transaction Time</p>
            </div>
          </div>

          {/* Progress Bar */}
          {process.walletIds && process.walletIds.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {process.completedWallets || 0} / {process.walletIds.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${process.walletIds.length > 0 ? ((process.completedWallets || 0) / process.walletIds.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Process Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card title="Configuration" subtitle="Process settings and parameters">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Concurrent Wallets</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {process.configuration?.maxConcurrentWallets || 'Default'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <StatusBadge status={process.status} />
                </p>
              </div>
            </div>
            
            {process.progress && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Progress Details</h4>
                <div className="space-y-2">
                  {process.progress.startTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Started:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(process.progress.startTime)}
                      </span>
                    </div>
                  )}
                  {process.progress.estimatedCompletion && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Estimated Completion:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(process.progress.estimatedCompletion)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Current Wallet Index:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {process.progress.currentWalletIndex || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Timeline */}
        <Card title="Timeline" subtitle="Process events and milestones">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Process Created</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(process.createdAt)}
                </p>
              </div>
            </div>

            {process.startedAt && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Process Started</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(process.startedAt)}
                  </p>
                </div>
              </div>
            )}

            {process.completedAt && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Process Completed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(process.completedAt)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Last Updated</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(process.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Monitoring Dashboard */}
      {showMonitoring && systemHealth && (
        <div className="monitoring-section space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Monitor className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Live Monitoring Dashboard
            </h2>
            {isLiveMonitoring && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">LIVE</span>
              </div>
            )}
          </div>

          {/* Monitoring Dashboard Grid */}
          <div className="dashboard-grid grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* System Status */}
            <SystemStatusCard 
              health={systemHealth} 
              lastUpdate={new Date()}
              isConnected={isFullyConnected}
            />
            
            {/* Emergency Recovery */}
            <EmergencyRecoveryCard 
              emergencyRecovery={systemHealth.emergencyRecovery}
              recentActivity={systemHealth.recentActivity}
            />
          </div>

          {/* Metrics Dashboard */}
          <MetricsDashboard health={systemHealth} />

          {/* Activity Feed */}
          <ActivityFeed 
            recentActivity={systemHealth.recentActivity}
            isLive={isLiveMonitoring}
            onRefresh={() => {
              refetchHealth();
              refetchStats();
            }}
          />
        </div>
      )}

      {/* Wallet List */}
      {process.wallets && process.wallets.length > 0 && (
        <Card title="Process Wallets" subtitle={`${process.wallets.length} wallets in this process`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {process.wallets.map((wallet) => (
                  <tr key={wallet._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {wallet?.address?.slice(0, 8) || 'N/A'}...{wallet?.address?.slice(-6) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {wallet.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatWalletBalance(wallet.nativeTokenBalance || '0', wallet.chainId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={wallet.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
