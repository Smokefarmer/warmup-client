import React from 'react';
import { WalletStatus } from '../../types/wallet';

interface StatusBadgeProps {
  status: WalletStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: WalletStatus | string) => {
    // Handle WalletStatus enum values
    switch (status) {
      case WalletStatus.ACTIVE:
        return {
          label: 'Active',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
        };
      case WalletStatus.PAUSED:
        return {
          label: 'Paused',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
        };
      case WalletStatus.BANNED:
        return {
          label: 'Banned',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'
        };
      case WalletStatus.ARCHIVED:
        return {
          label: 'Archived',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
        };
    }
    
    // Handle string status values (for processes)
    switch (status.toLowerCase()) {
      case 'running':
      case 'in_progress':
        return {
          label: 'Running',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
        };
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
        };
      case 'failed':
        return {
          label: 'Failed',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'
        };
      case 'stopped':
        return {
          label: 'Stopped',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      {config.label}
    </span>
  );
};
