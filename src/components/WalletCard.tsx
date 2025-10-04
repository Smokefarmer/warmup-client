import React from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { CopyButton } from './common/CopyButton';
import { StatusBadge } from './common/StatusBadge';
import { WalletManagementActions } from './WalletManagementActions';
import { IWarmUpWallet } from '../types/wallet';
import { formatWalletBalance, formatAddress } from '../utils/formatters';
import { Wallet, Send, CheckCircle, XCircle } from 'lucide-react';

interface WalletCardProps {
  wallet: IWarmUpWallet;
  isSelected: boolean;
  isAvailable: boolean;
  onSelect: (walletId: string) => void;
  onFund: (wallet: IWarmUpWallet) => void;
  showCheckbox?: boolean;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  isSelected,
  isAvailable,
  onSelect,
  onFund,
  showCheckbox = true
}) => {
  const handleCardClick = () => {
    if (showCheckbox) {
      onSelect(wallet._id);
    }
  };

  const handleFundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAvailable) {
      onFund(wallet);
    }
  };

  return (
    <div
      className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
          : isAvailable
          ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
          : 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 opacity-75'
      }`}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      {showCheckbox && (
        <div className="absolute top-3 right-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(wallet._id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Wallet Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
              {formatAddress(wallet.address)}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <CopyButton text={wallet.address} size="sm" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Type: {wallet.type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Details */}
      <div className="space-y-2 mb-4">
        {/* Balance */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Balance:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatWalletBalance(wallet.nativeTokenBalance || '0', wallet.chainId)}
          </span>
        </div>

        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
          <StatusBadge status={wallet.status} />
        </div>

        {/* Availability Indicator */}
        {!isAvailable && (
          <div className="flex items-center space-x-1 text-xs">
            <XCircle className="w-3 h-3 text-yellow-500" />
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              Not Available
            </span>
          </div>
        )}

        {/* Process Indicator */}
        {wallet.warmupProcessId && (
          <div className="flex items-center space-x-1 text-xs">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              In Warmup Process
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Button
            variant="primary"
            size="sm"
            onClick={handleFundClick}
            disabled={!isAvailable}
            className="flex-1 mr-2"
          >
            <Send className="w-3 h-3 mr-1" />
            Fund
          </Button>

          {isSelected && (
            <CheckCircle className="w-4 h-4 text-primary-600" />
          )}
        </div>

        {/* Wallet Management Actions */}
        <WalletManagementActions 
          wallet={wallet} 
          size="sm" 
          showLabels={false}
        />
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
};
