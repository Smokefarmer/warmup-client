import React from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { CopyButton } from './common/CopyButton';
import { StatusBadge } from './common/StatusBadge';
import { FunderStatus } from '../types/funding';
import { WalletStatus } from '../types/wallet';
import { formatCurrency, formatAddress } from '../utils/formatters';
import { RefreshCw, Wallet, CheckCircle, XCircle } from 'lucide-react';

interface FunderStatusCardProps {
  funderStatus: FunderStatus | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export const FunderStatusCard: React.FC<FunderStatusCardProps> = ({
  funderStatus,
  isLoading,
  onRefresh
}) => {
  if (isLoading) {
    return (
      <Card title="Funder Status" subtitle="Current funding source">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!funderStatus) {
    return (
      <Card title="Funder Status" subtitle="Current funding source">
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Unable to load funder status</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Funder Status" subtitle="Current funding source">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Funder Address */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Funder Address</p>
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
              {formatAddress(funderStatus.funderAddress)}
            </p>
            <CopyButton text={funderStatus.funderAddress} size="sm" />
          </div>
        </div>

        {/* Balance */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Balance</p>
          <div className="flex items-center space-x-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(funderStatus.balance)}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              className="p-1"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Availability Status</p>
          <div className="flex items-center space-x-2">
            {funderStatus.available ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <StatusBadge 
              status={funderStatus.available ? WalletStatus.ACTIVE : WalletStatus.PAUSED} 
            />
          </div>
        </div>
      </div>

      {/* Status Details */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </span>
            <span className={`text-sm ${
              funderStatus.available 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {funderStatus.available ? 'Available for funding' : 'Not available for funding'}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Auto-refreshes every 30s
          </div>
        </div>
      </div>
    </Card>
  );
};
