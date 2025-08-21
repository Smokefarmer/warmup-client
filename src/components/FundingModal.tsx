import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { IWarmUpWallet } from '../types/wallet';
import { formatCurrency, formatAddress } from '../utils/formatters';
import { 
  X, 
  Send, 
  DollarSign, 
  Wallet, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface FundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: IWarmUpWallet[];
  mode: 'single' | 'batch' | 'random';
  onSuccess: (result: any) => void;
  onFundSingle?: (walletId: string, amount: string) => Promise<any>;
  onFundBatch?: (walletIds: string[], amount: string) => Promise<any>;
  onFundRandom?: (walletIds: string[], minAmount: string, maxAmount: string) => Promise<any>;
  isLoading?: boolean;
  onModeChange?: (mode: 'single' | 'batch' | 'random') => void;
}

export const FundingModal: React.FC<FundingModalProps> = ({
  isOpen,
  onClose,
  wallets,
  mode,
  onSuccess,
  onFundSingle,
  onFundBatch,
  onFundRandom,
  isLoading = false,
  onModeChange
}) => {
  const [amount, setAmount] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [randomAmounts, setRandomAmounts] = useState<{[key: string]: string}>({});
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentMode, setCurrentMode] = useState<'single' | 'batch' | 'random'>(mode);

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setMinAmount('');
      setMaxAmount('');
      setRandomAmounts({});
      setShowPreview(false);
      setError('');
      setCurrentMode(mode);
    }
  }, [isOpen, mode]);

  // Handle mode change
  const handleModeChange = (newMode: 'single' | 'batch' | 'random') => {
    setCurrentMode(newMode);
    setAmount('');
    setMinAmount('');
    setMaxAmount('');
    setRandomAmounts({});
    setError('');
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  const generateRandomAmounts = () => {
    if (!minAmount || !maxAmount || wallets.length === 0) return;

    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    
    if (min >= max) {
      setError('Minimum amount must be less than maximum amount');
      return;
    }

    const amounts: {[key: string]: string} = {};
    wallets.forEach(wallet => {
      const randomAmount = (Math.random() * (max - min) + min).toFixed(6);
      amounts[wallet._id] = randomAmount;
    });

    setRandomAmounts(amounts);
    setError('');
  };

  const handleConfirm = async () => {
    setError('');

    try {
      let result;

      switch (currentMode) {
        case 'single':
          if (!amount || wallets.length !== 1) {
            setError('Please enter a valid amount');
            return;
          }
          if (onFundSingle) {
            result = await onFundSingle(wallets[0]._id, amount);
          }
          break;

        case 'batch':
          if (!amount || wallets.length === 0) {
            setError('Please enter a valid amount');
            return;
          }
          if (onFundBatch) {
            result = await onFundBatch(wallets.map(w => w._id), amount);
          }
          break;

        case 'random':
          if (!minAmount || !maxAmount || wallets.length === 0) {
            setError('Please enter valid min and max amounts');
            return;
          }
          if (onFundRandom) {
            result = await onFundRandom(wallets.map(w => w._id), minAmount, maxAmount);
          }
          break;
      }

      if (result) {
        onSuccess(result);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Funding failed');
    }
  };

  const getTotalAmount = () => {
    if (currentMode === 'random' && Object.keys(randomAmounts).length > 0) {
      return Object.values(randomAmounts).reduce((sum, amount) => sum + parseFloat(amount), 0);
    }
    if (currentMode === 'batch' && amount) {
      return parseFloat(amount) * wallets.length;
    }
    if (currentMode === 'single' && amount) {
      return parseFloat(amount);
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Fund Wallets
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentMode === 'single' && 'Fund a single wallet'}
              {currentMode === 'batch' && `Fund ${wallets.length} wallets with same amount`}
              {currentMode === 'random' && `Fund ${wallets.length} wallets with random amounts`}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={currentMode === 'single'}
                onChange={() => handleModeChange('single')}
                className="text-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Single</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={currentMode === 'batch'}
                onChange={() => handleModeChange('batch')}
                className="text-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Batch</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={currentMode === 'random'}
                onChange={() => handleModeChange('random')}
                className="text-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Random</span>
            </label>
          </div>

          {/* Amount Input */}
          {currentMode === 'single' || currentMode === 'batch' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Funding Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.001"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.002"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Random Amounts Preview */}
          {currentMode === 'random' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Random Amounts Preview
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={generateRandomAmounts}
                  disabled={!minAmount || !maxAmount}
                >
                  Generate Preview
                </Button>
              </div>
              
              {Object.keys(randomAmounts).length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {wallets.map(wallet => (
                    <div key={wallet._id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-mono">
                        {formatAddress(wallet.address)}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {randomAmounts[wallet._id]} ETH
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Wallets */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Selected Wallets ({wallets.length})
            </h3>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {wallets.map(wallet => (
                <div key={wallet._id} className="flex items-center space-x-2 text-sm">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400 font-mono">
                    {formatAddress(wallet.address)}
                  </span>
                  {currentMode === 'random' && randomAmounts[wallet._id] && (
                    <span className="text-primary-600 font-medium">
                      ({randomAmounts[wallet._id]} ETH)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Funding Required:
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getTotalAmount().toFixed(6)} ETH
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={isLoading}
            disabled={
              isLoading ||
              (currentMode === 'single' && (!amount || wallets.length !== 1)) ||
              (currentMode === 'batch' && (!amount || wallets.length === 0)) ||
              (currentMode === 'random' && (!minAmount || !maxAmount || wallets.length === 0))
            }
          >
            <Send className="w-4 h-4 mr-2" />
            Confirm Funding
          </Button>
        </div>
      </div>
    </div>
  );
};
