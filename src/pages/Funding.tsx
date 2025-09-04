import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { MultiChainFunderStatusCard } from '../components/MultiChainFunderStatusCard';
import { VirtualWalletList } from '../components/VirtualWalletList';
import { useFunderStatus } from '../hooks/useFunding';
import { useWallets, useSellAllTokens, useSendBackToFunder } from '../hooks/useWallets';
import { useMultiChain } from '../hooks/useMultiChain';
import { WalletService } from '../services/walletService';
import { WalletStatus, WalletType } from '../types/wallet';
import { formatAddress, formatWalletBalance } from '../utils/formatters';
import { 
  RefreshCw, 
  Wallet, 
  CheckSquare, 
  Square,
  Target,
  Shield, 
  Search,
  Filter,
  Network,
  Trash2,
  ArrowLeftRight,
  Loader2
} from 'lucide-react';

export const Funding: React.FC = () => {
  const { data: funderStatus, refetch: refetchFunder } = useFunderStatus();
  const { data: wallets = [], isLoading: walletsLoading, refetch: refetchWallets } = useWallets();
  const { getChainName, supportedChains } = useMultiChain();
  
  // Bulk cleanup hooks
  const sellAllMutation = useSellAllTokens();
  const sendBackMutation = useSendBackToFunder();

  // Wallet selection states
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showOnlyZeroBalance, setShowOnlyZeroBalance] = useState(false);
  const [showOnlyWithBalance, setShowOnlyWithBalance] = useState(false);
  
  // Funding configuration states
  const [fundingMethod, setFundingMethod] = useState<'SIMPLE' | 'ADVANCED'>('SIMPLE');
  const [amountMode, setAmountMode] = useState<'FIXED' | 'RANDOM'>('FIXED');
  const [fixedAmount, setFixedAmount] = useState(0.03);
  const [minAmount, setMinAmount] = useState(0.01);
  const [maxAmount, setMaxAmount] = useState(0.05);
  const [cexPercent, setCexPercent] = useState(30); // 30% CEX, 70% Stealth
  const [useStealthTransfers, setUseStealthTransfers] = useState(true);
  const [isFunding, setIsFunding] = useState(false);
  
  // Bulk cleanup states
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState<{
    current: number;
    total: number;
    currentWallet?: string;
    status?: string;
  }>({ current: 0, total: 0 });

  // Filter available wallets with all filters applied
  const availableWallets = wallets.filter(wallet => {
    // Base filter: exclude only archived wallets (handle both uppercase and lowercase)
    const isArchived = wallet.status === WalletStatus.ARCHIVED;
    if (isArchived) return false;

    // Search filter
    const matchesSearch = !searchTerm || 
      (wallet.publicKey || wallet.address).toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.type.toLowerCase().includes(searchTerm.toLowerCase());

    // Chain filter
    const matchesChain = !selectedChain || wallet.chainId === parseInt(selectedChain);

    // Type filter
    const matchesType = !selectedType || wallet.type === selectedType;

    // Status filter (additional status filtering beyond active) - handle case insensitive
    const matchesStatus = !selectedStatus || 
      wallet.status === selectedStatus || 
      wallet.status.toLowerCase() === selectedStatus.toLowerCase();

    // Balance filters
    const balance = parseFloat(wallet.nativeTokenBalance || '0');
    const matchesZeroBalance = !showOnlyZeroBalance || balance === 0;
    const matchesWithBalance = !showOnlyWithBalance || balance > 0;

    return matchesSearch && matchesChain && matchesType && matchesStatus && 
           matchesZeroBalance && matchesWithBalance;
  });

  const handleRefresh = () => {
    refetchFunder();
    refetchWallets();
  };

  // Handle wallet selection
  const handleWalletSelection = (walletId: string) => {
    setSelectedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  };

  // Handle select all wallets
  const handleSelectAll = () => {
    if (selectedWallets.size === availableWallets.length) {
      setSelectedWallets(new Set());
    } else {
      setSelectedWallets(new Set(availableWallets.map(w => w._id)));
    }
  };

  // Generate random amounts for each wallet
  const generateRandomAmounts = (walletCount: number) => {
    return Array.from({ length: walletCount }, () => {
      const random = Math.random() * (maxAmount - minAmount) + minAmount;
      return Math.round(random * 1000000) / 1000000; // Round to 6 decimals
    });
  };

  // Get funding amounts based on mode
  const getFundingAmounts = () => {
    if (amountMode === 'FIXED') {
      return Array.from(selectedWallets).map(() => fixedAmount);
    } else {
      return generateRandomAmounts(selectedWallets.size);
    }
  };

  // Simple funding (CEX or STEALTH only)
  const quickFund = async (method: 'CEX' | 'STEALTH') => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    if ((amountMode === 'FIXED' && fixedAmount <= 0) || 
        (amountMode === 'RANDOM' && (minAmount <= 0 || maxAmount <= 0 || minAmount >= maxAmount))) {
      toast.error('Please enter valid funding amounts');
      return;
    }

    setIsFunding(true);

    try {
      const walletIds = Array.from(selectedWallets);
      const amounts = getFundingAmounts(); // This handles both FIXED and RANDOM modes
      
      const result = await WalletService.quickFundSelectedWallets(
        walletIds,
        amounts,
        method,
        false
      );
      
      if (result.success) {
        const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
        toast.success(`✅ ${method} funded ${walletIds.length} wallets with ${totalAmount.toFixed(3)} SOL total`);
        // Clear selection and refresh wallet balances
        setSelectedWallets(new Set());
        refetchWallets();
      } else {
        toast.error(`❌ Funding failed: ${result.message}`);
      }
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsFunding(false);
    }
  };

  // Advanced CLI-style funding with percentage mix
  const advancedFund = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    if ((amountMode === 'FIXED' && fixedAmount <= 0) || 
        (amountMode === 'RANDOM' && (minAmount <= 0 || maxAmount <= 0 || minAmount >= maxAmount))) {
      toast.error('Please enter valid funding amounts');
      return;
    }

    setIsFunding(true);

    try {
      const walletIds = Array.from(selectedWallets);
      const amounts = getFundingAmounts();
      
      // Step 1: Create plan with percentage mix
      const planResult = await WalletService.createAdvancedFundingPlan(
        `Mixed Funding ${new Date().toISOString()}`,
        walletIds,
        amounts,
        cexPercent,
        useStealthTransfers,
        { min: 3, max: 7 }
      );
      
      if (!planResult.success) {
        toast.error(`❌ Failed to create funding plan`);
        return;
      }
      
      // Step 2: Execute plan
      const executeResult = await WalletService.executeAdvancedFundingPlan(
        planResult.data.planId,
        'BOTH',
        false
      );
      
      if (executeResult.success) {
        const cexWallets = Math.ceil(walletIds.length * cexPercent / 100);
        const stealthWallets = walletIds.length - cexWallets;
        const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
        toast.success(
          `🎯 Mixed funding completed! ${cexWallets} CEX + ${stealthWallets} Stealth wallets (${totalAmount.toFixed(3)} SOL total)`
        );
        // Clear selection and refresh wallet balances
        setSelectedWallets(new Set());
        refetchWallets();
      } else {
        toast.error(`❌ Funding failed: ${executeResult.message}`);
      }
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsFunding(false);
    }
  };

  // Bulk cleanup functions
  const handleBulkSellAllTokens = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const solanaWallets = Array.from(selectedWallets)
      .map(id => availableWallets.find(w => w._id === id))
      .filter(w => w && w.chainId === 101); // Only Solana wallets

    if (solanaWallets.length === 0) {
      toast.error('No Solana wallets selected. Sell all tokens is currently only supported for Solana wallets.');
      return;
    }

    setIsCleaningUp(true);
    setCleanupProgress({ current: 0, total: solanaWallets.length, status: 'Selling tokens...' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < solanaWallets.length; i++) {
      const wallet = solanaWallets[i];
      setCleanupProgress({ 
        current: i + 1, 
        total: solanaWallets.length, 
        currentWallet: formatAddress(wallet.publicKey || wallet.address),
        status: 'Selling tokens...'
      });

      try {
        await sellAllMutation.mutateAsync(wallet._id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sell tokens for wallet ${wallet._id}:`, error);
        failCount++;
      }

      // Small delay between wallets
      if (i < solanaWallets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsCleaningUp(false);
    setCleanupProgress({ current: 0, total: 0 });

    if (successCount > 0) {
      toast.success(`Successfully sold tokens from ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to sell tokens from ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    refetchWallets();
  };

  const handleBulkSendBackToFunder = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    if (!funderStatus?.funderAddress) {
      toast.error('No funder address available');
      return;
    }

    const solanaWallets = Array.from(selectedWallets)
      .map(id => availableWallets.find(w => w._id === id))
      .filter(w => w && w.chainId === 101); // Only Solana wallets

    if (solanaWallets.length === 0) {
      toast.error('No Solana wallets selected. Send back to funder is currently only supported for Solana wallets.');
      return;
    }

    setIsCleaningUp(true);
    setCleanupProgress({ current: 0, total: solanaWallets.length, status: 'Sending back to funder...' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < solanaWallets.length; i++) {
      const wallet = solanaWallets[i];
      setCleanupProgress({ 
        current: i + 1, 
        total: solanaWallets.length, 
        currentWallet: formatAddress(wallet.publicKey || wallet.address),
        status: 'Sending back to funder...'
      });

      try {
        await sendBackMutation.mutateAsync({
          walletId: wallet._id,
          funderAddress: funderStatus.funderAddress
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send back to funder for wallet ${wallet._id}:`, error);
        failCount++;
      }

      // Small delay between wallets
      if (i < solanaWallets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsCleaningUp(false);
    setCleanupProgress({ current: 0, total: 0 });

    if (successCount > 0) {
      toast.success(`Successfully sent back SOL from ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to send back SOL from ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    refetchWallets();
  };

  const handleBulkCleanup = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const solanaWallets = Array.from(selectedWallets)
      .map(id => availableWallets.find(w => w._id === id))
      .filter(w => w && w.chainId === 101); // Only Solana wallets

    if (solanaWallets.length === 0) {
      toast.error('No Solana wallets selected. Wallet cleanup is currently only supported for Solana wallets.');
      return;
    }

    if (!funderStatus?.funderAddress) {
      toast.error('No funder address available');
      return;
    }

    setIsCleaningUp(true);
    setCleanupProgress({ current: 0, total: solanaWallets.length * 2, status: 'Starting cleanup...' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < solanaWallets.length; i++) {
      const wallet = solanaWallets[i];
      
      // Step 1: Sell all tokens
      setCleanupProgress({ 
        current: i * 2 + 1, 
        total: solanaWallets.length * 2, 
        currentWallet: formatAddress(wallet.publicKey || wallet.address),
        status: 'Selling tokens...'
      });

      try {
        await sellAllMutation.mutateAsync(wallet._id);
      } catch (error) {
        console.error(`Failed to sell tokens for wallet ${wallet._id}:`, error);
        failCount++;
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Send back to funder
      setCleanupProgress({ 
        current: i * 2 + 2, 
        total: solanaWallets.length * 2, 
        currentWallet: formatAddress(wallet.publicKey || wallet.address),
        status: 'Sending back to funder...'
      });

      try {
        await sendBackMutation.mutateAsync({
          walletId: wallet._id,
          funderAddress: funderStatus.funderAddress
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send back to funder for wallet ${wallet._id}:`, error);
        failCount++;
      }

      // Small delay between wallets
      if (i < solanaWallets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsCleaningUp(false);
    setCleanupProgress({ current: 0, total: 0 });

    if (successCount > 0) {
      toast.success(`Successfully cleaned up ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to cleanup ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    refetchWallets();
  };

  const selectAll = selectedWallets.size === availableWallets.length && availableWallets.length > 0;
  const indeterminate = selectedWallets.size > 0 && selectedWallets.size < availableWallets.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Funding System</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Select wallets and fund them with CLI-style options
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Funder Status Card */}
      <MultiChainFunderStatusCard onRefresh={refetchFunder} />

      {/* Bulk Cleanup Actions */}
      {selectedWallets.size > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                Bulk Wallet Cleanup ({selectedWallets.size} selected)
              </h3>
            </div>
            
            {/* Progress indicator */}
            {isCleaningUp && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {cleanupProgress.status}
                      </span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {cleanupProgress.current} / {cleanupProgress.total}
                      </span>
                    </div>
                    {cleanupProgress.currentWallet && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Current: {cleanupProgress.currentWallet}
                      </p>
                    )}
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(cleanupProgress.current / cleanupProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={handleBulkSellAllTokens}
                disabled={isCleaningUp || isFunding}
                className="flex items-center"
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Sell All Tokens
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleBulkSendBackToFunder}
                disabled={isCleaningUp || isFunding || !funderStatus?.funderAddress}
                className="flex items-center"
              >
                <Target className="w-4 h-4 mr-2" />
                Send Back to Funder
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleBulkCleanup}
                disabled={isCleaningUp || isFunding || !funderStatus?.funderAddress}
                className="flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Full Cleanup (Sell + Send)
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                ℹ️ Cleanup actions are only supported for Solana wallets. 
                {Array.from(selectedWallets).map(id => availableWallets.find(w => w._id === id)).filter(w => w && w.chainId === 101).length} of {selectedWallets.size} selected wallets are Solana wallets.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Wallet Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Wallet Filters
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {availableWallets.length} of {wallets.length} wallets shown
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by address or type..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Chain Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chain</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
              >
                <option value="">All Chains</option>
                {supportedChains?.map(chain => (
                  <option key={chain.chainId || chain.id} value={chain.chainId || chain.id}>
                    {chain.name || getChainName(chain.chainId || chain.id)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                {Object.values(WalletType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {Object.values(WalletStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Balance Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOnlyZeroBalance}
                onChange={(e) => {
                  setShowOnlyZeroBalance(e.target.checked);
                  if (e.target.checked) setShowOnlyWithBalance(false);
                }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show only zero balance wallets</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOnlyWithBalance}
                onChange={(e) => {
                  setShowOnlyWithBalance(e.target.checked);
                  if (e.target.checked) setShowOnlyZeroBalance(false);
                }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show only wallets with balance</span>
            </label>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedChain || selectedType || selectedStatus || showOnlyZeroBalance || showOnlyWithBalance) && (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedChain('');
                  setSelectedType('');
                  setSelectedStatus('');
                  setShowOnlyZeroBalance(false);
                  setShowOnlyWithBalance(false);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Wallet Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select Wallets to Fund
            </h3>
            <Button
              variant="secondary"
              onClick={handleSelectAll}
              disabled={availableWallets.length === 0}
            >
              {indeterminate ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : selectAll ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              {selectAll ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {availableWallets.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
              <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No active wallets available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Create some wallets first in the Wallets page
              </p>
            </div>
          ) : (
            <>
              {availableWallets.length > 100 ? (
                <VirtualWalletList
                  wallets={availableWallets}
                  selectedWallets={selectedWallets}
                  onWalletSelect={handleWalletSelection}
                  onSelectAll={handleSelectAll}
                  selectAll={selectAll}
                  indeterminate={indeterminate}
                  containerHeight={300}
                />
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                  {availableWallets.map(wallet => (
                    <div
                      key={wallet._id}
                      className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWallets.has(wallet._id)}
                        onChange={() => handleWalletSelection(wallet._id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatAddress(wallet.publicKey || wallet.address)}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{wallet.type}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Network className="w-3 h-3 mr-1" />
                            {getChainName(wallet.chainId)}
                          </span>
                          <span>•</span>
                          <span className={`font-medium ${
                            parseFloat(wallet.nativeTokenBalance || '0') === 0 
                              ? 'text-red-500' 
                              : 'text-green-600'
                          }`}>
                            Balance: {formatWalletBalance(wallet.nativeTokenBalance || '0', wallet.chainId)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedWallets.size > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedWallets.size} wallet{selectedWallets.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </>
          )}
        </div>
      </Card>

      {/* CLI-Style Funding UI */}
      {selectedWallets.size > 0 && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Fund Selected Wallets ({selectedWallets.size} selected)
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFundingMethod(fundingMethod === 'SIMPLE' ? 'ADVANCED' : 'SIMPLE')}
              >
                {fundingMethod === 'SIMPLE' ? '⚙️ Advanced Options' : '🔙 Simple Mode'}
              </Button>
            </div>

            {/* Amount Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">💰 Funding Amount Configuration</h4>
              
              {/* Amount Mode Toggle */}
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="amountMode"
                    value="FIXED"
                    checked={amountMode === 'FIXED'}
                    onChange={() => setAmountMode('FIXED')}
                    className="mr-2"
                  />
                  Fixed Amount
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="amountMode"
                    value="RANDOM"
                    checked={amountMode === 'RANDOM'}
                    onChange={() => setAmountMode('RANDOM')}
                    className="mr-2"
                  />
                  Random Range (CLI-style)
                </label>
              </div>

              {/* Fixed Amount Input */}
              {amountMode === 'FIXED' && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount per wallet:
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-sm text-gray-500">SOL</span>
                </div>
              )}

              {/* Random Range Inputs */}
              {amountMode === 'RANDOM' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Min amount:
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={minAmount}
                        onChange={(e) => setMinAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-sm text-gray-500">SOL</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Max amount:
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min={minAmount + 0.001}
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-sm text-gray-500">SOL</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 Each wallet will get a random amount between {minAmount} - {maxAmount} SOL
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Simple Mode */}
            {fundingMethod === 'SIMPLE' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Quick Funding ({selectedWallets.size} wallets)</h4>
                <div className="flex space-x-3">
                  <Button
                    variant="primary"
                    onClick={() => quickFund('STEALTH')}
                    loading={isFunding}
                    disabled={selectedWallets.size === 0}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    🥷 Stealth Fund All
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => quickFund('CEX')}
                    loading={isFunding}
                    disabled={selectedWallets.size === 0}
                  >
                    🏦 CEX Fund All
                  </Button>
                </div>
              </div>
            )}

            {/* Advanced CLI-Style Mode */}
            {fundingMethod === 'ADVANCED' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">CLI-Style Mixed Funding</h4>
                
                {/* Percentage Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    CEX Funding: {cexPercent}% | Stealth: {100 - cexPercent}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={cexPercent}
                    onChange={(e) => setCexPercent(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>10% CEX</span>
                    <span>20% CEX</span>
                    <span>30% CEX</span>
                  </div>
                </div>

                {/* Stealth Option */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useStealthTransfers"
                    checked={useStealthTransfers}
                    onChange={(e) => setUseStealthTransfers(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="useStealthTransfers" className="text-sm text-gray-700 dark:text-gray-300">
                    Use WSOL Stealth Transfers
                  </label>
                </div>

                {/* Execute Button */}
                <Button
                  variant="primary"
                  onClick={advancedFund}
                  loading={isFunding}
                  disabled={selectedWallets.size === 0}
                  className="w-full"
                >
                  <Target className="w-4 h-4 mr-2" />
                  🎯 Execute Mixed Funding Plan
                </Button>

                {/* Enhanced Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">📊 Plan Preview:</p>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>🏦 CEX: {Math.ceil(selectedWallets.size * cexPercent / 100)} wallets</p>
                    <p>🥷 Stealth: {selectedWallets.size - Math.ceil(selectedWallets.size * cexPercent / 100)} wallets</p>
                    {amountMode === 'FIXED' ? (
                      <p>💰 Total: {(selectedWallets.size * fixedAmount).toFixed(3)} SOL (fixed)</p>
                    ) : (
                      <p>💰 Total: ~{((selectedWallets.size * (minAmount + maxAmount)) / 2).toFixed(3)} SOL (avg random)</p>
                    )}
                    <p>🎲 Amounts: {amountMode === 'FIXED' ? `${fixedAmount} SOL each` : `${minAmount}-${maxAmount} SOL random`}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};