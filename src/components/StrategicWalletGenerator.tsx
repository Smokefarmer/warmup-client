import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { ChainSelector } from './common/ChainSelector';
import { WalletService, StrategicWalletGenerationConfig } from '../services/walletService';
import { useChain } from '../contexts/ChainContext';
import { getStrategiesForChain, CHAINS } from '../config/chains';
import { 
  Target, 
  Plus, 
  Minus, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Network
} from 'lucide-react';

interface StrategicWalletGeneratorProps {
  onJobStarted?: (jobId: string) => void;
}

// Dynamic wallet types based on chain
const getWalletTypesForChain = (chainId: number) => {
  const strategies = getStrategiesForChain(chainId);
  
  const typeDescriptions: Record<string, { label: string; description: string; risk?: string }> = {
    'Holder': { label: 'Holder', description: 'Conservative SOL token holding', risk: 'LOW' },
    'MajorTrader': { label: 'Major Trader', description: 'Major token trading', risk: 'MEDIUM' },
    'TrendTrader': { label: 'Trend Trader', description: 'Trend following strategy', risk: 'HIGH' },
    'Trencher': { label: 'Trencher', description: 'Pump.fun meme token trenching', risk: 'EXTREME' },
    'BNBHolder': { label: 'BNB Holder', description: 'Conservative BNB token holding strategy', risk: 'LOW' },
    'BNBTrendTrader': { label: 'BNB Trend Trader', description: 'Aggressive BNB trend following strategy', risk: 'HIGH' },
    'BNBTrencher': { label: 'BNB Trencher (Four.Meme)', description: 'Four.Meme meme token trenching - HIGHEST RISK ⚠️', risk: 'EXTREME' },
  };
  
  return strategies.map(strategy => ({
    value: strategy,
    label: typeDescriptions[strategy]?.label || strategy,
    description: typeDescriptions[strategy]?.description || `${strategy} strategy`
  }));
};

