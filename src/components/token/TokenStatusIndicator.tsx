import React from 'react';
import { ShoppingCart, AlertTriangle, Ban } from 'lucide-react';

interface TokenStatusIndicatorProps {
  canBuy: boolean;
  shouldForceSell: boolean;
  reason: string;
  size?: 'sm' | 'md' | 'lg';
  showReason?: boolean;
  className?: string;
}

export const TokenStatusIndicator: React.FC<TokenStatusIndicatorProps> = ({
  canBuy,
  shouldForceSell,
  reason,
  size = 'md',
  showReason = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getStatus = () => {
    if (shouldForceSell) {
      return {
        icon: <AlertTriangle className={iconSizes[size]} />,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        label: 'MUST SELL',
        emoji: '🔴'
      };
    }
    
    if (canBuy) {
      return {
        icon: <ShoppingCart className={iconSizes[size]} />,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        label: 'Can Buy',
        emoji: '🟢'
      };
    }
    
    return {
      icon: <Ban className={iconSizes[size]} />,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      label: 'Cannot Buy',
      emoji: '⚫'
    };
  };

  const status = getStatus();

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`
        inline-flex items-center space-x-1 px-2 py-1 rounded-full
        ${status.bgColor} ${status.color} ${textSizes[size]}
      `}>
        <span>{status.emoji}</span>
        {status.icon}
        <span className="font-medium">{status.label}</span>
      </div>
      
      {showReason && reason && (
        <span className={`${textSizes[size]} text-gray-600 dark:text-gray-400 italic`}>
          {reason}
        </span>
      )}
    </div>
  );
};

