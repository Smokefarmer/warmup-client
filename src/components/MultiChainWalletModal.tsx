import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from './common/Button';
import { useMultiChain } from '../hooks/useMultiChain';
import { ChainId, WalletType } from '../types/wallet';
import { validateAddress, getChainName, getChainDecimals } from '../config/chains';
import { 
  Wallet, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface MultiChainWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (wallet: any) => void;
}

export const MultiChainWalletModal: React.FC<MultiChainWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    supportedChains,
    createWalletMutation,
    getChainName: getChainNameFromService,
    validateAddress: validateAddressFromService,
  } = useMultiChain();

  const [formData, setFormData] = useState({
    publicKey: '',
    chainId: ChainId.BASE,
    type: WalletType.TREND_TRADER,
    privateKey: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.publicKey.trim()) {
      newErrors.publicKey = 'Public key is required';
    } else if (!validateAddressFromService(formData.publicKey, formData.chainId)) {
      newErrors.publicKey = `Invalid address format for ${getChainNameFromService(formData.chainId)}`;
    }

    if (!formData.chainId) {
      newErrors.chainId = 'Chain selection is required';
    }

    if (!formData.type) {
      newErrors.type = 'Wallet type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const walletData = {
        publicKey: formData.publicKey,
        chainId: formData.chainId,
        type: formData.type,
        chainSpecificData: {
          [formData.chainId]: {
            privateKey: formData.privateKey || '',
          }
        }
      };

      const result = await createWalletMutation.mutateAsync(walletData);
      
      toast.success(`Wallet created successfully on ${getChainNameFromService(formData.chainId)}`);
      onSuccess(result);
      
      // Reset form
      setFormData({
        publicKey: '',
        chainId: ChainId.BASE,
        type: WalletType.TREND_TRADER,
        privateKey: ''
      });
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error('Wallet creation failed:', error);
      // Error is already handled by the mutation
    }
  };

  const getAddressPlaceholder = () => {
    if (formData.chainId === ChainId.BASE) {
      return "0x1234...";
    } else if (formData.chainId === ChainId.SOLANA) {
      return "ABC123...";
    }
    return "Enter public key";
  };

  const getAddressValidationMessage = () => {
    if (!formData.publicKey) return null;
    
    const isValid = validateAddressFromService(formData.publicKey, formData.chainId);
    const chainName = getChainNameFromService(formData.chainId);
    
    if (isValid) {
      return (
        <div className="flex items-center text-green-600 text-sm mt-1">
          <CheckCircle className="w-4 h-4 mr-1" />
          Valid {chainName} address
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600 text-sm mt-1">
          <AlertCircle className="w-4 h-4 mr-1" />
          Invalid {chainName} address format
        </div>
      );
    }
  };

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
                  Create Multi-Chain Wallet
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
              {/* Chain Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Chain *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {supportedChains?.map((chain) => (
                    <button
                      key={chain.chainId || chain.id}
                      type="button"
                      onClick={() => handleInputChange('chainId', chain.chainId || chain.id)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        formData.chainId === (chain.chainId || chain.id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {chain.name || getChainNameFromService(chain.chainId || chain.id)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {chain.nativeCurrency?.symbol || 'ETH'}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.chainId && (
                  <p className="text-red-600 text-sm mt-1">{errors.chainId}</p>
                )}
              </div>

              {/* Public Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Public Key / Address *
                </label>
                <input
                  type="text"
                  placeholder={getAddressPlaceholder()}
                  value={formData.publicKey}
                  onChange={(e) => handleInputChange('publicKey', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.publicKey 
                      ? 'border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                />
                {getAddressValidationMessage()}
                {errors.publicKey && (
                  <p className="text-red-600 text-sm mt-1">{errors.publicKey}</p>
                )}
              </div>

              {/* Wallet Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wallet Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as WalletType)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.type 
                      ? 'border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                >
                  <option value={WalletType.TREND_TRADER}>Trend Trader</option>
                  <option value={WalletType.MAJOR_TRADER}>Major Trader</option>
                  <option value={WalletType.HOLDER}>Holder</option>
                  <option value={WalletType.TRENCHER}>Trencher</option>
                </select>
                {errors.type && (
                  <p className="text-red-600 text-sm mt-1">{errors.type}</p>
                )}
              </div>

              {/* Private Key (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Private Key (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Enter private key (optional)"
                  value={formData.privateKey}
                  onChange={(e) => handleInputChange('privateKey', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Private key is optional and will be encrypted if provided
                </p>
              </div>

              {/* Chain Information */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Chain Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Chain:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {getChainNameFromService(formData.chainId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Native Token:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {supportedChains?.find(c => (c.chainId || c.id) === formData.chainId)?.nativeCurrency?.symbol || 'ETH'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Decimals:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {getChainDecimals(formData.chainId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {supportedChains?.find(c => (c.chainId || c.id) === formData.chainId)?.type || 'EVM'}
                    </span>
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
              loading={createWalletMutation.isPending}
              disabled={createWalletMutation.isPending}
              className="w-full sm:w-auto sm:ml-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Wallet
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
