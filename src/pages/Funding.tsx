import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { useFunder, useFundingHistory, useFundWallets } from '../hooks/useFunding';
import { useAvailableWallets } from '../hooks/useWallets';
import { formatCurrency, formatDate, formatAddress } from '../utils/formatters';
import { 
  DollarSign, 
  Wallet, 
  Send, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const Funding: React.FC = () => {
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [fundingAmount, setFundingAmount] = useState<string>('');

  const { data: funder, isLoading: funderLoading } = useFunder();
  const { data: fundingHistory, isLoading: historyLoading } = useFundingHistory();
  const { data: availableWallets, isLoading: walletsLoading } = useAvailableWallets();
  const fundWalletsMutation = useFundWallets();

  const isLoading = funderLoading || historyLoading || walletsLoading;

  const handleFundWallets = () => {
    if (selectedWallets.length === 0 || !fundingAmount) {
      alert('Please select wallets and enter funding amount');
      return;
    }

    const amount = parseFloat(fundingAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid funding amount');
      return;
    }

    fundWalletsMutation.mutate({
      walletAddresses: selectedWallets,
      amount: BigInt(Math.floor(amount * 1e18)), // Convert to wei
      chainId: 8453 // Base chain
    });
  };

  const handleWalletSelection = (walletId: string) => {
    setSelectedWallets(prev => 
      prev.includes(walletId) 
        ? prev.filter(id => id !== walletId)
        : [...prev, walletId]
    );
  };

  const handleSelectAll = () => {
    if (availableWallets && availableWallets.length > 0) {
      setSelectedWallets(availableWallets.map(wallet => wallet.address));
    }
  };

  const handleDeselectAll = () => {
    setSelectedWallets([]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Wallet Funding</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Fund your wallets for warmup operations</p>
        </div>
      </div>

      {/* Funder Information */}
      {funder && (
        <Card title="Funder Information" subtitle="Current funding source">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Funder Address</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatAddress(funder.address)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(funder.balance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <StatusBadge status={funder.status} />
            </div>
          </div>
        </Card>
      )}

      {/* Funding Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Wallets */}
        <Card title="Available Wallets" subtitle="Select wallets to fund">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {availableWallets?.length || 0} wallets available
              </p>
              <div className="flex space-x-2">
                <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableWallets?.map((wallet) => (
                <div
                  key={wallet._id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWallets.includes(wallet.address)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleWalletSelection(wallet.address)}
                >
                  <div className="flex items-center">
                    <Wallet className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatAddress(wallet.address)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Type: {wallet.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {selectedWallets.includes(wallet.address) && (
                      <CheckCircle className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                </div>
              ))}
              
              {(!availableWallets || availableWallets.length === 0) && (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No available wallets</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Funding Form */}
        <Card title="Funding Details" subtitle="Configure funding parameters">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Funding Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.01"
                className="input"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selected Wallets
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedWallets.length} wallet{selectedWallets.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Funding Required
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {fundingAmount && selectedWallets.length > 0
                  ? formatCurrency(BigInt(Math.floor(parseFloat(fundingAmount) * 1e18 * selectedWallets.length)))
                  : '0 ETH'
                }
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleFundWallets}
              loading={fundWalletsMutation.isPending}
              disabled={selectedWallets.length === 0 || !fundingAmount}
            >
              <Send className="w-4 h-4 mr-2" />
              Fund Selected Wallets
            </Button>
          </div>
        </Card>
      </div>

      {/* Funding History */}
      <Card title="Funding History" subtitle="Recent funding transactions">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Wallet Address</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {fundingHistory?.slice(0, 10).map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {transaction.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {formatAddress(transaction.walletAddress)}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={transaction.status} />
                  </td>
                  <td>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!fundingHistory || fundingHistory.length === 0) && (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No funding history</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
