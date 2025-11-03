import React from 'react';
import { X, Loader2, CheckCircle, XCircle, Trash2, Send } from 'lucide-react';

interface CleanupProgress {
  current: number;
  total: number;
  currentWallet?: string;
  currentAction?: 'selling' | 'sending' | 'complete' | 'error';
  successCount?: number;
  failCount?: number;
  errors?: string[];
}

interface BulkCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: CleanupProgress;
  operation: 'sell' | 'sendBack' | 'full';
}

export const BulkCleanupModal: React.FC<BulkCleanupModalProps> = ({
  isOpen,
  onClose,
  progress,
  operation,
}) => {
  if (!isOpen) return null;

  const isComplete = progress.current >= progress.total;
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const getOperationTitle = () => {
    switch (operation) {
      case 'sell':
        return '🔥 Selling All Tokens';
      case 'sendBack':
        return '💸 Sending Funds Back to Funder';
      case 'full':
        return '🧹 Full Cleanup (Sell + Send)';
      default:
        return 'Processing Wallets';
    }
  };

  const getCurrentActionText = () => {
    if (isComplete) {
      return 'Cleanup Complete!';
    }

    switch (progress.currentAction) {
      case 'selling':
        return '🔥 Selling tokens...';
      case 'sending':
        return '💸 Sending funds back...';
      case 'error':
        return '❌ Error occurred';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    if (isComplete) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }

    if (progress.currentAction === 'error') {
      return <XCircle className="w-6 h-6 text-red-500" />;
    }

    return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" 
          aria-hidden="true"
          onClick={isComplete ? onClose : undefined}
        />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {getOperationTitle()}
              </h3>
            </div>
            {isComplete && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span className="font-medium">
                {progress.current} / {progress.total} wallets
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isComplete
                    ? 'bg-green-500'
                    : progress.currentAction === 'error'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              >
                <div className="h-full bg-white opacity-20 animate-pulse" />
              </div>
            </div>
            <div className="mt-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
              {progressPercent.toFixed(1)}%
            </div>
          </div>

          {/* Current Wallet Info */}
          {!isComplete && progress.currentWallet && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                    {getCurrentActionText()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                    Wallet: {progress.currentWallet}
                  </p>
                </div>
                {progress.currentAction === 'selling' && (
                  <Trash2 className="w-6 h-6 text-blue-500 animate-pulse" />
                )}
                {progress.currentAction === 'sending' && (
                  <Send className="w-6 h-6 text-blue-500 animate-pulse" />
                )}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    Successful
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {progress.successCount || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    Failed
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {progress.failCount || 0}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Errors List (if any) */}
          {progress.errors && progress.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                Errors ({progress.errors.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {progress.errors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-xs text-red-700 dark:text-red-400 font-mono">
                    • {error}
                  </p>
                ))}
                {progress.errors.length > 10 && (
                  <p className="text-xs text-red-600 dark:text-red-400 italic">
                    ... and {progress.errors.length - 10} more errors
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                All Done! 🎉
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Processed {progress.total} wallets successfully
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {isComplete && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Warning for in-progress */}
          {!isComplete && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ⚠️ Please don't close this window. Processing {progress.total} wallets...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

