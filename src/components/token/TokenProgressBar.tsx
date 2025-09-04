import React from 'react';

interface TokenProgressBarProps {
  current: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const TokenProgressBar: React.FC<TokenProgressBarProps> = ({
  current,
  max,
  size = 'md',
  showLabels = true,
  className = ''
}) => {
  const percentage = Math.min((current / max) * 100, 100);
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getBarColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className={`flex justify-between items-center mb-1 ${textSizeClasses[size]}`}>
          <span className="text-gray-700 dark:text-gray-300">
            Tokens: {current}/{max}
          </span>
          <span className={`font-medium ${
            isAtLimit ? 'text-red-600' : 
            isNearLimit ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${getBarColor()} ${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isAtLimit && (
        <div className="flex items-center mt-1">
          <span className="text-xs text-red-600 dark:text-red-400">
            ⚠️ At token limit
          </span>
        </div>
      )}
      
      {isNearLimit && !isAtLimit && (
        <div className="flex items-center mt-1">
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ Near limit
          </span>
        </div>
      )}
    </div>
  );
};

