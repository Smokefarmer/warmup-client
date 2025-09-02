import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ProcessQuickInfo } from '../../types/monitoring';

interface ProcessSelectorProps {
  processes: ProcessQuickInfo[];
  selectedProcessId: string | null;
  onSelectProcess: (processId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const ProcessSelector: React.FC<ProcessSelectorProps> = ({
  processes,
  selectedProcessId,
  onSelectProcess,
  isLoading = false,
  className = ''
}) => {
  const selectedProcess = processes.find(p => p.id === selectedProcessId);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-48"></div>
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className={`text-gray-500 dark:text-gray-400 text-sm ${className}`}>
        No processes available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedProcessId || ''}
        onChange={(e) => onSelectProcess(e.target.value)}
        className="appearance-none w-full px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      >
        <option value="" disabled>Select a process...</option>
        {processes.map((process) => (
          <option key={process.id} value={process.id}>
            {process.name} ({process.walletCount} wallets) - {process.status}
            {process.isActive && ' 🟢'}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};
