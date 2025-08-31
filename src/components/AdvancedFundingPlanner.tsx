import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { StrategicFundingService, AdvancedFundingPlan } from '../services/strategicFundingService';
import { 
  Target, 
  DollarSign, 
  Shield, 
  Zap, 
  TrendingUp,
  Settings
} from 'lucide-react';

interface AdvancedFundingPlannerProps {
  onPlanCreated?: (planId: string) => void;
}

export const AdvancedFundingPlanner: React.FC<AdvancedFundingPlannerProps> = ({
  onPlanCreated
}) => {
  const [formData, setFormData] = useState({
    planName: '',
    description: '',
    totalBudget: '100.0',
    walletCount: 500,
    cexFundingPercentage: 30,
    internalFundingPercentage: 70,
    useStealthTransfers: true,
    minAmountPerWallet: '0.01',
    maxAmountPerWallet: '0.1'
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-adjust percentages to ensure they add up to 100
      if (field === 'cexFundingPercentage') {
        newData.internalFundingPercentage = Math.max(0, 100 - value);
      } else if (field === 'internalFundingPercentage') {
        newData.cexFundingPercentage = Math.max(0, 100 - value);
      }
      
      return newData;
    });
  };

  const calculateEstimates = () => {
    const totalBudget = parseFloat(formData.totalBudget) || 0;
    const walletCount = formData.walletCount || 0;
    const minAmount = parseFloat(formData.minAmountPerWallet) || 0;
    const maxAmount = parseFloat(formData.maxAmountPerWallet) || 0;
    
    const avgAmountPerWallet = (minAmount + maxAmount) / 2;
    const estimatedTotalNeeded = avgAmountPerWallet * walletCount;
    const budgetUtilization = totalBudget > 0 ? (estimatedTotalNeeded / totalBudget) * 100 : 0;
    
    const cexAmount = (totalBudget * formData.cexFundingPercentage) / 100;
    const internalAmount = (totalBudget * formData.internalFundingPercentage) / 100;
    
    return {
      avgAmountPerWallet: avgAmountPerWallet.toFixed(4),
      estimatedTotalNeeded: estimatedTotalNeeded.toFixed(3),
      budgetUtilization: budgetUtilization.toFixed(1),
      cexAmount: cexAmount.toFixed(3),
      internalAmount: internalAmount.toFixed(3),
      isOverBudget: estimatedTotalNeeded > totalBudget
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.planName.trim()) {
      toast.error('Please enter a plan name');
      return;
    }
    
    if (formData.cexFundingPercentage + formData.internalFundingPercentage !== 100) {
      toast.error('CEX and Internal funding percentages must add up to 100%');
      return;
    }
    
    const minAmount = parseFloat(formData.minAmountPerWallet);
    const maxAmount = parseFloat(formData.maxAmountPerWallet);
    
    if (minAmount >= maxAmount) {
      toast.error('Min amount must be less than max amount');
      return;
    }

    setIsCreating(true);

    try {
      const plan: AdvancedFundingPlan = {
        planName: formData.planName.trim(),
        description: formData.description.trim() || undefined,
        totalBudget: formData.totalBudget,
        walletCount: formData.walletCount,
        strategy: {
          cexFundingPercentage: formData.cexFundingPercentage,
          internalFundingPercentage: formData.internalFundingPercentage,
          useStealthTransfers: formData.useStealthTransfers,
          minAmountPerWallet: formData.minAmountPerWallet,
          maxAmountPerWallet: formData.maxAmountPerWallet
        }
      };

      const result = await StrategicFundingService.createFundingPlan(plan);
      
      toast.success(`Funding plan "${formData.planName}" created successfully!`);
      
      // Reset form
      setFormData({
        planName: '',
        description: '',
        totalBudget: '100.0',
        walletCount: 500,
        cexFundingPercentage: 30,
        internalFundingPercentage: 70,
        useStealthTransfers: true,
        minAmountPerWallet: '0.01',
        maxAmountPerWallet: '0.1'
      });
      
      // Notify parent component
      onPlanCreated?.(result.planId);
      
    } catch (error: any) {
      toast.error(`Failed to create funding plan: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const estimates = calculateEstimates();

  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <Target className="w-6 h-6 text-green-600 mr-3" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            🎯 Advanced Funding Plans
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create sophisticated funding strategies with multiple sources
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Plan Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plan Name
            </label>
            <input
              type="text"
              placeholder="My Strategic Plan"
              value={formData.planName}
              onChange={(e) => handleInputChange('planName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              placeholder="Describe your funding strategy..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Budget (SOL)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="100.0"
                  value={formData.totalBudget}
                  onChange={(e) => handleInputChange('totalBudget', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wallet Count
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                placeholder="500"
                value={formData.walletCount}
                onChange={(e) => handleInputChange('walletCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
        </div>

        {/* Funding Strategy */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Funding Strategy
          </h3>
          
          <div className="space-y-4">
            {/* Funding Source Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CEX Funding %
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.cexFundingPercentage}
                    onChange={(e) => handleInputChange('cexFundingPercentage', parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Internal Funding %
                </label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.internalFundingPercentage}
                    onChange={(e) => handleInputChange('internalFundingPercentage', parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
            
            {/* Stealth Transfers Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="stealth"
                checked={formData.useStealthTransfers}
                onChange={(e) => handleInputChange('useStealthTransfers', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="stealth" className="ml-3 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                🥷 Use Stealth Transfers (WSOL Clean Funds)
              </label>
            </div>
            
            {/* Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Amount per Wallet (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.minAmountPerWallet}
                  onChange={(e) => handleInputChange('minAmountPerWallet', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Amount per Wallet (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.maxAmountPerWallet}
                  onChange={(e) => handleInputChange('maxAmountPerWallet', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estimates */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            📊 Plan Estimates
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400">Avg per Wallet</div>
              <div className="font-bold text-gray-900 dark:text-gray-100">
                {estimates.avgAmountPerWallet} SOL
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400">Est. Total Needed</div>
              <div className={`font-bold ${estimates.isOverBudget ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                {estimates.estimatedTotalNeeded} SOL
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400">Budget Utilization</div>
              <div className={`font-bold ${estimates.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {estimates.budgetUtilization}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400">CEX Amount</div>
              <div className="font-medium text-blue-600">
                {estimates.cexAmount} SOL
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400">Internal Amount</div>
              <div className="font-medium text-purple-600">
                {estimates.internalAmount} SOL
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 dark:text-gray-400">Transfer Type</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formData.useStealthTransfers ? '🥷 Stealth' : '⚡ Direct'}
              </div>
            </div>
          </div>
          
          {estimates.isOverBudget && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠️ Warning: Estimated total needed ({estimates.estimatedTotalNeeded} SOL) exceeds budget ({formData.totalBudget} SOL)
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
          loading={isCreating}
          disabled={isCreating || !formData.planName.trim()}
        >
          <Target className="w-5 h-5 mr-2" />
          📋 Create Funding Plan
        </Button>
      </form>
    </Card>
  );
};
