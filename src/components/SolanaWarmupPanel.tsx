import React, { useState } from 'react';
import { useSolanaWarmup } from '../hooks/useSolanaWarmup';
import { SolanaWarmupConfiguration } from '../services/solanaWarmupService';
import { ChainId } from '../types/wallet';

export const SolanaWarmupPanel: React.FC = () => {
  const [walletCount, setWalletCount] = useState(5);
  const [processName, setProcessName] = useState('Solana Multi-Strategy Warmup');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [customConfig, setCustomConfig] = useState<Partial<SolanaWarmupConfiguration>>({
    maxConcurrentWallets: 5,
    transactionInterval: 30,
    maxTransactionsPerWallet: 10,
    minTransactionAmount: '0.001',
    maxTransactionAmount: '0.01'
  });

  const {
    currentProcessId,
    isMonitoring,
    isCreating,
    isStarting,
    isStopping,
    isGeneratingWallets,
    processStats,
    transactionLogs,
    isLoading,
    error,
    setupAndStartWarmup,
    startProcess,
    stopProcess,
    stopMonitoring
  } = useSolanaWarmup({
    onProgress: (stats) => {
      console.log('Progress update:', stats);
    },
    onComplete: (finalStats) => {
      console.log('Process completed:', finalStats);
    },
    onError: (error) => {
      console.error('Process error:', error);
    }
  });

  const handleStartWarmup = async () => {
    try {
      await setupAndStartWarmup({
        walletCount,
        processName,
        customConfig: showAdvancedConfig ? customConfig : undefined,
        chainId: ChainId.SOLANA_DEVNET
      });
    } catch (error) {
      console.error('Failed to start warmup:', error);
    }
  };

  const handleStopWarmup = () => {
    if (currentProcessId) {
      stopProcess(currentProcessId);
      stopMonitoring();
    }
  };



  const updateConfig = (key: keyof SolanaWarmupConfiguration, value: any) => {
    setCustomConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getProgressPercentage = () => {
    if (!processStats) return 0;
    return (processStats.completedWallets / processStats.totalWallets) * 100;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Solana Warmup Process
        </h2>

        {/* Configuration Section */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Process Name
              </label>
              <input
                type="text"
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter process name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Wallets
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={walletCount}
                onChange={(e) => setWalletCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              {showAdvancedConfig ? 'Hide' : 'Show'} Advanced Configuration
            </button>
          </div>

          {showAdvancedConfig && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Advanced Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Concurrent Wallets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={customConfig.maxConcurrentWallets}
                    onChange={(e) => updateConfig('maxConcurrentWallets', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transaction Interval (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={customConfig.transactionInterval}
                    onChange={(e) => updateConfig('transactionInterval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Transactions per Wallet
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customConfig.maxTransactionsPerWallet}
                    onChange={(e) => updateConfig('maxTransactionsPerWallet', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Transaction Amount (SOL)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={customConfig.minTransactionAmount}
                    onChange={(e) => updateConfig('minTransactionAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Transaction Amount (SOL)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={customConfig.maxTransactionAmount}
                    onChange={(e) => updateConfig('maxTransactionAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleStartWarmup}
            disabled={isCreating || isStarting || isGeneratingWallets}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating || isStarting || isGeneratingWallets ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting...
              </span>
            ) : (
              'Start Warmup Process'
            )}
          </button>

          {currentProcessId && (
            <button
              onClick={handleStopWarmup}
              disabled={isStopping}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStopping ? 'Stopping...' : 'Stop Process'}
            </button>
          )}
        </div>
      </div>

      {/* Progress Section */}
      {currentProcessId && processStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Process Progress
          </h3>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{getProgressPercentage().toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {processStats.totalWallets}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Wallets</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {processStats.completedWallets}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {processStats.failedWallets}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {(processStats.successRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
            </div>

            {/* Solana-specific stats */}
            {processStats.solanaSpecific && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
                  Solana Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      {processStats.solanaSpecific.totalSOLVolume} SOL
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-300">Total Volume</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      {processStats.solanaSpecific.successfulTransactions}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-300">Successful TXs</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      {processStats.solanaSpecific.averageTransactionTime.toFixed(2)}s
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-300">Avg TX Time</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error occurred
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error.message || 'An unexpected error occurred'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Logs */}
      {transactionLogs && transactionLogs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactionLogs.slice(0, 10).map((tx: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                      {tx.hash ? `${tx.hash?.slice(0, 8) || 'N/A'}...${tx.hash?.slice(-8) || 'N/A'}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        tx.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {tx.amount || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
