import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CopyButton } from '../components/common/CopyButton';
import { ActionsMenu, ActionItem } from '../components/common/ActionsMenu';
import { 
  useProtectedTokens, 
  useProtectedTokenStatistics,
  useCreateProtectedToken,
  useCreateBulkProtectedTokens,
  useRemoveProtectedToken,
  useCheckTokenProtection
} from '../hooks/useProtectedTokens';
import { CreateProtectedTokenDto } from '../types/protectedToken';
import { formatAddress, formatDate } from '../utils/formatters';

import { 
  Shield, 
  Plus, 
  Search,
  Trash2,
  AlertTriangle,
  Info,
  Upload,
  Download,
  BarChart3,
  X,
  CheckCircle
} from 'lucide-react';

export const ProtectedTokens: React.FC = () => {
  const { data: protectedTokens = [], isLoading, error, refetch } = useProtectedTokens();
  
  // Debug logging to understand the data structure
  React.useEffect(() => {
    console.log('Protected tokens data:', { protectedTokens, type: typeof protectedTokens, isArray: Array.isArray(protectedTokens) });
  }, [protectedTokens]);
  const { data: statistics } = useProtectedTokenStatistics();
  const createTokenMutation = useCreateProtectedToken();
  const createBulkTokensMutation = useCreateBulkProtectedTokens();
  const removeTokenMutation = useRemoveProtectedToken();

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkTokenAddress, setCheckTokenAddress] = useState('');

  // Single token form
  const [tokenForm, setTokenForm] = useState<CreateProtectedTokenDto>({
    tokenAddress: '',
    reason: '',
    symbol: '',
    name: ''
  });

  // Bulk tokens form
  const [bulkTokensText, setBulkTokensText] = useState('');

  // Token protection check
  const { data: tokenCheck, refetch: recheckToken } = useCheckTokenProtection(
    checkTokenAddress, 
    !!checkTokenAddress
  );

  // Filter tokens based on search
  const filteredTokens = React.useMemo(() => {
    if (!protectedTokens || !Array.isArray(protectedTokens)) {
      console.warn('protectedTokens is not an array:', protectedTokens);
      return [];
    }
    
    return protectedTokens.filter(token =>
      token?.tokenAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token?.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token?.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [protectedTokens, searchTerm]);

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenForm.tokenAddress || !tokenForm.reason) {
      toast.error('Token address and reason are required');
      return;
    }

    try {
      await createTokenMutation.mutateAsync(tokenForm);
      setTokenForm({ tokenAddress: '', reason: '', symbol: '', name: '' });
      setShowAddForm(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTokensText.trim()) {
      toast.error('Please enter tokens data');
      return;
    }

    try {
      const tokens = JSON.parse(bulkTokensText);
      if (!Array.isArray(tokens)) {
        toast.error('Invalid format. Expected an array of tokens.');
        return;
      }

      await createBulkTokensMutation.mutateAsync({ tokens });
      setBulkTokensText('');
      setShowBulkForm(false);
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format');
      }
      // Other errors handled by hook
    }
  };

  const handleRemoveToken = async (tokenAddress: string) => {
    if (window.confirm('Are you sure you want to remove protection from this token?')) {
      try {
        await removeTokenMutation.mutateAsync(tokenAddress);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleCheckToken = () => {
    if (checkTokenAddress.trim()) {
      recheckToken();
    } else {
      toast.error('Please enter a token address to check');
    }
  };

  const getTokenActions = (token: any): ActionItem[] => [
    {
      id: 'remove',
      label: 'Remove Protection',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleRemoveToken(token.tokenAddress),
      variant: 'danger',
      loading: removeTokenMutation.isPending,
      title: 'Remove protection from this token'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">Failed to load protected tokens</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            Protected Tokens
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage tokens that are protected from automatic selling
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowBulkForm(true)}
            variant="secondary"
            className="flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Add
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Token
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Protected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalProtected}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Protected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.activeProtected}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Info className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent Additions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.recentlyAdded}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cache Size</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.cacheSize}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Token Protection Checker */}
      <Card title="Check Token Protection" subtitle="Verify if a token is protected">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Enter token address to check..."
            value={checkTokenAddress}
            onChange={(e) => setCheckTokenAddress(e.target.value)}
            className="flex-1 input input-bordered"
          />
          <Button 
            onClick={handleCheckToken}
            disabled={!checkTokenAddress.trim()}
          >
            <Search className="w-4 h-4 mr-2" />
            Check
          </Button>
        </div>
        
        {tokenCheck && (
          <div className={`mt-4 p-3 rounded-lg ${
            tokenCheck.isProtected 
              ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' 
              : 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
          }`}>
            <div className="flex items-center">
              {tokenCheck.isProtected ? (
                <Shield className="w-5 h-5 text-red-600 mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              )}
              <span className={`font-medium ${
                tokenCheck.isProtected ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'
              }`}>
                {tokenCheck.isProtected ? 'Token is Protected' : 'Token is Not Protected'}
              </span>
            </div>
            {tokenCheck.token && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Reason:</strong> {tokenCheck.token.reason}</p>
                {tokenCheck.token.symbol && <p><strong>Symbol:</strong> {tokenCheck.token.symbol}</p>}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Search */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by address, symbol, name, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 input input-bordered"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Protected Tokens Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Token Address</th>
                <th>Symbol</th>
                <th>Name</th>
                <th>Reason</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token) => (
                <tr key={token._id || token.tokenAddress}>
                  <td>
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="font-mono text-sm">{formatAddress(token.tokenAddress)}</span>
                      <CopyButton text={token.tokenAddress} size="sm" className="ml-2" />
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {token.symbol || '-'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {token.name || '-'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {token.reason}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {token.addedAt ? formatDate(token.addedAt) : token.createdAt ? formatDate(token.createdAt) : '-'}
                    </span>
                  </td>
                  <td>
                    <ActionsMenu actions={getTokenActions(token)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTokens.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {protectedTokens.length === 0 
                  ? 'No protected tokens found' 
                  : 'No tokens match your search'
                }
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Add Single Token Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Protected Token</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddToken} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token Address *
                </label>
                <input
                  type="text"
                  value={tokenForm.tokenAddress}
                  onChange={(e) => setTokenForm({...tokenForm, tokenAddress: e.target.value})}
                  className="w-full input input-bordered"
                  placeholder="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason *
                </label>
                <input
                  type="text"
                  value={tokenForm.reason}
                  onChange={(e) => setTokenForm({...tokenForm, reason: e.target.value})}
                  className="w-full input input-bordered"
                  placeholder="High-value position - manual sell only"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Symbol
                </label>
                <input
                  type="text"
                  value={tokenForm.symbol}
                  onChange={(e) => setTokenForm({...tokenForm, symbol: e.target.value})}
                  className="w-full input input-bordered"
                  placeholder="USDC"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={tokenForm.name}
                  onChange={(e) => setTokenForm({...tokenForm, name: e.target.value})}
                  className="w-full input input-bordered"
                  placeholder="USD Coin"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={createTokenMutation.isPending}
                >
                  Add Token
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bulk Add Protected Tokens</h3>
              <button
                onClick={() => setShowBulkForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleBulkAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tokens JSON
                </label>
                <textarea
                  value={bulkTokensText}
                  onChange={(e) => setBulkTokensText(e.target.value)}
                  className="w-full h-64 textarea textarea-bordered font-mono text-sm"
                  placeholder={`[
  {
    "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "reason": "USDC - manual sell only",
    "symbol": "USDC",
    "name": "USD Coin"
  },
  {
    "tokenAddress": "So11111111111111111111111111111111111111112",
    "reason": "SOL holdings - never auto-sell",
    "symbol": "SOL"
  }
]`}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowBulkForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={createBulkTokensMutation.isPending}
                >
                  Add Tokens
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
