import React from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { 
  useFunderInfoAll, 
  useFunderBalanceForChain,
  useFunderStatus
} from '../hooks/useFunding';
import { ChainId } from '../types/wallet';
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
      fallbackLoading
    });
  }, [funderInfoAll, allLoading, allError, fallbackFunderStatus, fallbackLoading]);

  const isLoading = allLoading || fallbackLoading;

  const handleRefresh = () => {
    refetchAll();
    refetchFallback();
    onRefresh?.();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getChainDisplayName = (chainId: number): string => {
    switch (chainId) {
      case ChainId.BASE:
        return 'Base Mainnet';
      case ChainId.SOLANA:
        return 'Solana Mainnet';
      default:
        return `Chain ${chainId}`;
    }
  };

  const getChainIcon = (chainId: number) => {
    switch (chainId) {
      case ChainId.BASE:
        return <Network className="w-4 h-4" />;
      case ChainId.SOLANA:
        return <Network className="w-4 h-4" />;
      default:
        return <Network className="w-4 h-4" />;
    }
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

  // Show Base and Solana mainnet funder information
  if (funderInfoAll?.success && funderInfoAll.funderInfo) {
    // Try different possible chain ID formats
    const baseInfo = funderInfoAll.funderInfo[ChainId.BASE] || 
                    funderInfoAll.funderInfo[ChainId.BASE.toString()] ||
                    funderInfoAll.funderInfo['8453'];
    const solanaInfo = funderInfoAll.funderInfo[ChainId.SOLANA] || 
                      funderInfoAll.funderInfo[ChainId.SOLANA.toString()] ||
                      funderInfoAll.funderInfo['101'];

    // Debug logging
    console.log('🔍 MultiChainFunderStatusCard Debug:', {
      funderInfoAll,
      baseInfo,
      solanaInfo,
      baseChainId: ChainId.BASE,
      solanaChainId: ChainId.SOLANA,
      availableChains: Object.keys(funderInfoAll.funderInfo),
      solanaAvailable: solanaInfo?.available,
      solanaBalance: solanaInfo?.balance,
      solanaAddress: solanaInfo?.funderAddress
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Mainnet */}
          {baseInfo && (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getChainIcon(ChainId.BASE)}
                  <span className="font-medium">
                    {getChainDisplayName(ChainId.BASE)}
                  </span>
                </div>
                {getStatusIcon(baseInfo.available || parseFloat(baseInfo.balance) > 0)}
              </div>

                              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={baseInfo.available || parseFloat(baseInfo.balance) > 0 ? 'text-green-600' : 'text-red-600'}>
                      {baseInfo.available || parseFloat(baseInfo.balance) > 0 ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {parseFloat(baseInfo.balance).toFixed(6)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-24">
                        {baseInfo?.funderAddress?.slice(0, 8) || 'N/A'}...
                      </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(baseInfo.funderAddress, 'Base Address')}
                      className="p-1"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Solana Mainnet */}
          {solanaInfo && (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getChainIcon(ChainId.SOLANA)}
                  <span className="font-medium">
                    {getChainDisplayName(ChainId.SOLANA)}
                  </span>
                </div>
                {getStatusIcon(solanaInfo.available || parseFloat(solanaInfo.balance) > 0)}
              </div>

                              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={solanaInfo.available || parseFloat(solanaInfo.balance) > 0 ? 'text-green-600' : 'text-red-600'}>
                      {solanaInfo.available || parseFloat(solanaInfo.balance) > 0 ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {parseFloat(solanaInfo.balance).toFixed(6)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-24">
                        {solanaInfo?.funderAddress?.slice(0, 8) || 'N/A'}...
                      </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(solanaInfo.funderAddress, 'Solana Address')}
                      className="p-1"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        {funderInfoAll ? 'Data loaded but no funder info found' : 'Failed to load funder information'}
      </div>
    </Card>
  );
};
