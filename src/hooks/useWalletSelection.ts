import { useState, useMemo, useCallback } from 'react';
import { IWarmUpWallet, WalletStatus } from '../types/wallet';

export interface WalletSelectionState {
  selectedWallets: Set<string>;
  selectAll: boolean;
  indeterminate: boolean;
}

export const useWalletSelection = (wallets: IWarmUpWallet[] = []) => {
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    chainId: '',
    search: ''
  });

  // Filter wallets based on current filters
  const filteredWallets = useMemo(() => {
    return wallets.filter(wallet => {
      // Type filter
      if (filters.type && wallet.type !== filters.type) return false;
      
      // Status filter
      if (filters.status && wallet.status !== filters.status) return false;
      
      // Chain ID filter
      if (filters.chainId && wallet.chainId.toString() !== filters.chainId) return false;
      
      // Search filter - check both address and publicKey
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const addressMatch = wallet.address.toLowerCase().includes(searchLower);
        const publicKeyMatch = wallet.publicKey?.toLowerCase().includes(searchLower) || false;
        if (!addressMatch && !publicKeyMatch) return false;
      }
      
      return true;
    });
  }, [wallets, filters]);

  // Get filtered wallet IDs
  const filteredWalletIds = useMemo(() => 
    filteredWallets.map(wallet => wallet._id), 
    [filteredWallets]
  );

  // Check if all filtered wallets are selected
  const selectAll = useMemo(() => {
    if (filteredWalletIds.length === 0) return false;
    return filteredWalletIds.every(id => selectedWallets.has(id));
  }, [filteredWalletIds, selectedWallets]);

  // Check if some but not all filtered wallets are selected (indeterminate state)
  const indeterminate = useMemo(() => {
    if (filteredWalletIds.length === 0) return false;
    const selectedCount = filteredWalletIds.filter(id => selectedWallets.has(id)).length;
    return selectedCount > 0 && selectedCount < filteredWalletIds.length;
  }, [filteredWalletIds, selectedWallets]);

  // Toggle selection for a single wallet
  const toggleWalletSelection = useCallback((walletId: string) => {
    setSelectedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  }, []);

  // Toggle selection for all filtered wallets
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      // Deselect all filtered wallets
      setSelectedWallets(prev => {
        const newSet = new Set(prev);
        filteredWalletIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all filtered wallets
      setSelectedWallets(prev => {
        const newSet = new Set(prev);
        filteredWalletIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [selectAll, filteredWalletIds]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedWallets(new Set());
  }, []);

  // Get selected wallets data
  const selectedWalletsData = useMemo(() => {
    return wallets.filter(wallet => selectedWallets.has(wallet._id));
  }, [wallets, selectedWallets]);

  // Get selected wallet IDs as array
  const selectedWalletIds = useMemo(() => 
    Array.from(selectedWallets), 
    [selectedWallets]
  );

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Get selection summary
  const selectionSummary = useMemo(() => {
    const selected = selectedWalletsData;
    const active = selected.filter(w => w.status === WalletStatus.ACTIVE);
    const paused = selected.filter(w => w.status === WalletStatus.PAUSED);
    const banned = selected.filter(w => w.status === WalletStatus.BANNED);

    return {
      total: selected.length,
      active: active.length,
      paused: paused.length,
      banned: banned.length,
      totalFunded: selected.reduce((sum, w) => sum + BigInt(w.totalFunded || '0'), BigInt(0))
    };
  }, [selectedWalletsData]);

  return {
    // State
    selectedWallets,
    selectedWalletsData,
    selectedWalletIds,
    filteredWallets,
    filters,
    selectAll,
    indeterminate,
    selectionSummary,

    // Actions
    toggleWalletSelection,
    toggleSelectAll,
    clearSelection,
    updateFilters,
  };
};
