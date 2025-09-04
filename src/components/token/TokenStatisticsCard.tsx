import React from 'react';
import { Card } from '../common/Card';
import { TokenStatistics } from '../../types/wallet';
import { BarChart, TrendingUp, AlertTriangle, Users } from 'lucide-react';

interface TokenStatisticsCardProps {
  statistics: TokenStatistics;
  className?: string;
}

export const TokenStatisticsCard: React.FC<TokenStatisticsCardProps> = ({
  statistics,
  className = ''
}) => {
  const stats = [
    {
      label: 'Total Wallets',
      value: statistics.totalWallets.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Avg Max Tokens',
      value: statistics.averageMaxTokens.toFixed(1),
      icon: <BarChart className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Avg Current Tokens',
      value: statistics.averageCurrentTokens.toFixed(1),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'Wallets at Limit',
      value: statistics.walletsAtLimit.toString(),
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-600'
    },
    {
      label: 'Wallets Near Limit',
      value: statistics.walletsNearLimit.toString(),
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-yellow-600'
    },
    {
      label: 'Avg Sell Probability',
      value: `${(statistics.averageSellProbability * 100).toFixed(1)}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card 
      title="Token Management Statistics" 
      subtitle={statistics.description}
      className={className}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className={`${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {new Date(statistics.generatedAt).toLocaleString()}
      </div>
    </Card>
  );
};