export const StrategicWalletGenerator: React.FC<StrategicWalletGeneratorProps> = ({
  onJobStarted
}) => {
  const { selectedChain } = useChain();
  const [totalWallets, setTotalWallets] = useState(50);
  const [planName, setPlanName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableDelays, setEnableDelays] = useState(true);
  const [minDelayMinutes, setMinDelayMinutes] = useState(1); // Store in minutes for UI
  const [maxDelayMinutes, setMaxDelayMinutes] = useState(3); // Store in minutes for UI
  const [isGenerating, setIsGenerating] = useState(false);

  // Get available wallet types for current chain
  const availableWalletTypes = getWalletTypesForChain(selectedChain.id);
  
  // Initialize distribution based on selected chain
  const getInitialDistribution = () => {
    const types = getWalletTypesForChain(selectedChain.id);
    
    if (totalWallets < types.length) {
      // If we have fewer wallets than types, only include types that get wallets
      return types.slice(0, totalWallets).map((type) => ({
        type: type.value,
        count: 1
      }));
    } else {
      // Normal distribution - ensure each type gets at least 1
      const countPerType = Math.floor(totalWallets / types.length);
      const remainder = totalWallets % types.length;
      
      return types.map((type, index) => ({
        type: type.value,
        count: Math.max(1, countPerType + (index < remainder ? 1 : 0))
      }));
    }
  };
  
  const [distribution, setDistribution] = useState(() => getInitialDistribution());

  // Update distribution when chain changes
  React.useEffect(() => {
    setDistribution(getInitialDistribution());
    // Reset plan name with chain-specific prefix
    const chainPrefix = selectedChain.symbol === 'SOL' ? 'SOL' : 'BNB';
    setPlanName(`${chainPrefix}_Strategic_${Date.now().toString().slice(-6)}`);
  }, [selectedChain.id, totalWallets]);

  // Update distribution when total wallets change
  const handleTotalWalletsChange = (newTotal: number) => {
    if (newTotal < 1) return; // Don't allow invalid totals
    
    setTotalWallets(newTotal);
    
    // Only redistribute if we have a reasonable number of wallets
    if (newTotal >= distribution.length) {
      const currentTotal = distribution.reduce((sum, item) => sum + item.count, 0);
      if (currentTotal > 0) {
        // Calculate proportional distribution
        const newDistribution = distribution.map(item => ({
          ...item,
          count: Math.max(1, Math.floor((item.count / currentTotal) * newTotal))
        }));
        
        // Ensure no negative numbers and handle rounding
        const newSum = newDistribution.reduce((sum, item) => sum + item.count, 0);
        const diff = newTotal - newSum;
        
        if (diff > 0) {
          // Add remaining wallets to the first type
          newDistribution[0].count += diff;
        } else if (diff < 0) {
          // Remove excess wallets from types that have more than 1
          let remaining = Math.abs(diff);
          for (let i = 0; i < newDistribution.length && remaining > 0; i++) {
            const canRemove = Math.max(0, newDistribution[i].count - 1);
            const toRemove = Math.min(remaining, canRemove);
            newDistribution[i].count -= toRemove;
            remaining -= toRemove;
          }
        }
        
        setDistribution(newDistribution);
      }
    } else {
      // If total is less than number of types, give 1 to each type up to the total
      const newDistribution = distribution.map((item, index) => ({
        ...item,
        count: index < newTotal ? 1 : 0
      }));
      setDistribution(newDistribution);
    }
  };

  const handleDistributionChange = (index: number, newCount: number) => {
    const newDistribution = [...distribution];
    newDistribution[index].count = Math.max(0, newCount);
    setDistribution(newDistribution);
  };

  const addWalletType = () => {
    const availableTypes = availableWalletTypes.filter(
      type => !distribution.some(d => d.type === type.value)
    );
    
    if (availableTypes.length > 0) {
      setDistribution([
        ...distribution,
        { type: availableTypes[0].value, count: 1 }
      ]);
    }
  };

  const removeWalletType = (index: number) => {
    if (distribution.length > 1) {
      setDistribution(distribution.filter((_, i) => i !== index));
    }
  };

  const getTotalDistribution = () => {
    return distribution.reduce((sum, item) => sum + item.count, 0);
  };

  // Auto-distribute wallets evenly across all types
  const autoDistribute = () => {
    if (totalWallets < distribution.length) {
      // If we have fewer wallets than types, give 1 to each type up to totalWallets
      const newDistribution = distribution.map((item, index) => ({
        ...item,
        count: index < totalWallets ? 1 : 0
      }));
      setDistribution(newDistribution.filter(item => item.count > 0));
    } else {
      // Normal distribution - ensure each type gets at least 1
      const perType = Math.floor(totalWallets / distribution.length);
      const remainder = totalWallets % distribution.length;
      
      const newDistribution = distribution.map((item, index) => ({
        ...item,
        count: Math.max(1, perType + (index < remainder ? 1 : 0))
      }));
      
      setDistribution(newDistribution);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!planName.trim()) {
      toast.error('Please enter a plan name');
      return;
    }
    
    const totalDistribution = getTotalDistribution();
    if (totalDistribution !== totalWallets) {
      toast.error(`Distribution total (${totalDistribution}) must equal total wallets (${totalWallets})`);
      return;
    }

    // Check that all wallet types have at least 1 wallet
    const invalidTypes = distribution.filter(item => item.count <= 0);
    if (invalidTypes.length > 0) {
      toast.error(`All wallet types must have at least 1 wallet. Please adjust the distribution.`);
      return;
    }

    setIsGenerating(true);

    try {
      const config: StrategicWalletGenerationConfig = {
        count: totalWallets,
        chainId: selectedChain.id,
        tag: planName.trim(),
        strategy: distribution.length === 1 ? distribution[0].type : 'Mixed',
        walletTypeDistribution: distribution,
        withDelays: enableDelays,
        delayConfig: enableDelays ? {
          minMs: minDelayMinutes * 60 * 1000, // Convert minutes to milliseconds
          maxMs: maxDelayMinutes * 60 * 1000  // Convert minutes to milliseconds
        } : undefined
      };

      const result = await WalletService.generateStrategicWallets(config);
      
      toast.success(`Strategic wallet generation started! Job ID: ${result.jobId}`);
      
      // Reset form
      const chainPrefix = selectedChain.symbol === 'SOL' ? 'SOL' : 'BNB';
      setPlanName(`${chainPrefix}_Strategic_${Date.now().toString().slice(-6)}`);
      setTotalWallets(50);
      setDistribution(getInitialDistribution());
      
      // Notify parent component
      onJobStarted?.(result.jobId);
      
    } catch (error: any) {
      toast.error(`Failed to start generation: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              🎯 Strategic Wallet Generation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate wallets with intelligent distribution and timing
            </p>
          </div>
        </div>
        
        {/* Chain Info Display */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <span className="text-lg">{selectedChain.icon}</span>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {selectedChain.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {availableWalletTypes.length} strategies available
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Wallets
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={totalWallets}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setTotalWallets(1);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 1000) {
                      handleTotalWalletsChange(numValue);
                    }
                  }
                }}
                onBlur={(e) => {
                  // Ensure valid value on blur
                  const value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1) {
                    setTotalWallets(1);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Name
              </label>
              <input
                type="text"
                placeholder="My Strategic Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
        </div>

        {/* Wallet Type Distribution */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Wallet Type Distribution
          </h3>
          <div className="space-y-3">
            {distribution.map((item, index) => {
              const walletType = availableWalletTypes.find(t => t.value === item.type);
              const hasZeroCount = item.count === 0;
              return (
                <div key={index} className={`flex items-center gap-4 p-3 rounded-lg ${hasZeroCount ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex-1">
                    <select
                      value={item.type}
                      onChange={(e) => {
                        const newDistribution = [...distribution];
                        newDistribution[index].type = e.target.value as any;
                        setDistribution(newDistribution);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {availableWalletTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {walletType && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {walletType.description}
                      </p>
                    )}
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      value={item.count}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          handleDistributionChange(index, 0);
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            handleDistributionChange(index, numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure valid value on blur
                        const value = parseInt(e.target.value);
                        if (isNaN(value) || value < 0) {
                          handleDistributionChange(index, 0);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  {distribution.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeWalletType(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addWalletType}
                disabled={distribution.length >= availableWalletTypes.length}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Type
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={autoDistribute}
                title="Distribute wallets evenly across all types"
              >
                ⚡ Auto-distribute
              </Button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total: {getTotalDistribution()} / {totalWallets}
              {getTotalDistribution() !== totalWallets && (
                <span className="text-red-500 ml-2">
                  (Must equal total)
                </span>
              )}
              {distribution.some(item => item.count === 0) && (
                <span className="text-orange-500 ml-2">
                  ⚠️ Types with 0 count will be excluded
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Settings className="w-4 h-4 mr-2" />
            ⚙️ Advanced Settings
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </button>
          
          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableDelays"
                  checked={enableDelays}
                  onChange={(e) => setEnableDelays(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="enableDelays" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Enable Intelligent Delays
                </label>
              </div>
              
              {enableDelays && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min Delay (minutes)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={minDelayMinutes}
                      onChange={(e) => setMinDelayMinutes(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      = {(minDelayMinutes * 60 * 1000).toLocaleString()}ms
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Delay (minutes)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={maxDelayMinutes}
                      onChange={(e) => setMaxDelayMinutes(parseFloat(e.target.value) || 3)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      = {(maxDelayMinutes * 60 * 1000).toLocaleString()}ms
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isGenerating}
          disabled={isGenerating || getTotalDistribution() !== totalWallets || !planName.trim()}
        >
          <Target className="w-5 h-5 mr-2" />
          🚀 Start Strategic Generation
        </Button>
      </form>
    </Card>
  );
};
