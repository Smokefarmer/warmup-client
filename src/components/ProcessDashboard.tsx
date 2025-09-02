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
  useConnectionStatus 
} from '../hooks/useMonitoring';
import { 
  MonitoringDashboard 
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

  // Data hooks
  const { data: process, isLoading: processLoading, error: processError } = useWarmupProcess(processId);
  const { data: statistics, isLoading: statsLoading, refetch: refetchStats } = useWarmupProcessStatistics(processId);
  
  // Connection status
  const { isFullyConnected } = useConnectionStatus();
  
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
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isActive 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : process.status === 'completed'
                  ? 'bg-blue-100 dark:bg-blue-900/20'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Activity className={`w-6 h-6 ${
                  isActive 
                    ? 'text-green-600' 
                    : process.status === 'completed'
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Process Status</p>
              <div className="flex items-center mt-1">
                <StatusBadge status={process.status} />
                {isActive && (
                  <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Wallets</p>
              <p className="text-2xl font-bold text-blue-600">
                {process.walletIds?.length || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {process.wallets ? `${process.wallets.length} loaded` : 'in queue'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {process.completedWallets || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {process.walletIds?.length 
                  ? `${((process.completedWallets || 0) / process.walletIds.length * 100).toFixed(1)}% done`
                  : 'ready to start'
                }
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Performance</p>
              <p className="text-2xl font-bold text-purple-600">
                {statistics?.successRate ? `${(statistics.successRate * 100).toFixed(1)}%` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {statistics?.totalTransactions ? `${statistics.totalTransactions} txns` : 'no data'}
              </p>
            </div>
          </div>
        </Card>
      </div>


      {/* Monitoring Dashboard */}
      {showMonitoring && (
        <MonitoringDashboard
          processId={processId}
          processName={process.name}
          isVisible={showMonitoring}
          onToggleVisibility={() => setShowMonitoring(false)}
        />
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
