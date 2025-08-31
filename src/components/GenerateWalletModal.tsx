import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from './common/Button';
import { useMultiChain } from '../hooks/useMultiChain';
import { ChainId, WalletType } from '../types/wallet';
import { 
  Wallet, 
  Plus, 
  X,
  Users,
  Settings
} from 'lucide-react';

interface GenerateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (wallet: any) => void;
}

export const GenerateWalletModal: React.FC<GenerateWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    generateSolanaWallet,
    generateSolanaWalletsBatch,
    supportedChains,
    getChainName: getChainNameFromService,
  } = useMultiChain();

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [formData, setFormData] = useState({
    // Single wallet
    type: WalletType.TREND_TRADER,
    chainId: ChainId.BASE,
    
    // Batch generation
    count: 5,
    typeDistribution: {
      trendTrader: 2,
      majorTrader: 1,
      holder: 1,
      trencher: 1
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeDistributionChange = (type: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      typeDistribution: {
        ...prev.typeDistribution,
        [type]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      if (mode === 'single') {
        const result = await generateSolanaWallet(formData.type, formData.chainId);
        toast.success(`Wallet generated successfully on ${getChainNameFromService(formData.chainId)}!`);
        onSuccess(result);
      } else {
        const result = await generateSolanaWalletsBatch(
          formData.count,
          formData.chainId,
          formData.typeDistribution
        );
        toast.success(`${formData.count} wallets generated successfully on ${getChainNameFromService(formData.chainId)}!`);
        onSuccess(result);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Wallet generation failed:', error);
      // Error is already handled by the hook
    } finally {
      setIsGenerating(false);
    }
  };

  const getChainInfo = (chainId: ChainId) => {
    const chain = supportedChains?.find(c => (c.chainId || c.id) === chainId);
    if (!chain) return null;

    return {
      name: chain.name || getChainNameFromService(chainId),
      nativeCurrency: chain.nativeCurrency?.symbol || 'ETH',
      type: chain.type || 'EVM',
      decimals: chain.nativeCurrency?.decimals || 18
    };
  };

  const totalDistribution = Object.values(formData.typeDistribution).reduce((sum, count) => sum + count, 0);
  const selectedChainInfo = getChainInfo(formData.chainId);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Wallet className="w-6 h-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Generate Wallets
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Tip:</strong> For advanced wallet generation with strategic distribution and intelligent delays, 
                use the <strong>Strategic Generation</strong> feature in the Wallets page.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Chain Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Network
                </label>
                <select
                  value={formData.chainId}
                  onChange={(e) => handleInputChange('chainId', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {supportedChains?.map((chain) => (
                    <option key={chain.chainId || chain.id} value={chain.chainId || chain.id}>
                      {chain.name || getChainNameFromService(chain.chainId || chain.id)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Simplified form - just wallet type and count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wallet Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value={WalletType.TREND_TRADER}>Trend Trader</option>
                  <option value={WalletType.MAJOR_TRADER}>Major Trader</option>
                  <option value={WalletType.HOLDER}>Holder</option>
                  <option value={WalletType.TRENCHER}>Trencher</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Wallets
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={mode === 'single' ? 1 : formData.count}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 1;
                    setMode(count === 1 ? 'single' : 'batch');
                    handleInputChange('count', count);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For more than 10 wallets, use Strategic Generation
                </p>
              </div>

              {/* Network Information */}
              {selectedChainInfo && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Network Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Network:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {selectedChainInfo.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Native Token:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {selectedChainInfo.nativeCurrency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Decimals:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {selectedChainInfo.decimals}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">
                        {selectedChainInfo.type}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              variant="primary"
              onClick={handleSubmit}
              loading={isGenerating}
              disabled={isGenerating}
              className="w-full sm:w-auto sm:ml-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              {formData.count === 1 ? 'Generate Wallet' : `Generate ${formData.count} Wallets`}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto mt-3 sm:mt-0"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
