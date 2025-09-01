import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { WalletService, StrategicWalletGenerationConfig } from '../services/walletService';
import { 
  Target, 
  Plus, 
  Minus, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  Zap
} from 'lucide-react';

interface StrategicWalletGeneratorProps {
  onJobStarted?: (jobId: string) => void;
}

const WALLET_TYPES = [
  { value: 'TrendTrader', label: 'Trend Trader', description: 'Follows market trends' },
  { value: 'MajorTrader', label: 'Major Trader', description: 'High volume trading' },
  { value: 'Holder', label: 'Holder', description: 'Long-term holding strategy' },
  { value: 'Trencher', label: 'Trencher', description: 'Opportunistic trading' },
] as const;

export const StrategicWalletGenerator: React.FC<StrategicWalletGeneratorProps> = ({
  onJobStarted
}) => {
  const [totalWallets, setTotalWallets] = useState(10);
  const [planName, setPlanName] = useState('');
  const [distribution, setDistribution] = useState([
    { type: 'TrendTrader' as const, count: 4 },
    { type: 'MajorTrader' as const, count: 2 },
    { type: 'Holder' as const, count: 2 },
    { type: 'Trencher' as const, count: 2 },
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableDelays, setEnableDelays] = useState(true);
  const [minDelayMinutes, setMinDelayMinutes] = useState(1); // Store in minutes for UI
  const [maxDelayMinutes, setMaxDelayMinutes] = useState(3); // Store in minutes for UI
  const [isGenerating, setIsGenerating] = useState(false);

  // Update distribution when total wallets change
  const handleTotalWalletsChange = (newTotal: number) => {
    setTotalWallets(newTotal);
    
    // Redistribute proportionally
    const currentTotal = distribution.reduce((sum, item) => sum + item.count, 0);
    if (currentTotal > 0) {
      const newDistribution = distribution.map(item => ({
        ...item,
        count: Math.max(1, Math.floor((item.count / currentTotal) * newTotal))
      }));
      
      // Adjust for rounding errors
      const newSum = newDistribution.reduce((sum, item) => sum + item.count, 0);
      const diff = newTotal - newSum;
      if (diff !== 0) {
        newDistribution[0].count += diff;
      }
      
      setDistribution(newDistribution);
    }
  };

  const handleDistributionChange = (index: number, newCount: number) => {
    const newDistribution = [...distribution];
    newDistribution[index].count = Math.max(0, newCount);
    setDistribution(newDistribution);
  };

  const addWalletType = () => {
    const availableTypes = WALLET_TYPES.filter(
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

    setIsGenerating(true);

    try {
      const config: StrategicWalletGenerationConfig = {
        count: totalWallets,
        planName: planName.trim(),
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
      setPlanName('');
      setTotalWallets(10);
      setDistribution([
        { type: 'TrendTrader', count: 4 },
        { type: 'MajorTrader', count: 2 },
        { type: 'Holder', count: 2 },
        { type: 'Trencher', count: 2 },
      ]);
      
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
      <div className="flex items-center mb-6">
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
                onChange={(e) => handleTotalWalletsChange(parseInt(e.target.value) || 1)}
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
              const walletType = WALLET_TYPES.find(t => t.value === item.type);
              return (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                      {WALLET_TYPES.map(type => (
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
                      onChange={(e) => handleDistributionChange(index, parseInt(e.target.value) || 0)}
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addWalletType}
              disabled={distribution.length >= WALLET_TYPES.length}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Type
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total: {getTotalDistribution()} / {totalWallets}
              {getTotalDistribution() !== totalWallets && (
                <span className="text-red-500 ml-2">
                  (Must equal total)
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
