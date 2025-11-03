import React, { useEffect, useState } from 'react';
import { RefreshCw, Wallet } from 'lucide-react';
import axios from 'axios';

interface CexBalance {
  cexName: string;
  bnb: {
    available: number;
    locked: number;
    total: number;
    error?: string;
  };
  sol: {
    available: number;
    locked: number;
    total: number;
    error?: string;
  };
}

export const CexBalancesCard: React.FC = () => {
  const [balances, setBalances] = useState<CexBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBalances = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Fetching CEX balances from /api/funding/cex/balances...');
      const response = await axios.get('/api/funding/cex/balances');
      console.log('✅ CEX balances response:', response.data);
      if (response.data.success) {
        setBalances(response.data.data);
        console.log(`📊 Loaded ${response.data.data.length} CEX balances`);
      } else {
        const errorMsg = 'Failed to fetch balances';
        console.error('❌ CEX balances failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch CEX balances';
      console.error('❌ CEX balances error:', errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          💱 CEX Balances (Multi-CEX Rotation)
        </h3>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh balances"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading && balances.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading CEX balances...</span>
          </div>
        )}

        {!loading && balances.length === 0 && !error && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No CEX configured. Add CEX credentials to .env file.
          </p>
        )}

        {balances.map((cex) => (
          <div
            key={cex.cexName}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <Wallet className="w-4 h-4 mr-2 text-gray-400" />
                {cex.cexName}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* BNB Balance */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                  BNB (BSC)
                </div>
                {cex.bnb.error ? (
                  <div>
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">⚠️ Unavailable</div>
                    <div className="text-xs text-red-500 mt-1" title={cex.bnb.error}>
                      {cex.bnb.error.length > 30 ? cex.bnb.error.substring(0, 30) + '...' : cex.bnb.error}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                      {cex.bnb.available.toFixed(4)}
                    </div>
                    {cex.bnb.locked > 0 && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        🔒 Locked: {cex.bnb.locked.toFixed(4)}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* SOL Balance */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                  SOL (Solana)
                </div>
                {cex.sol.error ? (
                  <div>
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">⚠️ Unavailable</div>
                    <div className="text-xs text-red-500 mt-1" title={cex.sol.error}>
                      {cex.sol.error.length > 30 ? cex.sol.error.substring(0, 30) + '...' : cex.sol.error}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                      {cex.sol.available.toFixed(4)}
                    </div>
                    {cex.sol.locked > 0 && (
                      <div className="text-xs text-purple-600 dark:text-purple-400">
                        🔒 Locked: {cex.sol.locked.toFixed(4)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          ℹ️ <strong>Multi-CEX Rotation:</strong> When funding wallets with Multi-CEX enabled, each wallet is randomly assigned to one of the configured CEXes above. This distributes funding across multiple exchanges for better privacy.
        </p>
      </div>
    </div>
  );
};

