import React from 'react';

interface SellProbabilityBadgeProps {
  probability: number; // Already as percentage (0-100)
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SellProbabilityBadge: React.FC<SellProbabilityBadgeProps> = ({
  probability,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  const getBadgeColor = () => {
    if (probability < 30) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    } else if (probability <= 70) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const getIcon = () => {
    if (probability < 30) return '🟢';
    if (probability <= 70) return '🟡';
    return '🔴';
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${sizeClasses[size]}
      ${getBadgeColor()}
      ${className}
    `}>
      <span className="mr-1">{getIcon()}</span>
      {probability.toFixed(0)}%
    </span>
  );
};

