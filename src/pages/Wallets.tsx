import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { CopyButton } from '../components/common/CopyButton';
import { ActionsMenu, ActionItem } from '../components/common/ActionsMenu';
import { StrategicWalletGenerator } from '../components/StrategicWalletGenerator';
import { GenerateWalletModal } from '../components/GenerateWalletModal';
import { BulkCleanupModal } from '../components/BulkCleanupModal';

import { 
  useWallets, 
  useArchivedWallets,
  useUpdateWalletStatus, 
  useUpdateWalletType, 
  useArchiveWallet,
  useUnarchiveWallet,
  useWalletsWithTokenInfo,
  useRefreshTokenCount,
  useSystemTokenLimits,
  useUpdateWalletTag,
  useRemoveWalletTag,
  useBulkTokenHoldings,
  useSellAllTokens,
  useSendBackToFunder
} from '../hooks/useWallets';
import { useForceUpdateAllBalances, useUpdateTotalFundedForWallet, useBulkUpdateBalances } from '../hooks/useBalance';
import { useFunderInfoAll } from '../hooks/useFunding';
import { useMultiChain } from '../hooks/useMultiChain';
import { WalletStatus, WalletType } from '../types/wallet';
import { formatAddress, formatDate, formatWalletBalance } from '../utils/formatters';

import { 
  Wallet, 
  Plus, 
  Target, 
  ExternalLink,
  Network,
  Play,
  Pause,
  Ban,
  Archive,
  Search,
  Filter,
  History,
  RefreshCw,
  BarChart3,
  Coins,
  Tag,
  Tags,
  X,
  Download,
  DollarSign,
  Trash2,
  Send,
  Loader2
} from 'lucide-react';

// Import token components
import { 
  TokenProgressBar, 
  TokenStatusIndicator,
  TokenLimitsCard
} from '../components/token';

