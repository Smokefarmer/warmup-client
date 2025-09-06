import React from 'react';
import { Card } from '../common/Card';
import { BarChart, TrendingUp, Users, Target, Activity } from 'lucide-react';

export interface SystemTokenLimits {
  summary: {
    totalWallets: number;
    averageMaxTokens: number;
    averageCurrentTokens: number;
    averageSellProbability: number;
    systemRange: {
      minPossible: number;
      maxPossible: number;
    };
  };
  wallets: Array<{
    walletId: string;
    publicKey: string;
    type: string;
    maxTokens: number;
    currentTokenCount: number;
    sellProbability: number;
    canBuy: boolean;
    shouldForceSell: boolean;
    reason: string;
  }>;
}

interface TokenLimitsCardProps {
  tokenLimits: SystemTokenLimits;
  className?: string;
}

export const TokenLimitsCard: React.FC<TokenLimitsCardProps> = ({
  tokenLimits,
  className = ''
}) => {
  const { summary } = tokenLimits;
  
  const stats = [
    {
      label: 'Total Wallets',
      value: summary.totalWallets.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Avg Max Tokens',
      value: summary.averageMaxTokens.toFixed(1),
      icon: <Target className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Avg Current Tokens',
      value: summary.averageCurrentTokens.toFixed(1),
      icon: <Activity className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'Avg Sell Probability',
      value: `${summary.averageSellProbability}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600'
    },
    {
      label: 'System Range',
      value: `${summary.systemRange.minPossible} - ${summary.systemRange.maxPossible}`,
      icon: <BarChart className="w-5 h-5" />,
      color: 'text-indigo-600'
    }
  ];

  return (
    <Card 
      title="Token Limits Overview" 
      subtitle="Current token limits and sell probabilities for all wallets"
      className={className}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
    </Card>
  );
};
