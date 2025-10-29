import React from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { 
  useFunderInfoAll, 
  useFunderBalanceForChain,
  useFunderStatus,
  useCexBalance
} from '../hooks/useFunding';
import { ChainId } from '../types/wallet';
import { 
  getChainName, 
  getChainSymbol as getChainSymbolFromConfig,
  SUPPORTED_CHAINS 
} from '../config/chains';
import { 
  DollarSign, 
  Copy, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Network
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MultiChainFunderStatusCardProps {
  onRefresh?: () => void;
}

export const MultiChainFunderStatusCard: React.FC<MultiChainFunderStatusCardProps> = ({
  onRefresh
}) => {
  // Get funder information for all chains
  const { 
    data: funderInfoAll, 
    isLoading: allLoading, 
    refetch: refetchAll,
    error: allError
  } = useFunderInfoAll();

  // Fallback to old funder status if new endpoint fails
  const { 
    data: fallbackFunderStatus, 
    isLoading: fallbackLoading, 
    refetch: refetchFallback
  } = useFunderStatus();

  // Get CEX balance
  const { 
    data: cexBalance, 
    isLoading: cexLoading, 
    refetch: refetchCex,
    error: cexError
  } = useCexBalance();

  // Debug logging for API call
  React.useEffect(() => {
    console.log('🔍 MultiChainFunderStatusCard API Debug:', {
      funderInfoAll,
      allLoading,
      allError,
      hasData: !!funderInfoAll,
      success: funderInfoAll?.success,
      funderInfo: funderInfoAll?.funderInfo,
      fallbackFunderStatus,
      fallbackLoading,
      cexBalance,
      cexLoading,
      cexError
    });
  }, [funderInfoAll, allLoading, allError, fallbackFunderStatus, fallbackLoading, cexBalance, cexLoading, cexError]);

  const isLoading = allLoading || fallbackLoading;

  const handleRefresh = () => {
    refetchAll();
    refetchFallback();
    refetchCex();
    onRefresh?.();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getChainConfig = (chainId: number) => {
    return Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId);
  };

  const getChainDisplayName = (chainId: number): string => {
    // Use the existing helper function from chains.ts
    return getChainName(chainId);
  };

  const getChainIcon = (chainId: number) => {
    const config = getChainConfig(chainId);
    return config?.icon ? <span className="text-lg">{config.icon}</span> : <Network className="w-4 h-4" />;
  };

  const getChainSymbol = (chainId: number): string => {
    // Use the existing helper function from chains.ts
    return getChainSymbolFromConfig(chainId);
  };

  const getStatusIcon = (isAvailable: boolean) => {
    return isAvailable ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  // Show all chain funder information dynamically
  if (funderInfoAll?.success && funderInfoAll.funderInfo) {
    // Get all chains from API response, excluding testnets
    const chainInfos: Array<{ chainId: number; info: any }> = [];
    
    // Iterate through all funder info entries
    Object.entries(funderInfoAll.funderInfo).forEach(([chainIdStr, info]) => {
      const chainId = parseInt(chainIdStr);
      
      // Filter out testnets (Solana Devnet=102, Solana Testnet=103, Base Sepolia=84532)
      const isTestnet = chainId === 102 || chainId === 103 || chainId === 84532;
      
      // Only include mainnet chains with valid info
      if (!isNaN(chainId) && info && !isTestnet) {
        chainInfos.push({ chainId, info });
      }
    });

    // Sort by chain priority (SOL, BNB, then others)
    chainInfos.sort((a, b) => {
      const priority = (id: number) => {
        if (id === ChainId.SOLANA) return 1;
        if (id === ChainId.BSC) return 2;
        if (id === ChainId.BASE) return 3;
        return 99;
      };
      return priority(a.chainId) - priority(b.chainId);
    });

    // Debug logging
    console.log('🔍 MultiChainFunderStatusCard Debug:', {
      funderInfoAll,
      chainInfos,
      availableChains: Object.keys(funderInfoAll.funderInfo),
    });

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Funder Status</h3>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dynamically render all chains */}
          {chainInfos.map(({ chainId, info }) => {
            const isAvailable = info.available || parseFloat(info.balance || '0') > 0;
            const chainName = getChainDisplayName(chainId);
            const chainSymbol = getChainSymbol(chainId);
            
            return (
              <div key={chainId} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getChainIcon(chainId)}
                    <span className="font-medium">
                      {chainName}
                    </span>
                  </div>
                  {getStatusIcon(isAvailable)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={isAvailable ? 'text-green-600' : 'text-red-600'}>
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {parseFloat(info.balance || '0').toFixed(6)} {chainSymbol}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-24">
                        {info?.funderAddress?.slice(0, 8) || 'N/A'}...
                      </span>
                      {info?.funderAddress && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => copyToClipboard(info.funderAddress, `${chainName} Address`)}
                          className="p-1"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CEX Balance */}
          {cexBalance?.success && (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">
                    {cexBalance.exchange} CEX
                  </span>
                </div>
                {getStatusIcon(cexBalance.total > 0)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={cexBalance.total > 0 ? 'text-green-600' : 'text-red-600'}>
                    {cexBalance.total > 0 ? 'Available' : 'Empty'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cexBalance.available.toFixed(6)} {cexBalance.currency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cexBalance.total.toFixed(6)} {cexBalance.currency}
                    </span>
                  </div>
                </div>

                {cexBalance.frozen > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Frozen:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-yellow-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {cexBalance.frozen.toFixed(6)} {cexBalance.currency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date().toLocaleString()}
        </div>
      </Card>
    );
  }

  // Fallback: Show old funder status data if new endpoint fails
  if (fallbackFunderStatus && !funderInfoAll?.success) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Funder Status (Legacy)</h3>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Base Mainnet - Using legacy data */}
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getChainIcon(ChainId.BASE)}
                <span className="font-medium">
                  {getChainDisplayName(ChainId.BASE)}
                </span>
              </div>
              {getStatusIcon(fallbackFunderStatus.available)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={fallbackFunderStatus.available ? 'text-green-600' : 'text-red-600'}>
                  {fallbackFunderStatus.available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {fallbackFunderStatus.balance}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-24">
                    {fallbackFunderStatus?.funderAddress?.slice(0, 8) || 'N/A'}...
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(fallbackFunderStatus.funderAddress, 'Base Address')}
                    className="p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Solana Mainnet - Placeholder */}
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getChainIcon(ChainId.SOLANA)}
                <span className="font-medium">
                  {getChainDisplayName(ChainId.SOLANA)}
                </span>
              </div>
              <XCircle className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className="text-gray-500">Not Available</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    --
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-24">
                    Not configured
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CEX Balance */}
          {cexBalance?.success && (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">
                    {cexBalance.exchange} CEX
                  </span>
                </div>
                {getStatusIcon(cexBalance.total > 0)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={cexBalance.total > 0 ? 'text-green-600' : 'text-red-600'}>
                    {cexBalance.total > 0 ? 'Available' : 'Empty'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cexBalance.available.toFixed(6)} {cexBalance.currency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cexBalance.total.toFixed(6)} {cexBalance.currency}
                    </span>
                  </div>
                </div>

                {cexBalance.frozen > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Frozen:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-yellow-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {cexBalance.frozen.toFixed(6)} {cexBalance.currency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Using legacy funder status - new multi-chain endpoint not available
        </div>
      </Card>
    );
  }

  // Fallback for error state or no data
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Funder Status</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Base Mainnet - Fallback */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getChainIcon(ChainId.BASE)}
              <span className="font-medium">
                {getChainDisplayName(ChainId.BASE)}
              </span>
            </div>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <span className="text-red-600">Loading...</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  --
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-24">
                  Loading...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Solana Mainnet - Fallback */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getChainIcon(ChainId.SOLANA)}
              <span className="font-medium">
                {getChainDisplayName(ChainId.SOLANA)}
              </span>
            </div>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <span className="text-red-600">Loading...</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  --
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-24">
                  Loading...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CEX Balance */}
        {cexBalance?.success && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  {cexBalance.exchange} CEX
                </span>
              </div>
              {getStatusIcon(cexBalance.total > 0)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={cexBalance.total > 0 ? 'text-green-600' : 'text-red-600'}>
                  {cexBalance.total > 0 ? 'Available' : 'Empty'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Available:</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {cexBalance.available.toFixed(6)} {cexBalance.currency}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {cexBalance.total.toFixed(6)} {cexBalance.currency}
                  </span>
                </div>
              </div>

              {cexBalance.frozen > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Frozen:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-yellow-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cexBalance.frozen.toFixed(6)} {cexBalance.currency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        {funderInfoAll ? 'Data loaded but no funder info found' : 'Failed to load funder information'}
      </div>
    </Card>
  );
};
