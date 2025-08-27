import React, { useState, useRef, useCallback } from 'react';
import { IWarmUpWallet, IWallet } from '../types/wallet';
import { formatAddress, formatCurrency } from '../utils/formatters';
import { StatusBadge } from './common/StatusBadge';
import { Wallet } from 'lucide-react';

interface VirtualWalletListProps {
  wallets: (IWarmUpWallet | IWallet)[];
  selectedWallets: Set<string>;
  onWalletSelect: (walletId: string) => void;
  onSelectAll: () => void;
  selectAll: boolean;
  indeterminate: boolean;
  itemHeight?: number;
  containerHeight?: number;
}

export const VirtualWalletList: React.FC<VirtualWalletListProps> = ({
  wallets,
  selectedWallets,
  onWalletSelect,
  onSelectAll,
  selectAll,
  indeterminate,
  itemHeight = 60,
  containerHeight = 400,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, wallets.length);

  // Get visible wallets
  const visibleWallets = wallets.slice(startIndex, endIndex);

  // Calculate total height and offset
  const totalHeight = wallets.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Scroll to wallet (unused but kept for future use)
  // const scrollToWallet = useCallback((walletId: string) => {
  //   const index = wallets.findIndex(w => w._id === walletId);
  //   if (index !== -1 && containerRef.current) {
  //     const scrollTop = index * itemHeight;
  //     containerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
  //   }
  // }, [wallets, itemHeight]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={selectAll}
            ref={(input) => {
              if (input) input.indeterminate = indeterminate;
            }}
            onChange={onSelectAll}
            disabled={wallets.length === 0}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Wallets ({wallets.length})
          </span>
        </div>
      </div>

      {/* Virtual List Container */}
      <div
        ref={containerRef}
        style={{ height: containerHeight }}
        className="overflow-y-auto"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleWallets.map((wallet) => {
              return (
                <div
                  key={wallet._id}
                  style={{ height: itemHeight }}
                  className="flex items-center px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <input
                      type="checkbox"
                      checked={selectedWallets.has(wallet._id)}
                      onChange={() => onWalletSelect(wallet._id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Wallet className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-sm text-gray-900 dark:text-gray-100 truncate">
                        {formatAddress(wallet.address)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {wallet.type}
                      </span>
                      <StatusBadge status={wallet.status} />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(BigInt(wallet.totalFunded || '0'))}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {wallet.buyTxCount + wallet.sellTxCount} tx
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {startIndex + 1}-{endIndex} of {wallets.length} wallets
          </span>
          <span>
            {selectedWallets.size} selected
          </span>
        </div>
      </div>
    </div>
  );
};
