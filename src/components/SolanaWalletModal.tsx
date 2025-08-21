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

interface SolanaWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (wallet: any) => void;
}

export const SolanaWalletModal: React.FC<SolanaWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    generateSolanaWallet,
    generateSolanaWalletsBatch,
  } = useMultiChain();

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [formData, setFormData] = useState({
    // Single wallet
    type: WalletType.TREND_TRADER,
    chainId: ChainId.SOLANA_DEVNET,
    
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
        toast.success('Solana wallet generated successfully!');
        onSuccess(result);
      } else {
        const result = await generateSolanaWalletsBatch(
          formData.count,
          formData.chainId,
          formData.typeDistribution
        );
        toast.success(`${formData.count} Solana wallets generated successfully!`);
        onSuccess(result);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Solana wallet generation failed:', error);
      // Error is already handled by the hook
    } finally {
      setIsGenerating(false);
    }
  };

  const getChainName = (chainId: ChainId) => {
    switch (chainId) {
      case ChainId.SOLANA:
        return 'Solana Mainnet';
      case ChainId.SOLANA_DEVNET:
        return 'Solana Devnet';
      case ChainId.SOLANA_TESTNET:
        return 'Solana Testnet';
      default:
        return 'Unknown';
    }
  };

  const totalDistribution = Object.values(formData.typeDistribution).reduce((sum, count) => sum + count, 0);

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
                  Generate Solana Wallets
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Generation Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('single')}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      mode === 'single'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium text-sm">Single Wallet</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Generate one wallet</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('batch')}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      mode === 'batch'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium text-sm">Batch Generation</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Generate multiple wallets</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Chain Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Solana Network
                </label>
                <select
                  value={formData.chainId}
                  onChange={(e) => handleInputChange('chainId', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value={ChainId.SOLANA}>Solana Mainnet</option>
                  <option value={ChainId.SOLANA_DEVNET}>Solana Devnet</option>
                  <option value={ChainId.SOLANA_TESTNET}>Solana Testnet</option>
                </select>
              </div>

              {mode === 'single' ? (
                /* Single Wallet Generation */
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
              ) : (
                /* Batch Generation */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Wallets
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.count}
                      onChange={(e) => handleInputChange('count', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type Distribution
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(formData.typeDistribution).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                          <span className="text-sm font-medium capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <input
                            type="number"
                            min="0"
                            max={formData.count}
                            value={count}
                            onChange={(e) => handleTypeDistributionChange(type, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Total: {totalDistribution} / {formData.count}
                      {totalDistribution !== formData.count && (
                        <span className="text-red-500 ml-2">
                          (Distribution must equal total count)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Network Information */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Network Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Network:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {getChainName(formData.chainId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Native Token:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">SOL</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Decimals:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">9</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">SOLANA</span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              variant="primary"
              onClick={handleSubmit}
              loading={isGenerating}
              disabled={isGenerating || (mode === 'batch' && totalDistribution !== formData.count)}
              className="w-full sm:w-auto sm:ml-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              {mode === 'single' ? 'Generate Wallet' : `Generate ${formData.count} Wallets`}
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
