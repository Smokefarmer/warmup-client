import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ChainSelector } from '../components/common/ChainSelector';
import { MultiChainFunderStatusCard } from '../components/MultiChainFunderStatusCard';
import { CexBalancesCard } from '../components/CexBalancesCard';
import { VirtualWalletList } from '../components/VirtualWalletList';
import { useFunderStatus, useFunderInfoAll } from '../hooks/useFunding';
import { useWallets, useSellAllTokens, useSendBackToFunder } from '../hooks/useWallets';
import { useMultiChain } from '../hooks/useMultiChain';
import { useCexBalances } from '../hooks/useCexBalances';
import { useFundingProgress } from '../hooks/useFundingProgress';
import { useChain, useChainListener } from '../contexts/ChainContext';
import { WalletService } from '../services/walletService';
import { FundingService } from '../services/fundingService';
import { WalletStatus, WalletType } from '../types/wallet';
import { formatAddress, formatWalletBalance } from '../utils/formatters';
import { isValidSolanaAddress, convertHexToBase58 } from '../utils/validators';
import { findSolanaAddressForEthereum } from '../utils/addressMapping';
import { SUPPORTED_CHAINS } from '../config/chains';
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
  Loader2,
  Tag,
  X
} from 'lucide-react';

export const Funding: React.FC = () => {
  const { selectedChain } = useChain();
  const { data: funderStatus, refetch: refetchFunder } = useFunderStatus();
  const { data: funderInfoAll } = useFunderInfoAll();
  const { data: wallets = [] as any[], isLoading: walletsLoading, refetch: refetchWallets } = useWallets();
  const { getChainName, supportedChains } = useMultiChain();
  
  // Bulk cleanup hooks
  const sellAllMutation = useSellAllTokens();
  const sendBackMutation = useSendBackToFunder();

  // Wallet selection states
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChain, setFilterChain] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showOnlyZeroBalance, setShowOnlyZeroBalance] = useState(false);

  // Filter wallets by selected chain
  const chainFilteredWallets = React.useMemo(() => {
    return wallets.filter((wallet: any) => wallet.chainId === selectedChain.id);
  }, [wallets, selectedChain.id]);

  // Refresh wallets when chain changes
  useChainListener((chainId) => {
    refetchWallets();
    setSelectedWallets(new Set()); // Clear selection when chain changes
  });
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
  
  // 🎲 NEW: Multi-CEX options for BNB
  const [bnbFundingMode, setBnbFundingMode] = useState<'mixer' | 'multiCex'>('mixer');
  const isBnbChain = selectedChain.id === 56;

  // 🎲 NEW: Multi-CEX options for SOL
  const [useSolMultiCex, setUseSolMultiCex] = useState(true); // Default enabled for SOL
  const isSolChain = selectedChain.id === 101;
  
  // CEX balances and selection
  const { balances: cexBalances, loading: cexBalancesLoading, refetch: refetchCexBalances } = useCexBalances();
  const [selectedCexes, setSelectedCexes] = useState<Set<string>>(new Set());
  
  // Funding progress tracking
  const { progress: fundingProgress, startFunding, updateProgress, addSuccess, addFailure, completeFunding, resetProgress } = useFundingProgress();
  
  // Initialize selected CEXes based on availability (only enable those without errors)
  // Note: CEXes with 0 balance are still selectable - the funder wallet will deposit to them first
  useEffect(() => {
    if (cexBalances.length > 0) {
      const availableCexes = new Set<string>();
      const coin = isBnbChain ? 'bnb' : isSolChain ? 'sol' : null;
      
      cexBalances.forEach(cex => {
        if (coin) {
          const balance = cex[coin as 'bnb' | 'sol'];
          // Only exclude CEXes with errors - 0 balance is OK (funder will deposit first)
          if (!balance.error) {
            availableCexes.add(cex.cexName);
          }
        }
      });
      
      // Set available CEXes as selected by default
      if (availableCexes.size > 0) {
        setSelectedCexes(availableCexes);
      }
    }
  }, [cexBalances, isBnbChain, isSolChain]);
  
  // Bulk cleanup states
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState<{
    current: number;
    total: number;
    currentWallet?: string;
    status?: string;
  }>({ current: 0, total: 0 });

  // Get the correct Solana funder address (same logic as WalletManagementActions)
  const getSolanaFunderAddress = (): string | null => {
    console.log('🔍 Debug funder address resolution:', {
      funderInfoAll,
      funderStatus,
      hasFunderInfoAll: !!funderInfoAll,
      hasFunderStatus: !!funderStatus,
      funderInfoAllKeys: funderInfoAll ? Object.keys(funderInfoAll) : 'none',
      funderStatusAddress: funderStatus?.funderAddress
    });

    // For Solana wallets, we MUST get a Solana funder address (base58)
    // First try from funderInfoAll for Solana chain (101)
    if (funderInfoAll?.funderInfo?.['101']?.funderAddress) {
      const solanaFunder = funderInfoAll.funderInfo['101'].funderAddress;
      console.log('✅ Found Solana funder address from funderInfoAll:', solanaFunder);
      return solanaFunder;
    }
    
    // Try other Solana chains (devnet/testnet)
    const solanaChains = ['102', '103']; // devnet, testnet
    for (const chainId of solanaChains) {
      if (funderInfoAll?.funderInfo?.[chainId]?.funderAddress) {
        const solanaFunder = funderInfoAll.funderInfo[chainId].funderAddress;
        console.log(`✅ Found Solana funder address on chain ${chainId}:`, solanaFunder);
        return solanaFunder;
      }
    }
    
    // Last resort: try from funderStatus but we'll need to convert it
    if (funderStatus?.funderAddress) {
      const address = funderStatus.funderAddress;
      console.log('⚠️ Using funderStatus address (might need conversion):', address);
      return address; // Return it even if hex, we'll convert it in the next step
    }
    
    console.log('❌ No funder address found');
    return null;
  };

  // Validate and convert funder address if needed
  const getValidatedFunderAddress = (): string | null => {
    const rawAddress = getSolanaFunderAddress();
    if (!rawAddress) {
      console.log('❌ No raw address to validate');
      return null;
    }

    console.log('🔄 Validating address:', rawAddress);

    // Check if it's already a valid Solana address
    if (isValidSolanaAddress(rawAddress)) {
      console.log('✅ Address is already valid base58:', rawAddress);
      return rawAddress;
    }

    console.log('⚠️ Address is not valid base58, attempting conversion...');

    // Handle Ethereum to Solana address mapping
    if (rawAddress.startsWith('0x')) {
      const solanaAddress = findSolanaAddressForEthereum(rawAddress);
      if (solanaAddress) {
        console.log('🔧 Using mapped Solana address for Ethereum address:', {
          ethereum: rawAddress,
          solana: solanaAddress
        });
        
        // Show a toast to inform the user about the address conversion
        toast.success(`Using Solana funder address: ${solanaAddress.slice(0, 8)}...${solanaAddress.slice(-8)}`);
        
        return solanaAddress;
      } else {
        console.warn('⚠️ No Solana mapping found for Ethereum address:', rawAddress);
      }
    }

    // Try to convert from hex if needed
    const convertedAddress = convertHexToBase58(rawAddress);
    if (convertedAddress && isValidSolanaAddress(convertedAddress)) {
      console.log('✅ Converted funder address from hex to base58:', convertedAddress);
      return convertedAddress;
    }

    console.error('❌ Could not get valid Solana funder address:', rawAddress);
    return null;
  };

  // Get unique tags for filter dropdown
  const uniqueTags = Array.from(new Set(
    wallets
      .filter((wallet: any) => wallet.tag && wallet.tag.trim())
      .map((wallet: any) => wallet.tag!)
  )).sort();

  // Filter available wallets with all filters applied
  const availableWallets = chainFilteredWallets.filter((wallet: any) => {
    // Base filter: exclude only archived wallets (handle both uppercase and lowercase)
    const isArchived = wallet.status === WalletStatus.ARCHIVED;
    if (isArchived) return false;

    // Search filter
    const matchesSearch = !searchTerm || 
      (wallet.publicKey || wallet.address).toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wallet.tag && wallet.tag.toLowerCase().includes(searchTerm.toLowerCase()));

    // Additional chain filter (for backward compatibility with existing filter UI)
    const matchesChain = !filterChain || wallet.chainId === parseInt(filterChain);

    // Type filter
    const matchesType = !selectedType || wallet.type === selectedType;

    // Status filter (additional status filtering beyond active) - handle case insensitive
    const matchesStatus = !selectedStatus || 
      wallet.status === selectedStatus || 
      wallet.status.toLowerCase() === selectedStatus.toLowerCase();

    // Tag filter
    const matchesTag = !selectedTag || 
      (selectedTag === 'no-tag' ? !wallet.tag : wallet.tag === selectedTag);

    // Balance filters
    const balance = parseFloat(wallet.nativeTokenBalance || '0');
    const matchesZeroBalance = !showOnlyZeroBalance || balance === 0;
    const matchesWithBalance = !showOnlyWithBalance || balance > 0;

    return matchesSearch && matchesChain && matchesType && matchesStatus && matchesTag &&
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
      setSelectedWallets(new Set(availableWallets.map((w: any) => w._id)));
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

  // Validate amounts against CEX minimums
  const validateAmountsAgainstCexMinimums = async (
    amounts: number[] | null, 
    selectedCexNames: string[],
    isRandomMode: boolean,
    randomMin?: number,
    randomMax?: number
  ): Promise<{ valid: boolean; errors: string[] }> => {
    const useMultiCex = (isBnbChain && bnbFundingMode === 'multiCex') || (isSolChain && useSolMultiCex);
    if (!useMultiCex || selectedCexNames.length === 0) {
      return { valid: true, errors: [] };
    }

    const currency = isBnbChain ? 'BNB' : isSolChain ? 'SOL' : null;
    if (!currency) {
      return { valid: true, errors: [] };
    }

    try {
      const result = await FundingService.getCexMinimumAmounts(currency);
      if (!result.success || !result.minimums) {
        return { valid: true, errors: [] }; // If we can't get minimums, allow funding
      }

      const minimums = result.minimums;
      const errors: string[] = [];

      // Normalize CEX names to match config keys (lowercase, remove .io)
      const normalizeCexName = (name: string): string => {
        return name.toLowerCase().replace('.io', '').replace(' ', '');
      };

      // Check each selected CEX
      for (const cexName of selectedCexNames) {
        const normalizedName = normalizeCexName(cexName);
        const minimum = minimums[normalizedName] || minimums.default;

        if (isRandomMode && randomMin !== undefined) {
          // For random mode, check if minAmount is below minimum
          if (randomMin < minimum) {
            errors.push(
              `❌ ${cexName}: Minimum amount ${randomMin.toFixed(6)} ${currency} is below withdrawal requirement of ${minimum} ${currency}. ` +
              `Please set minimum to at least ${minimum} ${currency}.`
            );
          }
        } else if (amounts && amounts.length > 0) {
          // For fixed amounts, check if any amount is below minimum
          const tooLowAmounts = amounts.filter(amt => amt < minimum);
          if (tooLowAmounts.length > 0) {
            const minAmount = Math.min(...amounts);
            errors.push(
              `❌ ${cexName}: Amount ${minAmount.toFixed(6)} ${currency} is below minimum withdrawal requirement of ${minimum} ${currency}. ` +
              `Please use at least ${minimum} ${currency} per wallet.`
            );
          }
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      // If validation fails, allow funding but log warning
      console.warn('Failed to validate amounts against CEX minimums:', error);
      return { valid: true, errors: [] };
    }
  };

  // Unified funding function with Multi-CEX support
  const startFundingProcess = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    if ((amountMode === 'FIXED' && fixedAmount <= 0) || 
        (amountMode === 'RANDOM' && (minAmount <= 0 || maxAmount <= 0 || minAmount >= maxAmount))) {
      toast.error('Please enter valid funding amounts');
      return;
    }

    // Validate: All selected wallets must be on the same chain as selected chain
    const selectedWalletsList = Array.from(selectedWallets)
      .map(id => availableWallets.find((w: any) => w._id === id))
      .filter((w: any) => w);
    
    const mismatchedWallets = selectedWalletsList.filter((w: any) => w!.chainId !== selectedChain.id);
    if (mismatchedWallets.length > 0) {
      const chainName = selectedChain.name;
      const wrongChainNames = mismatchedWallets.map(w => {
        const walletChain = Object.values(SUPPORTED_CHAINS).find(c => c.id === w!.chainId);
        return walletChain?.name || `Chain ${w!.chainId}`;
      }).join(', ');
      
      toast.error(
        `⚠️ Chain mismatch! You selected ${chainName} but ${mismatchedWallets.length} wallet(s) are on ${wrongChainNames}. Please select wallets matching your chosen chain.`,
        { duration: 6000 }
      );
      return;
    }

    // Check if Multi-CEX is enabled and has selected CEXes
    const useMultiCex = (isBnbChain && bnbFundingMode === 'multiCex') || (isSolChain && useSolMultiCex);
    if (useMultiCex && selectedCexes.size === 0) {
      toast.error('Please select at least one CEX for Multi-CEX funding');
      return;
    }

    // Validate amounts against CEX minimums before starting funding
    const amounts = amountMode === 'FIXED' ? getFundingAmounts() : null;
    const validation = await validateAmountsAgainstCexMinimums(
      amounts, 
      Array.from(selectedCexes),
      amountMode === 'RANDOM',
      amountMode === 'RANDOM' ? minAmount : undefined,
      amountMode === 'RANDOM' ? maxAmount : undefined
    );
    if (!validation.valid) {
      // Show all validation errors
      validation.errors.forEach(error => toast.error(error, { duration: 6000 }));
      return;
    }

    setIsFunding(true);
    startFunding(selectedWallets.size);

    try {
      const walletIds = Array.from(selectedWallets);
      const amounts = getFundingAmounts();

      // Use Multi-CEX if enabled
      if (useMultiCex) {
        const requestBody: any = {
          walletIds,
          chainId: selectedChain.id,
          useMultiCex: true,
          selectedCexes: Array.from(selectedCexes), // Pass selected CEXes
        };

        if (amountMode === 'RANDOM') {
          requestBody.randomizeAmounts = true;
          requestBody.amountRange = {
            min: minAmount,
            max: maxAmount,
          };
        } else {
          requestBody.amounts = amounts;
          requestBody.randomizeAmounts = false;
        }

        // Call API (will show progress via polling or WebSocket in future)
        const result = await FundingService.fundSelectedWalletsMultiCex(requestBody);
        
        completeFunding();
        
        if (result.success) {
          const totalAmount = amountMode === 'RANDOM' 
            ? ((minAmount + maxAmount) / 2 * walletIds.length).toFixed(3)
            : amounts.reduce((sum, amt) => sum + amt, 0).toFixed(3);
          toast.success(`🎲 Multi-CEX funded ${walletIds.length} wallets with ~${totalAmount} ${selectedChain.symbol} total`);
          setSelectedWallets(new Set());
          refetchWallets();
        } else {
          toast.error(`❌ Multi-CEX funding failed: ${(result as any).message || 'Unknown error'}`);
        }
      } else {
        // Legacy direct funding (for BNB mixer mode)
        const result = await FundingService.fundSelectedWallets(walletIds, selectedChain.id, amounts);
        
        completeFunding();
        
        if (result.success) {
          const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
          toast.success(`✅ Funded ${walletIds.length} wallets with ${totalAmount.toFixed(3)} ${selectedChain.symbol} total`);
          setSelectedWallets(new Set());
          refetchWallets();
        } else {
          toast.error(`❌ Funding failed: ${(result as any).message || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      completeFunding();
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
        useStealthTransfers
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
          `🎯 Mixed funding completed! ${cexWallets} CEX + ${stealthWallets} Stealth wallets (${totalAmount.toFixed(3)} ${selectedChain.symbol} total)`
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

    const chainWallets = Array.from(selectedWallets)
      .map(id => availableWallets.find((w: any) => w._id === id))
      .filter((w: any) => w && w.chainId === selectedChain.id);

    if (chainWallets.length === 0) {
      toast.error(`No ${selectedChain.name} wallets selected on this chain.`);
      return;
    }

    setIsCleaningUp(true);
    setCleanupProgress({ current: 0, total: chainWallets.length, status: 'Selling tokens...' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < chainWallets.length; i++) {
      const wallet = chainWallets[i];
      if (!wallet) {
        console.error('Wallet is undefined at index:', i);
        failCount++;
        continue;
      }

      setCleanupProgress({ 
        current: i + 1, 
        total: chainWallets.length, 
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
      if (i < chainWallets.length - 1) {
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

    const validatedFunderAddress = getValidatedFunderAddress();
    if (!validatedFunderAddress) {
      toast.error(`No valid ${selectedChain.name} funder address available`);
      return;
    }

    const chainWallets = Array.from(selectedWallets)
      .map(id => availableWallets.find((w: any) => w._id === id))
      .filter((w: any) => w && w.chainId === selectedChain.id);

    if (chainWallets.length === 0) {
      toast.error(`No ${selectedChain.name} wallets selected on this chain.`);
      return;
    }

    setIsCleaningUp(true);
    setCleanupProgress({ current: 0, total: chainWallets.length, status: 'Sending back to funder...' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < chainWallets.length; i++) {
      const wallet = chainWallets[i];
      if (!wallet) {
        console.error('Wallet is undefined at index:', i);
        failCount++;
        continue;
      }

      setCleanupProgress({ 
        current: i + 1, 
        total: chainWallets.length, 
        currentWallet: formatAddress(wallet.publicKey || wallet.address),
        status: 'Sending back to funder...'
      });

      try {
        await sendBackMutation.mutateAsync({
          walletId: wallet._id,
          funderAddress: validatedFunderAddress
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send back to funder for wallet ${wallet._id}:`, error);
        failCount++;
      }

      // Small delay between wallets
      if (i < chainWallets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsCleaningUp(false);
    setCleanupProgress({ current: 0, total: 0 });

    if (successCount > 0) {
      toast.success(`Successfully sent back ${selectedChain.symbol} from ${successCount} wallet${successCount !== 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to send back ${selectedChain.symbol} from ${failCount} wallet${failCount !== 1 ? 's' : ''}`);
    }

    refetchWallets();
  };

  const handleBulkCleanup = async () => {
    if (selectedWallets.size === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const chainWallets = Array.from(selectedWallets)
      .map(id => availableWallets.find((w: any) => w._id === id))
      .filter((w: any) => w && w.chainId === selectedChain.id);

    if (chainWallets.length === 0) {
      toast.error(`No ${selectedChain.name} wallets selected on this chain.`);
      return;
    }

    const validatedFunderAddress = getValidatedFunderAddress();
    if (!validatedFunderAddress) {
      toast.error(`No valid ${selectedChain.name} funder address available`);
      return;
    }

    setIsCleaningUp(true);
    setCleanupProgress({ current: 0, total: chainWallets.length * 2, status: 'Starting cleanup...' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < chainWallets.length; i++) {
      const wallet = chainWallets[i];
      if (!wallet) {
        console.error('Wallet is undefined at index:', i);
        failCount++;
        continue;
      }
      
      // Step 1: Sell all tokens
      setCleanupProgress({ 
        current: i * 2 + 1, 
        total: chainWallets.length * 2, 
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
        total: chainWallets.length * 2, 
        currentWallet: formatAddress(wallet.publicKey || wallet.address),
        status: 'Sending back to funder...'
      });

      try {
        await sendBackMutation.mutateAsync({
          walletId: wallet._id,
          funderAddress: validatedFunderAddress
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send back to funder for wallet ${wallet._id}:`, error);
        failCount++;
      }

      // Small delay between wallets
      if (i < chainWallets.length - 1) {
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Funding System</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
              <span className="text-lg">{selectedChain.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedChain.name}
              </span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fund {selectedChain.name} wallets with {selectedChain.symbol} • {chainFilteredWallets.length} wallets available
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

      {/* CEX Balances Card */}
      <CexBalancesCard />

      {/* Bulk Actions - Redesigned for Better UX */}
      {selectedWallets.size > 0 && (
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
                  {selectedWallets.size} wallet{selectedWallets.size !== 1 ? 's' : ''} selected • {Array.from(selectedWallets).map(id => availableWallets.find((w: any) => w._id === id)).filter((w: any) => w && w.chainId === selectedChain.id).length} {selectedChain.name} wallets
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

            {/* Action Buttons - Organized in Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Cleanup Actions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cleanup Actions
                </p>
                <Button
                  variant="secondary"
                  onClick={handleBulkSellAllTokens}
                  disabled={isCleaningUp || isFunding}
                  className="w-full justify-start"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Sell All Tokens
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleBulkSendBackToFunder}
                  disabled={isCleaningUp || isFunding || !getValidatedFunderAddress()}
                  className="w-full justify-start"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Send to Funder
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBulkCleanup}
                  disabled={isCleaningUp || isFunding || !getValidatedFunderAddress()}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Full Cleanup
                </Button>
              </div>

              {/* Info Panel */}
              <div className="md:col-span-2 space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wider">
                    💡 Quick Guide
                  </p>
                  <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                    <p><strong>Sell All Tokens:</strong> Convert all token holdings to {selectedChain.symbol}</p>
                    <p><strong>Send to Funder:</strong> Transfer {selectedChain.symbol} balance back to funder wallet</p>
                    <p><strong>Full Cleanup:</strong> Sell tokens + send to funder (complete wallet reset)</p>
                  </div>
                </div>
                
                {!getValidatedFunderAddress() && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      ⚠️ Funder address not available. Some actions are disabled.
                    </p>
                  </div>
                )}
              </div>
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
              {availableWallets.length} of {chainFilteredWallets.length} {selectedChain.name} wallets shown
              {chainFilteredWallets.length !== wallets.length && (
                <span className="ml-1 text-gray-400">({wallets.length} total across all chains)</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by address, type, or tag..."
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
                value={filterChain}
                onChange={(e) => setFilterChain(e.target.value)}
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

            {/* Tag Filter */}
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
          {(searchTerm || filterChain || selectedType || selectedStatus || selectedTag || showOnlyZeroBalance || showOnlyWithBalance) && (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterChain('');
                  setSelectedType('');
                  setSelectedStatus('');
                  setSelectedTag('');
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
                  {availableWallets.map((wallet: any) => (
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
                          {wallet.tag && (
                            <>
                              <span>•</span>
                              <div className="flex items-center">
                                <Tag className="w-3 h-3 text-blue-500 mr-1" />
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {wallet.tag}
                                </span>
                              </div>
                            </>
                          )}
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

            {/* 🎲 BNB Multi-CEX Mode Selection */}
            {isBnbChain && (
              <div className="space-y-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  🎲 BNB Funding Method
                </h4>
                <div className="space-y-2">
                  <label className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-800" 
                    style={{ 
                      borderColor: bnbFundingMode === 'mixer' ? '#f59e0b' : '#d1d5db',
                      backgroundColor: bnbFundingMode === 'mixer' ? '#fef3c7' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="bnbFundingMode"
                      value="mixer"
                      checked={bnbFundingMode === 'mixer'}
                      onChange={() => setBnbFundingMode('mixer')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        🔒 Privacy Mixer (BNB → USDT → BNB)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        3-step mixer for maximum privacy • BlockRazor bundling
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-800"
                    style={{ 
                      borderColor: bnbFundingMode === 'multiCex' ? '#f59e0b' : '#d1d5db',
                      backgroundColor: bnbFundingMode === 'multiCex' ? '#fef3c7' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="bnbFundingMode"
                      value="multiCex"
                      checked={bnbFundingMode === 'multiCex'}
                      onChange={() => setBnbFundingMode('multiCex')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        🎲 Multi-CEX Rotation (Random CEX per wallet)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Randomly rotates between MEXC, LBank, KuCoin, Gate.io • Better privacy through CEX distribution
                      </div>
                    </div>
                  </label>
                </div>
                
                {bnbFundingMode === 'multiCex' && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ℹ️ <strong>Multi-CEX Mode:</strong> Each wallet gets funded from a randomly selected CEX. 
                      Configure at least one CEX in your .env file (MEXC, LBank, KuCoin, or Gate.io).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 🎲 SOL Multi-CEX Toggle */}
            {isSolChain && (
              <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    🎲 SOL Funding Method
                  </h4>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSolMultiCex}
                      onChange={(e) => setUseSolMultiCex(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Enable Multi-CEX Rotation
                    </span>
                  </label>
                </div>

                {useSolMultiCex ? (
                  <div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                      <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                        🎲 Multi-CEX Rotation (Random CEX per wallet)
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        Each wallet funded from random CEX: MEXC, LBank, KuCoin, or Gate.io • Maximum privacy through distribution
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mt-2">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        ℹ️ <strong>Multi-CEX Mode:</strong> Each wallet gets funded from a randomly selected CEX. 
                        Configure at least one CEX in your .env file (MEXC, LBank, KuCoin, or Gate.io).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      🔒 Direct Wallet Funding
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Standard direct SOL transfer from funder wallet
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  🎲 Random Range {bnbFundingMode === 'multiCex' && '(Recommended for Multi-CEX)'}
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
                  <span className="text-sm text-gray-500">{selectedChain.symbol}</span>
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
                      <span className="text-sm text-gray-500">{selectedChain.symbol}</span>
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
                      <span className="text-sm text-gray-500">{selectedChain.symbol}</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 Each wallet will get a random amount between {minAmount} - {maxAmount} {selectedChain.symbol}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CEX Selection (when Multi-CEX is enabled) */}
            {((isBnbChain && bnbFundingMode === 'multiCex') || (isSolChain && useSolMultiCex)) && (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  🎯 Select CEXes for Multi-CEX Rotation
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Each wallet will be randomly assigned to one of the selected CEXes below
                </p>
                
                {cexBalancesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading CEX balances...</span>
                  </div>
                ) : cexBalances.length === 0 ? (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ No CEX configured. Add CEX credentials to .env file to use Multi-CEX funding.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {cexBalances.map((cex) => {
                      const coin = isBnbChain ? 'bnb' : isSolChain ? 'sol' : null;
                      const balance = coin ? cex[coin as 'bnb' | 'sol'] : null;
                      // CEX is available if it has no error (0 balance is OK - funder will deposit first)
                      const isAvailable = balance && !balance.error;
                      const hasBalance = balance && balance.available > 0;
                      const isSelected = selectedCexes.has(cex.cexName);
                      
                      return (
                        <label
                          key={cex.cexName}
                          className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isAvailable
                              ? isSelected
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (isAvailable) {
                                setSelectedCexes(prev => {
                                  const newSet = new Set(prev);
                                  if (e.target.checked) {
                                    newSet.add(cex.cexName);
                                  } else {
                                    newSet.delete(cex.cexName);
                                  }
                                  return newSet;
                                });
                              }
                            }}
                            disabled={!isAvailable}
                            className="mt-1 mr-2"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 flex items-center">
                              {cex.cexName}
                              {balance?.error && (
                                <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                  ⚠️ Unavailable
                                </span>
                              )}
                            </div>
                            {balance?.error ? (
                              <div className="mt-1 space-y-1">
                                <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                                  API Error
                                </div>
                                <div 
                                  className="text-xs text-red-500 dark:text-red-400 break-words"
                                  title={balance.error}
                                >
                                  {balance.error.length > 50 ? balance.error.substring(0, 50) + '...' : balance.error}
                                </div>
                              </div>
                            ) : balance ? (
                              <div className="text-xs mt-1">
                                {hasBalance ? (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    ✅ {balance.available.toFixed(4)} {coin?.toUpperCase()} available
                                  </span>
                                ) : (
                                  <span className="text-yellow-600 dark:text-yellow-400">
                                    💰 0 {coin?.toUpperCase()} - will be funded first
                                  </span>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                
                {selectedCexes.size === 0 && cexBalances.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      ⚠️ Please select at least one available CEX to proceed with funding
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Funding Progress Display */}
            {fundingProgress.isFunding && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      Funding in progress...
                    </span>
                  </div>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {fundingProgress.currentIndex} / {fundingProgress.totalWallets}
                  </span>
                </div>
                
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${fundingProgress.progress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-300">
                    {fundingProgress.currentWallet && (
                      <>Funding: {formatAddress(fundingProgress.currentWallet)}</>
                    )}
                    {fundingProgress.currentCex && (
                      <> via {fundingProgress.currentCex}</>
                    )}
                  </span>
                  <div className="flex items-center space-x-4 text-blue-600 dark:text-blue-400">
                    <span>✅ {fundingProgress.successful}</span>
                    <span>❌ {fundingProgress.failed}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Start Funding Button */}
            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={startFundingProcess}
                loading={isFunding}
                disabled={selectedWallets.size === 0 || ((isBnbChain && bnbFundingMode === 'multiCex') || (isSolChain && useSolMultiCex)) && selectedCexes.size === 0}
                className="w-full"
                size="lg"
              >
                <Target className="w-5 h-5 mr-2" />
                {isFunding ? 'Funding...' : `Start Funding ${selectedWallets.size} Wallet${selectedWallets.size !== 1 ? 's' : ''}`}
              </Button>
            </div>

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
                      <p>💰 Total: {(selectedWallets.size * fixedAmount).toFixed(3)} {selectedChain.symbol} (fixed)</p>
                    ) : (
                      <p>💰 Total: ~{((selectedWallets.size * (minAmount + maxAmount)) / 2).toFixed(3)} {selectedChain.symbol} (avg random)</p>
                    )}
                    <p>🎲 Amounts: {amountMode === 'FIXED' ? `${fixedAmount} ${selectedChain.symbol} each` : `${minAmount}-${maxAmount} ${selectedChain.symbol} random`}</p>
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