export const Wallets: React.FC = () => {
  // Always load wallets with token info since we're displaying token limits
  const { 
    data: activeWallets = [], 
    isLoading: activeLoading, 
    error: tokenWalletsError,
    refetch: refetchActive 
  } = useWalletsWithTokenInfo();
  const { data: archivedWallets = [], isLoading: archivedLoading, refetch: refetchArchived } = useArchivedWallets();
  const { getExplorerUrl, getChainName: getChainNameFromService, supportedChains } = useMultiChain();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showStrategicGeneration, setShowStrategicGeneration] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Additional token management hooks
  const { data: systemTokenLimits, error: tokenLimitsError } = useSystemTokenLimits();
  const refreshTokenCountMutation = useRefreshTokenCount();
  
  // Bulk token holdings for improved Current Tokens display
  const { data: bulkTokenHoldings } = useBulkTokenHoldings({ 
    limit: 1000, 
    includeEmpty: false 
  });
  
  // Tag management hooks
  const updateTagMutation = useUpdateWalletTag();
  const removeTagMutation = useRemoveWalletTag();
  
  // Wallet selection for bulk operations
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [bulkTagValue, setBulkTagValue] = useState('');
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  
  // Bulk cleanup states
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupOperation, setCleanupOperation] = useState<'sell' | 'sendBack' | 'full'>('full');
  const [cleanupProgress, setCleanupProgress] = useState({
    current: 0,
    total: 0,
    currentWallet: '',
    currentAction: 'selling' as 'selling' | 'sending' | 'complete' | 'error',
    successCount: 0,
    failCount: 0,
    errors: [] as string[],
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const updateStatusMutation = useUpdateWalletStatus();
  const updateTypeMutation = useUpdateWalletType();
  const archiveMutation = useArchiveWallet();
  const unarchiveMutation = useUnarchiveWallet();
  const sellAllTokensMutation = useSellAllTokens();
  const sendBackToFunderMutation = useSendBackToFunder();
  const updateAllBalancesMutation = useForceUpdateAllBalances();
  const updateSingleBalanceMutation = useUpdateTotalFundedForWallet();
  const bulkUpdateBalancesMutation = useBulkUpdateBalances();
  const sendBackMutation = useSendBackToFunder();
  const { data: funderInfoAll } = useFunderInfoAll();

  // Use the correct wallet data based on current view
  const wallets = showArchived ? archivedWallets : activeWallets;
  const isLoading = showArchived ? archivedLoading : activeLoading;

  // Helper function to get token count from bulk data
  const getTokenCountFromBulkData = (walletId: string) => {
    if (!bulkTokenHoldings?.wallets) return null;
    const bulkWallet = bulkTokenHoldings.wallets.find(w => w.id === walletId);
    return bulkWallet?.tokenHoldings.count || 0;
  };

  // CSV Export function
  const handleExportCSV = () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select wallets to export');
      return;
    }

    // Get selected wallet data
    const selectedWalletData = filteredWallets.filter(wallet => 
      selectedWallets.has(wallet._id)
    );

    // Create CSV content
    const csvHeaders = ['Public Key', 'Token Holdings'];
    const csvRows = selectedWalletData.map(wallet => [
      wallet.publicKey || wallet.address,
      getTokenCountFromBulkData(wallet._id) !== null ? getTokenCountFromBulkData(wallet._id) : wallet.tokenInfo?.currentTokenCount || '0'
    ]);

    // Convert to CSV string
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => 
          // Escape commas and quotes in CSV
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wallets_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${selectedWallets.size} wallets to CSV`);
  };
  const refetch = showArchived ? refetchArchived : refetchActive;

  // Get unique tags for filter dropdown
  const uniqueTags = Array.from(new Set(
    wallets
      .filter(wallet => wallet.tag && wallet.tag.trim())
      .map(wallet => wallet.tag!)
  )).sort();

  // Filter wallets based on search term and filters (no need to filter by archived status anymore)
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = !searchTerm || 
      (wallet.publicKey || wallet.address).toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wallet.tag && wallet.tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesChain = !selectedChain || wallet.chainId.toString() === selectedChain;
    const matchesStatus = !selectedStatus || 
      wallet.status === selectedStatus || 
      wallet.status.toLowerCase() === selectedStatus.toLowerCase();
    
    // Balance filters - convert wallet balance to SOL for comparison
    const walletBalanceInSOL = (() => {
      const { decimals } = wallet.chainId === 101 ? { decimals: 9 } : { decimals: 18 };
      return parseFloat(wallet.nativeTokenBalance || '0') / Math.pow(10, decimals);
    })();
    
    const matchesMinBalance = !minBalance || (() => {
      const minBalanceValue = parseFloat(minBalance);
      if (isNaN(minBalanceValue)) return true;
      return walletBalanceInSOL >= minBalanceValue;
    })();
    
    const matchesMaxBalance = !maxBalance || (() => {
      const maxBalanceValue = parseFloat(maxBalance);
      if (isNaN(maxBalanceValue)) return true;
      return walletBalanceInSOL <= maxBalanceValue;
    })();
    
    const matchesTag = !selectedTag || 
      (selectedTag === 'no-tag' ? !wallet.tag : wallet.tag === selectedTag);
    
    return matchesSearch && matchesChain && matchesStatus && matchesMinBalance && matchesMaxBalance && matchesTag;
  });

  // Debug logging to see what wallet data we have
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Active wallets:', activeWallets.length);
      console.log('🔍 Archived wallets:', archivedWallets.length);
      console.log('🔍 Showing archived:', showArchived);
      console.log('🔍 Current filtered count:', filteredWallets.length);
    }
  }, [activeWallets.length, archivedWallets.length, showArchived, filteredWallets.length]);

  const handleStatusUpdate = async (walletId: string, status: WalletStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: walletId, status });
      refetch();
    } catch (error) {
      console.error('Failed to update wallet status:', error);
    }
  };

  const handleArchive = async (walletId: string) => {
    try {
      await archiveMutation.mutateAsync(walletId);
      // Refresh both active and archived lists since wallet moved between them
      refetchActive();
      refetchArchived();
    } catch (error) {
      console.error('Failed to archive wallet:', error);
    }
  };

  const handleUnarchive = async (walletId: string) => {
    try {
      await unarchiveMutation.mutateAsync(walletId);
      // Refresh both active and archived lists since wallet moved between them
      refetchActive();
      refetchArchived();
    } catch (error) {
      console.error('Failed to unarchive wallet:', error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select wallets to archive');
      return;
    }

    const walletIds = Array.from(selectedWallets);
    const confirmMessage = `Are you sure you want to archive ${walletIds.length} wallet${walletIds.length > 1 ? 's' : ''}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const walletId of walletIds) {
      try {
        await archiveMutation.mutateAsync(walletId);
        successCount++;
      } catch (error) {
        console.error(`Failed to archive wallet ${walletId}:`, error);
        failCount++;
      }
    }

    // Refresh both lists
    refetchActive();
    refetchArchived();
    
    // Clear selection
    setSelectedWallets(new Set());

    if (successCount > 0) {
      toast.success(`Successfully archived ${successCount} wallet${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to archive ${failCount} wallet${failCount > 1 ? 's' : ''}`);
    }
  };

  const handleBulkUnarchive = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select wallets to unarchive');
      return;
    }

    const walletIds = Array.from(selectedWallets);
    const confirmMessage = `Are you sure you want to unarchive ${walletIds.length} wallet${walletIds.length > 1 ? 's' : ''}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const walletId of walletIds) {
      try {
        await unarchiveMutation.mutateAsync(walletId);
        successCount++;
      } catch (error) {
        console.error(`Failed to unarchive wallet ${walletId}:`, error);
        failCount++;
      }
    }

    // Refresh both lists
    refetchActive();
    refetchArchived();
    
    // Clear selection
    setSelectedWallets(new Set());

    if (successCount > 0) {
      toast.success(`Successfully unarchived ${successCount} wallet${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to unarchive ${failCount} wallet${failCount > 1 ? 's' : ''}`);
    }
  };

  const handleSendBackToFunder = async (wallet: any) => {
    try {
      const chainId = wallet.chainId.toString();
      
      // Get funder address for this wallet's chain
      const funderAddress = funderInfoAll?.funderInfo?.[chainId]?.funderAddress;
      
      if (!funderAddress) {
        toast.error(`No funder address found for chain ${chainId}`);
        return;
      }
      
      const chainName = getChainNameFromService(wallet.chainId);
      const chainSymbol = supportedChains?.find(c => c.id === wallet.chainId)?.symbol || 'tokens';
      
      await sendBackMutation.mutateAsync({
        walletId: wallet._id,
        funderAddress: funderAddress
      });
      
      toast.success(`Successfully sent ${chainSymbol} back to funder from wallet`);
      refetch();
    } catch (error) {
      console.error('Failed to send back to funder:', error);
      toast.error('Failed to send tokens back to funder');
    }
  };

  // Handle force update all balances
  const handleForceUpdateAllBalances = async () => {
    try {
      const result = await updateAllBalancesMutation.mutateAsync();
      const updatedCount = result?.totalWalletsProcessed || 0;
      toast.success(`Successfully updated balances for ${updatedCount} wallets`);
      if (import.meta.env.DEV) {
        console.log('✅ Force updated all wallet balances:', result);
      }
    } catch (error) {
      console.error('Failed to update all balances:', error);
      toast.error('Failed to update wallet balances');
    }
  };

  // Handle force update single wallet balance
  const handleForceUpdateBalance = async (walletId: string) => {
    try {
      const result = await updateSingleBalanceMutation.mutateAsync({ walletId });
      if (result?.success) {
        toast.success(`Balance updated: ${result.newTotalFunded} (was ${result.oldTotalFunded})`);
      } else {
        toast.success('Wallet balance updated successfully');
      }
      if (import.meta.env.DEV) {
        console.log(`✅ Force updated balance for wallet: ${walletId}`, result);
      }
    } catch (error) {
      console.error('Failed to update wallet balance:', error);
      toast.error('Failed to update wallet balance');
    }
  };

  // Handle bulk balance update for selected wallets
  const handleBulkUpdateBalances = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const walletIds = Array.from(selectedWallets);
    
    try {
      const result = await bulkUpdateBalancesMutation.mutateAsync({
        walletIds,
        delayBetweenBatches: 5000, // 5 seconds between batches to avoid rate limiting
        batchSize: 5 // Process 5 wallets at a time
      });
      
      // The result is now BulkUpdateBalancesResponse
      if (result?.success) {
        toast.success(
          `Successfully updated balances for ${result.totalWalletsProcessed} wallets ` +
          `in ${result.processedBatches} batches (avg ${result.averageTimePerBatch.toFixed(1)}s per batch)`
        );
        // Clear selection after successful update
        setSelectedWallets(new Set());
      } else if (result) {
        toast.success(`Bulk balance update completed for ${walletIds.length} wallets`);
        setSelectedWallets(new Set());
      } else {
        toast.success(`Balance update completed for ${walletIds.length} wallets`);
        setSelectedWallets(new Set());
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Bulk updated balances:', result);
      }
    } catch (error) {
      console.error('Failed to bulk update wallet balances:', error);
      toast.error('Failed to update wallet balances');
    }
  };

  // Wallet selection handlers
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

  const handleSelectAll = () => {
    if (selectedWallets.size === filteredWallets.length) {
      setSelectedWallets(new Set());
    } else {
      setSelectedWallets(new Set(filteredWallets.map(w => w._id)));
    }
  };

  // Bulk tag operations
  const handleBulkSetTag = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    if (!bulkTagValue.trim()) {
      toast.error('Please enter a tag value');
      return;
    }

    const walletIds = Array.from(selectedWallets);
    let successCount = 0;
    let failCount = 0;

    for (const walletId of walletIds) {
      try {
        await updateTagMutation.mutateAsync({ walletId, tag: bulkTagValue.trim() });
        successCount++;
      } catch (error) {
        console.error(`Failed to set tag for wallet ${walletId}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Tag set for ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to set tag for ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    // Reset state
    setBulkTagValue('');
    setShowBulkTagModal(false);
    setSelectedWallets(new Set());
  };

  const handleBulkRemoveTag = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const walletIds = Array.from(selectedWallets);
    let successCount = 0;
    let failCount = 0;

    for (const walletId of walletIds) {
      try {
        await removeTagMutation.mutateAsync(walletId);
        successCount++;
      } catch (error) {
        console.error(`Failed to remove tag for wallet ${walletId}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Tag removed from ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to remove tag from ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    // Reset selection
    setSelectedWallets(new Set());
  };

  // 🧹 Bulk Cleanup Operations
  const handleBulkSellAllTokens = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const wallets = Array.from(selectedWallets).map(id => 
      activeWallets.find(w => w._id === id)
    ).filter(Boolean);

    setCleanupOperation('sell');
    setCleanupProgress({
      current: 0,
      total: wallets.length,
      currentWallet: '',
      currentAction: 'selling',
      successCount: 0,
      failCount: 0,
      errors: [],
    });
    setShowCleanupModal(true);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      if (!wallet) continue;

      setCleanupProgress(prev => ({
        ...prev,
        current: i + 1,
        currentWallet: formatAddress(wallet.publicKey || wallet.address),
        currentAction: 'selling',
      }));

      try {
        await sellAllTokensMutation.mutateAsync(wallet._id);
        successCount++;
        setCleanupProgress(prev => ({ ...prev, successCount }));
      } catch (error: any) {
        failCount++;
        const errorMsg = `${formatAddress(wallet.publicKey || wallet.address)}: ${error.message}`;
        errors.push(errorMsg);
        setCleanupProgress(prev => ({ 
          ...prev, 
          failCount,
          errors: [...prev.errors, errorMsg]
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCleanupProgress(prev => ({ ...prev, currentAction: 'complete' }));

    if (successCount > 0) {
      toast.success(`✅ Sold tokens from ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`❌ Failed for ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    setSelectedWallets(new Set());
    refetchActive();
  };

  const handleBulkSendBackToFunder = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const wallets = Array.from(selectedWallets).map(id => 
      activeWallets.find(w => w._id === id)
    ).filter(Boolean);

    // Validate that we have at least one wallet
    if (wallets.length === 0) {
      toast.error('No valid wallets selected');
      return;
    }

    setCleanupOperation('sendBack');
    setCleanupProgress({
      current: 0,
      total: wallets.length,
      currentWallet: '',
      currentAction: 'sending',
      successCount: 0,
      failCount: 0,
      errors: [],
    });
    setShowCleanupModal(true);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      if (!wallet) continue;

      setCleanupProgress(prev => ({
        ...prev,
        current: i + 1,
        currentWallet: formatAddress(wallet.publicKey || wallet.address),
        currentAction: 'sending',
      }));

      try {
        // Get funder address for this wallet's chain
        const chainId = wallet.chainId.toString();
        const funderAddress = funderInfoAll?.funderInfo?.[chainId]?.funderAddress;
        
        if (!funderAddress) {
          throw new Error(`No funder address found for chain ${chainId}`);
        }

        await sendBackToFunderMutation.mutateAsync({
          walletId: wallet._id,
          funderAddress: funderAddress
        });
        successCount++;
        setCleanupProgress(prev => ({ ...prev, successCount }));
      } catch (error: any) {
        failCount++;
        const errorMsg = `${formatAddress(wallet.publicKey || wallet.address)}: ${error.message}`;
        errors.push(errorMsg);
        setCleanupProgress(prev => ({ 
          ...prev, 
          failCount,
          errors: [...prev.errors, errorMsg]
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCleanupProgress(prev => ({ ...prev, currentAction: 'complete' }));

    if (successCount > 0) {
      toast.success(`✅ Sent funds back from ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`❌ Failed for ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    setSelectedWallets(new Set());
    refetchActive();
  };

  const handleBulkFullCleanup = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const wallets = Array.from(selectedWallets).map(id => 
      activeWallets.find(w => w._id === id)
    ).filter(Boolean);

    setCleanupOperation('full');
    setCleanupProgress({
      current: 0,
      total: wallets.length,
      currentWallet: '',
      currentAction: 'selling',
      successCount: 0,
      failCount: 0,
      errors: [],
    });
    setShowCleanupModal(true);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      if (!wallet) continue;

      const walletAddr = formatAddress(wallet.publicKey || wallet.address);
      setCleanupProgress(prev => ({
        ...prev,
        current: i + 1,
        currentWallet: walletAddr,
        currentAction: 'selling',
      }));

      try {
        await sellAllTokensMutation.mutateAsync(wallet._id);
        
        setCleanupProgress(prev => ({ ...prev, currentAction: 'sending' }));
        
        // Get funder address for this wallet's chain
        const chainId = wallet.chainId.toString();
        const funderAddress = funderInfoAll?.funderInfo?.[chainId]?.funderAddress;
        
        if (!funderAddress) {
          throw new Error(`No funder address found for chain ${chainId}`);
        }

        await sendBackToFunderMutation.mutateAsync({
          walletId: wallet._id,
          funderAddress: funderAddress
        });
        
        successCount++;
        setCleanupProgress(prev => ({ ...prev, successCount }));
      } catch (error: any) {
        failCount++;
        const errorMsg = `${walletAddr}: ${error.message}`;
        errors.push(errorMsg);
        setCleanupProgress(prev => ({ 
          ...prev, 
          failCount,
          errors: [...prev.errors, errorMsg]
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCleanupProgress(prev => ({ ...prev, currentAction: 'complete' }));

    if (successCount > 0) {
      toast.success(`✅ Full cleanup completed for ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`❌ Failed for ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    setSelectedWallets(new Set());
    refetchActive();
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {showStrategicGeneration 
              ? 'Strategic Wallet Generation' 
              : showArchived 
                ? 'Archived Wallets' 
                : 'Wallet Management'
            }
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {showStrategicGeneration 
              ? 'Generate wallets with intelligent distribution and advanced strategies'
              : showArchived
                ? 'View and manage your archived wallets'
                : 'Manage your wallet collection and status'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          {!showStrategicGeneration && (
            <>
              <Button
                variant="primary"
                onClick={() => setShowStrategicGeneration(true)}
              >
                <Target className="w-4 h-4 mr-2" />
                Strategic Generation
              </Button>
              <Button
                variant={showArchived ? 'primary' : 'secondary'}
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Active Wallets
                  </>
                ) : (
                  <>
                    <History className="w-4 h-4 mr-2" />
                    Archived Wallets
                  </>
                )}
              </Button>
            </>
          )}
          {showStrategicGeneration && (
            <Button
              variant="secondary"
              onClick={() => setShowStrategicGeneration(false)}
            >
              Back to Wallet List
            </Button>
          )}
        </div>
      </div>

      {/* Strategic Wallet Generation */}
      {showStrategicGeneration && (
        <StrategicWalletGenerator />
      )}

      {/* Bulk Actions - Redesigned for Better UX */}
      {!showStrategicGeneration && selectedWallets.size > 0 && (
        <Card className="p-6 border-2 border-primary-200 dark:border-primary-800">
          <div className="space-y-4">
            {/* Header with Selection Summary */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-primary-600" />
                  Bulk Actions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedWallets.size} wallet{selectedWallets.size !== 1 ? 's' : ''} selected
                  {showArchived ? ' (archived)' : ' (active)'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedWallets(new Set())}
                className="flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Selection
              </Button>
            </div>
            
            {/* Progress indicator */}
            {showCleanupModal && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {cleanupProgress.currentAction === 'selling' ? 'Selling tokens...' : 
                         cleanupProgress.currentAction === 'sending' ? 'Sending to funder...' :
                         cleanupProgress.currentAction === 'complete' ? 'Complete!' : 'Processing...'}
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

            {/* Action Buttons - Organized in Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Management Actions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Wallet Management
                </p>
                <Button
                  variant="success"
                  onClick={handleExportCSV}
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBulkUpdateBalances}
                  loading={bulkUpdateBalancesMutation.isPending}
                  className="w-full justify-start"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Balances
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowBulkTagModal(true)}
                  className="w-full justify-start"
                >
                  <Tags className="w-4 h-4 mr-2" />
                  Set Tag
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleBulkRemoveTag}
                  loading={removeTagMutation.isPending}
                  className="w-full justify-start"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Tags
                </Button>
              </div>

              {/* Cleanup Actions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cleanup Actions
                </p>
                <Button
                  variant="warning"
                  onClick={handleBulkSellAllTokens}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sell All Tokens
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBulkSendBackToFunder}
                  className="w-full justify-start"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to Funder
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBulkFullCleanup}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Full Cleanup
                </Button>
                {showArchived ? (
                  <Button
                    variant="success"
                    onClick={handleBulkUnarchive}
                    loading={unarchiveMutation.isPending}
                    className="w-full justify-start"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Unarchive
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={handleBulkArchive}
                    loading={archiveMutation.isPending}
                    className="w-full justify-start"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                )}
              </div>

              {/* Info Panel */}
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wider">
                    💡 Quick Guide
                  </p>
                  <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                    <p><strong>Export CSV:</strong> Download wallet data</p>
                    <p><strong>Update Balances:</strong> Refresh on-chain balances</p>
                    <p><strong>Sell All:</strong> Convert tokens to native currency</p>
                    <p><strong>Send to Funder:</strong> Transfer balance back</p>
                    <p><strong>Full Cleanup:</strong> Complete wallet reset</p>
                  </div>
                </div>
                
                {cleanupProgress.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">
                      ⚠️ {cleanupProgress.errors.length} Error{cleanupProgress.errors.length !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-1 text-xs text-red-600 dark:text-red-400">
                      {cleanupProgress.errors.map((error, idx) => (
                        <p key={idx}>• {error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      {!showStrategicGeneration && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chain</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
              >
                <option value="">All Chains</option>
                {supportedChains?.map(chain => (
                  <option key={chain.id} value={chain.id.toString()}>{chain.name}</option>
                ))}
              </select>
            </div>
            
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
                      
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Balance (SOL)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.001"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Balance (SOL)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="1.0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={maxBalance}
                onChange={(e) => setMaxBalance(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="">All Tags</option>
                <option value="no-tag">No Tag</option>
                {uniqueTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* KPIs */}
      {!showStrategicGeneration && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Filtered */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {showArchived ? 'Archived' : 'Active'} Wallets
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {filteredWallets.length}
                  {filteredWallets.length !== wallets.length && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      /{wallets.length}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Average Balance */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Coins className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Balance</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {(() => {
                    if (filteredWallets.length === 0) return '0 SOL';
                    const totalBalance = filteredWallets.reduce((sum, wallet) => {
                      const { decimals } = wallet.chainId === 101 ? { decimals: 9 } : { decimals: 18 };
                      const balance = parseFloat(wallet.nativeTokenBalance || '0') / Math.pow(10, decimals);
                      return sum + balance;
                    }, 0);
                    const avgBalance = totalBalance / filteredWallets.length;
                    return avgBalance > 0 ? `${avgBalance.toFixed(6)} SOL` : '0 SOL';
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Chain Distribution */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Network className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Chains</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {new Set(filteredWallets.map(w => w.chainId)).size}
                </p>
              </div>
            </div>
          </div>

          {/* Total Balance */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Balance</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {(() => {
                    const totalBalance = filteredWallets.reduce((sum, wallet) => {
                      // Convert lamports to SOL properly based on chain
                      const { decimals } = wallet.chainId === 101 ? { decimals: 9 } : { decimals: 18 };
                      const balance = parseFloat(wallet.nativeTokenBalance || '0') / Math.pow(10, decimals);
                      return sum + balance;
                    }, 0);
                    return totalBalance > 0 ? `${totalBalance.toFixed(6)} SOL` : '0 SOL';
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Limits Overview */}
      {!showStrategicGeneration && systemTokenLimits && !tokenLimitsError && (
        <TokenLimitsCard tokenLimits={systemTokenLimits} />
      )}
      
      {/* Token Limits Error (Development Info) */}
      {/* Wallet Count */}
      {!showStrategicGeneration && (
        <div className="flex items-center justify-end mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredWallets.length} wallet{filteredWallets.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      )}

      {/* Wallets Table */}
      {!showStrategicGeneration && (
        <Card>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedWallets.size === filteredWallets.length && filteredWallets.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Chain</th>
                  <th>Balance</th>
                  <th>Tag</th>
                  <th>Current Tokens</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.map((wallet) => {
                  const explorerUrl = getExplorerUrl(wallet.chainId, wallet.publicKey || wallet.address);
                  
                  return (
                    <tr key={wallet._id}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedWallets.has(wallet._id)}
                          onChange={() => handleWalletSelection(wallet._id)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Wallet className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-mono text-sm">{formatAddress(wallet.publicKey || wallet.address)}</span>
                          <CopyButton text={wallet.publicKey || wallet.address} size="sm" className="ml-2" />
                          {explorerUrl && (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{wallet.type}</span>
                      </td>
                      <td>
                        <StatusBadge status={wallet.status} />
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Network className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {getChainNameFromService(wallet.chainId)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatWalletBalance(wallet.nativeTokenBalance || '0', wallet.chainId)}
                        </span>
                      </td>
                      <td>
                        {wallet.tag ? (
                          <div className="flex items-center">
                            <Tag className="w-3 h-3 text-blue-500 mr-1" />
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {wallet.tag}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No tag</span>
                        )}
                      </td>
                      <td>
                        {(() => {
                          const bulkTokenCount = getTokenCountFromBulkData(wallet._id);
                          const currentCount = bulkTokenCount !== null ? bulkTokenCount : wallet.tokenInfo?.currentTokenCount;
                          const maxTokens = wallet.tokenInfo?.maxTokens;
                          
                          if (currentCount !== undefined && maxTokens) {
                            return (
                              <div className="flex items-center space-x-2">
                                <TokenProgressBar
                                  current={currentCount}
                                  max={maxTokens}
                                  size="sm"
                                  showLabels={false}
                                  className="w-20"
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {currentCount}/{maxTokens}
                                </span>
                              </div>
                            );
                          } else if (currentCount !== undefined) {
                            return (
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {currentCount}
                              </span>
                            );
                          } else {
                            return <span className="text-xs text-gray-400">No data</span>;
                          }
                        })()}
                      </td>
                      <td>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(wallet.createdAt)}</span>
                      </td>
                      <td>
                        {(() => {
                          const actions: ActionItem[] = [];
                          
                          // Status actions
                          if (wallet.status === WalletStatus.ACTIVE) {
                            actions.push({
                              id: 'pause',
                              label: 'Pause Wallet',
                              icon: <Pause className="w-4 h-4" />,
                              onClick: () => handleStatusUpdate(wallet._id, WalletStatus.PAUSED),
                              variant: 'warning',
                              loading: updateStatusMutation.isPending,
                              title: 'Pause this wallet'
                            });
                          }
                          
                          if (wallet.status === WalletStatus.PAUSED) {
                            actions.push({
                              id: 'activate',
                              label: 'Activate Wallet',
                              icon: <Play className="w-4 h-4" />,
                              onClick: () => handleStatusUpdate(wallet._id, WalletStatus.ACTIVE),
                              variant: 'success',
                              loading: updateStatusMutation.isPending,
                              title: 'Activate this wallet'
                            });
                          }
                          
                          if (wallet.status !== WalletStatus.BANNED && wallet.status !== WalletStatus.ARCHIVED) {
                            actions.push({
                              id: 'ban',
                              label: 'Ban Wallet',
                              icon: <Ban className="w-4 h-4" />,
                              onClick: () => handleStatusUpdate(wallet._id, WalletStatus.BANNED),
                              variant: 'danger',
                              loading: updateStatusMutation.isPending,
                              title: 'Ban this wallet'
                            });
                          }
                          
                          // Utility actions
                          actions.push({
                            id: 'refresh-balance',
                            label: 'Update Balance',
                            icon: <RefreshCw className="w-4 h-4" />,
                            onClick: () => handleForceUpdateBalance(wallet._id),
                            loading: updateSingleBalanceMutation.isPending,
                            title: 'Force update wallet balance'
                          });
                          
                          actions.push({
                            id: 'refresh-tokens',
                            label: 'Refresh Tokens',
                            icon: <Coins className="w-4 h-4" />,
                            onClick: () => refreshTokenCountMutation.mutate(wallet._id),
                            loading: refreshTokenCountMutation.isPending,
                            title: 'Refresh token count'
                          });
                          
                          // Send back to funder action
                          const hasBalance = wallet.nativeTokenBalance && parseFloat(wallet.nativeTokenBalance) > 0;
                          const chainId = wallet.chainId.toString();
                          const funderAddress = funderInfoAll?.funderInfo?.[chainId]?.funderAddress;
                          
                          if (hasBalance && funderAddress) {
                            actions.push({
                              id: 'send-to-funder',
                              label: 'Send to Funder',
                              icon: <DollarSign className="w-4 h-4" />,
                              onClick: () => handleSendBackToFunder(wallet),
                              variant: 'primary',
                              loading: sendBackMutation.isPending,
                              title: 'Send native tokens back to funder'
                            });
                          }
                          
                          // Show Archive or Unarchive based on current view
                          if (showArchived) {
                            actions.push({
                              id: 'unarchive',
                              label: 'Unarchive Wallet',
                              icon: <Archive className="w-4 h-4" />,
                              onClick: () => handleUnarchive(wallet._id),
                              variant: 'success',
                              loading: unarchiveMutation.isPending,
                              title: 'Restore this wallet to active status'
                            });
                          } else {
                            actions.push({
                              id: 'archive',
                              label: 'Archive Wallet',
                              icon: <Archive className="w-4 h-4" />,
                              onClick: () => handleArchive(wallet._id),
                              variant: 'danger',
                              loading: archiveMutation.isPending,
                              title: 'Archive this wallet'
                            });
                          }
                          
                          return <ActionsMenu actions={actions} />;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredWallets.length === 0 && (
              <div className="text-center py-8">
                {showArchived ? (
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                ) : (
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                )}
                <p className="text-gray-500 dark:text-gray-400">
                  {showArchived 
                    ? 'No archived wallets found'
                    : wallets.length === 0 
                      ? 'No wallets found' 
                      : 'No wallets match your filters'
                  }
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {showArchived
                    ? 'Archived wallets will appear here when you archive active wallets'
                    : wallets.length === 0 
                      ? 'Create your first wallet using the generate buttons above'
                      : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Generate Wallet Modal */}
      <GenerateWalletModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={() => {
          setShowGenerateModal(false);
          refetch();
        }}
      />

      {/* Bulk Tag Modal */}
      {showBulkTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Set Tag for {selectedWallets.size} Wallets
              </h3>
              <button
                onClick={() => setShowBulkTagModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag Value
              </label>
              <input
                type="text"
                placeholder="Enter tag value..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={bulkTagValue}
                onChange={(e) => setBulkTagValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBulkSetTag();
                  }
                }}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowBulkTagModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkSetTag}
                loading={updateTagMutation.isPending}
                disabled={!bulkTagValue.trim()}
              >
                <Tag className="w-4 h-4 mr-2" />
                Set Tag
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🧹 Bulk Cleanup Modal with Progress */}
      <BulkCleanupModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        progress={cleanupProgress}
        operation={cleanupOperation}
      />
    </div>
  );
};