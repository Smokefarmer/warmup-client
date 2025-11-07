import React from 'react';
import { Card } from './common/Card';
import { useBalanceSummary } from '../hooks/useBalance';
import { useWallets } from '../hooks/useWallets';
import { formatMixedBalance, safeToBigInt } from '../utils/formatters';
import { WalletStatus } from '../types/wallet';
import { 
  Wallet, 
  TrendingUp, 
  Pause, 
  Ban,
  DollarSign,
  Activity
} from 'lucide-react';

export const BalanceSummary: React.FC = () => {
  const { data: balanceSummary, isLoading: balanceLoading } = useBalanceSummary();
  const { data: wallets = [] as any[], isLoading: walletsLoading } = useWallets();

  if (balanceLoading || walletsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate wallet statistics
  const activeWallets = wallets.filter((w: any) => w.status === WalletStatus.ACTIVE).length;
  const pausedWallets = wallets.filter((w: any) => w.status === WalletStatus.PAUSED).length;
  const bannedWallets = wallets.filter((w: any) => w.status === WalletStatus.BANNED).length;
  
  const totalFunded = wallets.reduce((sum: any, w: any) => sum + safeToBigInt(w.totalFunded), BigInt(0));
  const averageFunded = wallets.length > 0 ? totalFunded / BigInt(wallets.length) : BigInt(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Wallet className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {wallets.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Wallets</p>
        </div>
      </Card>
      
      <Card>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {activeWallets}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
        </div>
      </Card>
      
      <Card>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Pause className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {pausedWallets}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Paused</p>
        </div>
      </Card>
      
      <Card>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Ban className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {bannedWallets}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Banned</p>
        </div>
      </Card>

      {/* Balance Summary Cards */}
      <Card>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatMixedBalance(totalFunded)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Funded</p>
        </div>
      </Card>
      
      <Card>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatMixedBalance(averageFunded)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Funded</p>
        </div>
      </Card>
      
      {balanceSummary && (
        <>
          <Card>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {balanceSummary.activeWallets}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Wallets</p>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-indigo-600">
                {formatMixedBalance(balanceSummary.totalFunded || '0')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">API Total Funded</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
