import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from './common/Button';
import { useAvailableWallets } from '../hooks/useWallets';
import { useMultiChain } from '../hooks/useMultiChain';
import { useCreateWarmupProcess } from '../hooks/useWarmupProcesses';
import { IWarmUpWallet, WalletStatus } from '../types/wallet';
import { getChainName } from '../config/chains';
import { 
  Activity, 
  Plus, 
  X,
  Wallet,
  Network,
  CheckSquare,
  Square,
  ExternalLink
} from 'lucide-react';

interface WarmupProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (process: any) => void;
}

export const WarmupProcessModal: React.FC<WarmupProcessModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedChainId: '',
    selectedTagId: '',
    selectedWalletIds: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: availableWallets = [], isLoading: walletsLoading } = useAvailableWallets();
  const createProcessMutation = useCreateWarmupProcess();

  // Multi-chain functionality
  const { 
    enabledChains,
    getChainName: getChainNameFromService,
    getExplorerUrl 
  } = useMultiChain();

  // Filter wallets by selected chain and tag
  const filteredWallets = availableWallets.filter((wallet) => {
    // Filter by chain
    if (formData.selectedChainId && wallet.chainId !== parseInt(formData.selectedChainId)) {
      return false;
    }
    
    // Filter by tag
    if (formData.selectedTagId) {
      if (formData.selectedTagId === 'no-tag') {
        return !wallet.tag || wallet.tag.trim() === '';
      } else {
        return wallet.tag === formData.selectedTagId;
      }
    }
    
    return true;
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear selected wallets when chain or tag changes
    if (field === 'selectedChainId' || field === 'selectedTagId') {
      setFormData(prev => ({ ...prev, selectedWalletIds: [] }));
    }
  };

  const handleWalletSelection = (walletId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedWalletIds: prev.selectedWalletIds.includes(walletId)
        ? prev.selectedWalletIds.filter(id => id !== walletId)
        : [...prev.selectedWalletIds, walletId]
    }));
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      selectedWalletIds: filteredWallets.map(wallet => wallet._id)
    }));
  };

  const handleDeselectAll = () => {
    setFormData(prev => ({ ...prev, selectedWalletIds: [] }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Process name is required';
    }

    if (formData.selectedWalletIds.length === 0) {
      newErrors.wallets = 'Please select at least one wallet';
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
      const processData = {
        name: formData.name,
        description: formData.description,
        walletIds: formData.selectedWalletIds
      };

      const result = await createProcessMutation.mutateAsync(processData);
      
      toast.success('Warmup process created successfully!');
      onSuccess(result);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        selectedChainId: '',
        selectedTagId: '',
        selectedWalletIds: []
      });
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error('Process creation failed:', error);
      // Error is already handled by the mutation
    }
  };

  // Get unique tags from available wallets
  const uniqueTags = Array.from(
    new Set(
      availableWallets
        .filter(wallet => wallet.tag && wallet.tag.trim())
        .map(wallet => wallet.tag!)
    )
  ).sort();

  const getChainStats = () => {
    const stats: Record<number, number> = {};
    filteredWallets.forEach(wallet => {
      stats[wallet.chainId] = (stats[wallet.chainId] || 0) + 1;
    });
    return stats;
  };

  const getTagStats = () => {
    const stats: Record<string, number> = {};
    filteredWallets.forEach(wallet => {
      const tag = wallet.tag || 'no-tag';
      stats[tag] = (stats[tag] || 0) + 1;
    });
    return stats;
  };

  const chainStats = getChainStats();
  const tagStats = getTagStats();

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Activity className="w-6 h-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Create Multi-Chain Warmup Process
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
              {/* Process Details */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Process Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter process name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.name 
                        ? 'border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Wallet Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chain Filter (Optional)
                    </label>
                    <select
                      value={formData.selectedChainId}
                      onChange={(e) => handleInputChange('selectedChainId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All Chains</option>
                      {enabledChains?.map(chain => (
                        <option key={chain.chainId || chain.id} value={chain.chainId || chain.id}>
                          {chain.name || getChainNameFromService(chain.chainId || chain.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tag Filter (Optional)
                    </label>
                    <select
                      value={formData.selectedTagId}
                      onChange={(e) => handleInputChange('selectedTagId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All Tags</option>
                      <option value="no-tag">No Tag</option>
                      {uniqueTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Enter process description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Wallet Statistics */}
              {(Object.keys(chainStats).length > 0 || Object.keys(tagStats).length > 0) && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Available Wallets ({filteredWallets.length} total)
                  </h3>
                  
                  {/* Chain Statistics */}
                  {Object.keys(chainStats).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">By Chain:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(chainStats).map(([chainId, count]) => (
                          <div key={chainId} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                            <div className="flex items-center">
                              <Network className="w-3 h-3 text-gray-400 mr-1" />
                              <span className="text-xs font-medium">
                                {getChainNameFromService(parseInt(chainId))}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tag Statistics */}
                  {Object.keys(tagStats).length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">By Tag:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(tagStats).map(([tag, count]) => (
                          <div key={tag} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                            <div className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                tag === 'no-tag' ? 'bg-gray-400' : 'bg-blue-500'
                              }`} />
                              <span className="text-xs font-medium">
                                {tag === 'no-tag' ? 'No Tag' : tag}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Wallets *
                  </label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                {walletsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Loading available wallets...</p>
                  </div>
                ) : filteredWallets.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {formData.selectedChainId 
                        ? `No available wallets found for ${getChainNameFromService(parseInt(formData.selectedChainId))}`
                        : 'No available wallets found'
                      }
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Create some wallets first or check wallet availability
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                      {filteredWallets.map((wallet) => {
                        const explorerUrl = getExplorerUrl(wallet.chainId, wallet.publicKey || wallet.address);
                        const isSelected = formData.selectedWalletIds.includes(wallet._id);
                        
                        return (
                          <div
                            key={wallet._id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                            onClick={() => handleWalletSelection(wallet._id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleWalletSelection(wallet._id)}
                                  className="mr-3"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <Wallet className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                      {(wallet.publicKey || wallet.address)?.slice(0, 8) || 'N/A'}...
                                    </span>
                                    {explorerUrl && (
                                      <a
                                        href={explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{wallet.type}</span>
                                    <span>•</span>
                                    <span>{getChainNameFromService(wallet.chainId)}</span>
                                    <span>•</span>
                                    <span>{wallet.nativeTokenBalance || '0'} balance</span>
                                  </div>
                                  {wallet.tag && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md">
                                        {wallet.tag}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {errors.wallets && (
                  <p className="text-red-600 text-sm mt-2">{errors.wallets}</p>
                )}

                {formData.selectedWalletIds.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {formData.selectedWalletIds.length} wallet{formData.selectedWalletIds.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              variant="primary"
              onClick={handleSubmit}
              loading={createProcessMutation.isPending}
              disabled={createProcessMutation.isPending || formData.selectedWalletIds.length === 0}
              className="w-full sm:w-auto sm:ml-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Process ({formData.selectedWalletIds.length} wallets)
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
