import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { StrategicFundingService, WsolStealthFundingConfig } from '../services/strategicFundingService';
import { 
  Shield, 
  ArrowRight, 
  RefreshCw, 
  Info,
  Wallet,
  Users
} from 'lucide-react';

interface StealthFundingPanelProps {
  onJobStarted?: (jobId: string) => void;
}

export const StealthFundingPanel: React.FC<StealthFundingPanelProps> = ({
  onJobStarted
}) => {
  const [masterWallets, setMasterWallets] = useState<Array<{
    id: string;
    address: string;
    childrenCount: number;
    children: Array<{ id: string; address: string; balance: string }>;
  }>>([]);
  const [selectedMasterWallet, setSelectedMasterWallet] = useState('');
  const [amountPerChild, setAmountPerChild] = useState('0.025');
  const [isLoading, setIsLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  // Load master wallets on component mount
  useEffect(() => {
    loadMasterWallets();
  }, []);

  const loadMasterWallets = async () => {
    setIsLoading(true);
    try {
      const wallets = await StrategicFundingService.getMasterWallets();
      setMasterWallets(wallets);
      if (wallets.length > 0 && !selectedMasterWallet) {
        setSelectedMasterWallet(wallets[0].id);
      }
    } catch (error: any) {
      toast.error(`Failed to load master wallets: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMasterWallet) {
      toast.error('Please select a master wallet');
      return;
    }
    
    if (!amountPerChild || parseFloat(amountPerChild) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsFunding(true);

    try {
      const config: WsolStealthFundingConfig = {
        masterWalletId: selectedMasterWallet,
        amountPerChild: amountPerChild
      };

      const result = await StrategicFundingService.executeStealthFunding(config);
      
      toast.success(`Stealth funding started! Job ID: ${result.jobId}`);
      
      // Reset form
      setAmountPerChild('0.025');
      
      // Notify parent component
      onJobStarted?.(result.jobId);
      
    } catch (error: any) {
      toast.error(`Failed to start stealth funding: ${error.message || 'Unknown error'}`);
    } finally {
      setIsFunding(false);
    }
  };

  const selectedWallet = masterWallets.find(w => w.id === selectedMasterWallet);
  const estimatedTotal = selectedWallet && amountPerChild 
    ? (parseFloat(amountPerChild) * selectedWallet.childrenCount).toFixed(3)
    : '0.000';

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 text-purple-600 mr-3" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            🥷 Stealth Funding (WSOL Clean Funds)
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fund wallets using WSOL transfers for enhanced privacy
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              How it works:
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">1</span>
                <span>🔄 Wrap SOL → WSOL on source wallet</span>
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">2</span>
                <span>📤 Transfer WSOL tokens (appears as token transfer)</span>
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">3</span>
                <span>🔄 Unwrap WSOL → SOL on destination wallet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Master Wallet Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Master Wallet
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadMasterWallets}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
          
          {masterWallets.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
              <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No master wallets found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Create wallets with child relationships first
              </p>
            </div>
          ) : (
            <select
              value={selectedMasterWallet}
              onChange={(e) => setSelectedMasterWallet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select master wallet...</option>
              {masterWallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)} 
                  ({wallet.childrenCount} children)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Amount per Child */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount per Child (SOL)
          </label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            placeholder="0.025"
            value={amountPerChild}
            onChange={(e) => setAmountPerChild(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        {/* Selected Wallet Details */}
        {selectedWallet && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Selected Wallet Details
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {selectedWallet.address.slice(0, 12)}...{selectedWallet.address.slice(-12)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Child Wallets:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {selectedWallet.childrenCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Total:</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {estimatedTotal} SOL
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
          loading={isFunding}
          disabled={isFunding || !selectedMasterWallet || masterWallets.length === 0}
        >
          <Shield className="w-5 h-5 mr-2" />
          🥷 Execute Stealth Transfer
        </Button>
      </form>

      {/* Cost Comparison */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
          💡 Cost Comparison
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-600 dark:text-blue-400">Direct Transfer</h5>
            <div className="text-yellow-700 dark:text-yellow-300 mt-1">
              • Lower cost (~0.005 SOL)
              <br />
              • Faster execution
              <br />
              • Visible as SOL transfers
            </div>
          </div>
          <div>
            <h5 className="font-medium text-purple-600 dark:text-purple-400">WSOL Clean Funds</h5>
            <div className="text-yellow-700 dark:text-yellow-300 mt-1">
              • Higher cost (~0.01 SOL)
              <br />
              • Enhanced privacy
              <br />
              • Appears as token transfers
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
