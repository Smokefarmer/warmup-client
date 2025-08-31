import React, { useState } from 'react';
import { Button } from './common/Button';
import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ConfirmationDialog } from './ConfirmationDialog';
import { WalletCleanupResults } from './WalletCleanupResults';
import { useSellAllTokens, useSendBackToFunder } from '../hooks/useWallets';
import { useFunderStatus } from '../hooks/useFunding';
import { IWallet } from '../types/wallet';
import { formatAddress } from '../utils/formatters';
import { Trash2, RefreshCw, DollarSign, CheckCircle, XCircle } from 'lucide-react';

interface BulkWalletCleanupProps {
  wallets: IWallet[];
  onComplete?: () => void;
}

interface WalletCleanupStatus {
  walletId: string;
  address: string;
  sellStatus: 'pending' | 'processing' | 'completed' | 'failed';
  sendStatus: 'pending' | 'processing' | 'completed' | 'failed';
  sellResult?: any;
  sendResult?: any;
  error?: string;
}

export const BulkWalletCleanup: React.FC<BulkWalletCleanupProps> = ({
  wallets,
  onComplete
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletStatuses, setWalletStatuses] = useState<WalletCleanupStatus[]>([]);
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);

  const sellAllMutation = useSellAllTokens();
  const sendBackMutation = useSendBackToFunder();
  const { data: funderStatus } = useFunderStatus();

  const initializeStatuses = () => {
    const statuses: WalletCleanupStatus[] = wallets.map(wallet => ({
      walletId: wallet._id,
      address: wallet.address,
      sellStatus: 'pending',
      sendStatus: 'pending'
    }));
    setWalletStatuses(statuses);
  };

  const updateWalletStatus = (walletId: string, updates: Partial<WalletCleanupStatus>) => {
    setWalletStatuses(prev => prev.map(status => 
      status.walletId === walletId ? { ...status, ...updates } : status
    ));
  };

  const cleanupAllWallets = async () => {
    if (!funderStatus?.funderAddress) {
      console.error('No funder address available');
      return;
    }

    setIsProcessing(true);
    initializeStatuses();

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      setCurrentWalletIndex(i);

      try {
        // First, sell all tokens
        updateWalletStatus(wallet._id, { sellStatus: 'processing' });
        
        try {
          const sellResult = await sellAllMutation.mutateAsync(wallet._id);
          updateWalletStatus(wallet._id, { 
            sellStatus: 'completed', 
            sellResult 
          });
        } catch (sellError) {
          updateWalletStatus(wallet._id, { 
            sellStatus: 'failed', 
            error: `Failed to sell tokens: ${sellError}` 
          });
        }

        // Then, send SOL back to funder
        updateWalletStatus(wallet._id, { sendStatus: 'processing' });
        
        try {
          const sendResult = await sendBackMutation.mutateAsync({
            walletId: wallet._id,
            funderAddress: funderStatus.funderAddress
          });
          updateWalletStatus(wallet._id, { 
            sendStatus: 'completed', 
            sendResult 
          });
        } catch (sendError) {
          updateWalletStatus(wallet._id, { 
            sendStatus: 'failed', 
            error: `Failed to send back to funder: ${sendError}` 
          });
        }

        // Small delay between wallets to avoid overwhelming the backend
        if (i < wallets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        updateWalletStatus(wallet._id, {
          sellStatus: 'failed',
          sendStatus: 'failed',
          error: `Wallet cleanup failed: ${error}`
        });
      }
    }

    setIsProcessing(false);
    setCurrentWalletIndex(0);
    onComplete?.();
  };

  const getStatusIcon = (status: 'pending' | 'processing' | 'completed' | 'failed') => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
      case 'processing':
        return <LoadingSpinner size="sm" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getCompletedCount = () => {
    return walletStatuses.filter(status => 
      status.sellStatus === 'completed' && status.sendStatus === 'completed'
    ).length;
  };

  const getFailedCount = () => {
    return walletStatuses.filter(status => 
      status.sellStatus === 'failed' || status.sendStatus === 'failed'
    ).length;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Bulk Wallet Cleanup
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} selected
        </div>
      </div>

      {/* Progress Summary */}
      {walletStatuses.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress: {getCompletedCount()}/{wallets.length} completed
            </span>
            {getFailedCount() > 0 && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {getFailedCount()} failed
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getCompletedCount() / wallets.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Wallet Status List */}
      {walletStatuses.length > 0 && (
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {walletStatuses.map((status, index) => (
            <div
              key={status.walletId}
              className={`p-3 border rounded-lg ${
                index === currentWalletIndex && isProcessing
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {formatAddress(status.address)}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(status.sellStatus)}
                    <span className="text-xs text-gray-500">Sell</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(status.sendStatus)}
                    <span className="text-xs text-gray-500">Send</span>
                  </div>
                </div>
              </div>
              
              {status.error && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {status.error}
                </div>
              )}

              {/* Individual Results */}
              {(status.sellResult || status.sendResult) && (
                <div className="mt-3">
                  <WalletCleanupResults
                    sellResult={status.sellResult}
                    sendResult={status.sendResult}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowConfirm(true)}
          disabled={isProcessing || wallets.length === 0 || !funderStatus?.funderAddress}
          className="px-8"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isProcessing ? 'Cleaning Up...' : 'Cleanup All Wallets'}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          cleanupAllWallets();
        }}
        title="Bulk Wallet Cleanup"
        message={`Are you sure you want to cleanup ${wallets.length} wallet${wallets.length !== 1 ? 's' : ''}? This will:

1. Sell all tokens in each wallet
2. Send all SOL back to the funder wallet

This action cannot be undone.`}
        confirmText="Start Cleanup"
        type="warning"
      />
    </Card>
  );
};
