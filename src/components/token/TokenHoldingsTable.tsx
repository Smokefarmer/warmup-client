import React from 'react';
import { TokenHolding } from '../../types/wallet';
import { CopyButton } from '../common/CopyButton';
import { formatAddress } from '../../utils/formatters';

interface TokenHoldingsTableProps {
  holdings: TokenHolding[];
  className?: string;
}

export const TokenHoldingsTable: React.FC<TokenHoldingsTableProps> = ({
  holdings,
  className = ''
}) => {
  if (holdings.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 dark:text-gray-400 ${className}`}>
        No token holdings found
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Token Address
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {holdings.map((holding, index) => (
            <tr key={holding.tokenAddress} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {formatAddress(holding.tokenAddress)}
                  </span>
                  <CopyButton text={holding.tokenAddress} size="sm" />
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {holding.balanceFormatted || holding.balance}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

