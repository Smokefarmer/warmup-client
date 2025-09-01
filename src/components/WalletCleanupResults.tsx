import React from 'react';
import { Card } from './common/Card';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface TokenResult {
  token: string;
  success: boolean;
  solReceived?: string;
  error?: string;
  transactionHash?: string;
}

interface CleanupResult {
  success: boolean;
  totalTokensSold?: number;
  totalSolRecovered?: string;
  amountSent?: string;
  results?: TokenResult[];
  transactionHash?: string;
  error?: string;
}

interface WalletCleanupResultsProps {
  sellResult?: CleanupResult;
  sendResult?: CleanupResult;
  walletAddress?: string;
}

export const WalletCleanupResults: React.FC<WalletCleanupResultsProps> = ({
  sellResult,
  sendResult,
  walletAddress
}) => {
  const getSolscanUrl = (hash: string) => `https://solscan.io/tx/${hash}`;

  return (
    <Card className="p-4 max-w-full overflow-hidden">
      <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Cleanup Results
        {walletAddress && (
          <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
            Wallet: {walletAddress?.slice(0, 8) || 'N/A'}...{walletAddress?.slice(-8) || 'N/A'}
          </span>
        )}
      </h3>

      {/* Sell Tokens Results */}
      {sellResult && (
        <div className="mb-6">
          <h4 className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
            🔄 Sell All Tokens
            {sellResult.success ? (
              <CheckCircle className="w-3 h-3 text-green-500 ml-2" />
            ) : (
              <XCircle className="w-3 h-3 text-red-500 ml-2" />
            )}
          </h4>

          {sellResult.success ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="flex flex-col space-y-1">
                <span className="text-xs text-green-700 dark:text-green-300">
                  ✅ Tokens Sold: {sellResult.totalTokensSold}
                </span>
                <span className="text-xs text-green-700 dark:text-green-300">
                  💰 SOL Recovered: {sellResult.totalSolRecovered}
                </span>
              </div>
                {sellResult.transactionHash && (
                  <a
                    href={getSolscanUrl(sellResult.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {sellResult.results && sellResult.results.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {sellResult.results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-1 rounded text-xs ${
                        result.success
                          ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {result.success ? '✅' : '❌'}
                        <span className="font-mono">{result.token}</span>
                        {result.success && result.solReceived && (
                          <span>→ {result.solReceived} SOL</span>
                        )}
                        {!result.success && result.error && (
                          <span>- {result.error}</span>
                        )}
                      </div>
                      {result.transactionHash && (
                        <a
                          href={getSolscanUrl(result.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-xs text-red-700 dark:text-red-300">
                ❌ {sellResult.error || 'Failed to sell tokens'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Send Back to Funder Results */}
      {sendResult && (
        <div>
          <h4 className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
            💰 Send Back to Funder
            {sendResult.success ? (
              <CheckCircle className="w-3 h-3 text-green-500 ml-2" />
            ) : (
              <XCircle className="w-3 h-3 text-red-500 ml-2" />
            )}
          </h4>

          {sendResult.success ? (
            <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-xs text-green-700 dark:text-green-300">
                ✅ Sent: {sendResult.amountSent} SOL
              </span>
              {sendResult.transactionHash && (
                <a
                  href={getSolscanUrl(sendResult.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ) : (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-xs text-red-700 dark:text-red-300">
                ❌ {sendResult.error || 'Failed to send back to funder'}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
