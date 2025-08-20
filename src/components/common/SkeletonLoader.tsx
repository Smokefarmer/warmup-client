import React from 'react';

interface SkeletonLoaderProps {
  type?: 'table-row' | 'card' | 'text' | 'button';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  count = 1,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'table-row':
        return (
          <div className="flex items-center space-x-4 p-4 animate-pulse">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        );
      
      case 'card':
        return (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        );
      
      case 'button':
        return (
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        );
      
      case 'text':
      default:
        return (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={index > 0 ? 'mt-4' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

// Specialized skeleton loaders
export const TableSkeletonLoader: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-1">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 animate-pulse">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    ))}
  </div>
);

export const CardSkeletonLoader: React.FC<{ cards?: number }> = ({ cards = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: cards }).map((_, index) => (
      <div key={index} className="p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    ))}
  </div>
);
