import React from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { 
  Send, 
  RefreshCw, 
  Zap, 
  DollarSign,
  Wallet,
  Settings
} from 'lucide-react';

interface QuickActionsProps {
  onFundAll: () => void;
  onRandomFund: () => void;
  onRefresh: () => void;
  onSettings?: () => void;
  selectedCount: number;
  totalCount: number;
  isLoading?: boolean;
  funderAvailable?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onFundAll,
  onRandomFund,
  onRefresh,
  onSettings,
  selectedCount,
  totalCount,
  isLoading = false,
  funderAvailable = true
}) => {
  return (
    <Card title="Quick Actions" subtitle="Common funding operations">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fund All Button */}
        <Button
          variant="primary"
          onClick={onFundAll}
          disabled={selectedCount === 0 || !funderAvailable || isLoading}
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <Send className="w-5 h-5" />
          <span className="text-sm">Fund All</span>
          <span className="text-xs opacity-75">
            {selectedCount} selected
          </span>
        </Button>

        {/* Random Fund Button */}
        <Button
          variant="secondary"
          onClick={onRandomFund}
          disabled={selectedCount === 0 || !funderAvailable || isLoading}
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <Zap className="w-5 h-5" />
          <span className="text-sm">Random Fund</span>
          <span className="text-xs opacity-75">
            {selectedCount} wallets
          </span>
        </Button>

        {/* Refresh Button */}
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
          <span className="text-xs opacity-75">
            {totalCount} total
          </span>
        </Button>

        {/* Settings Button */}
        {onSettings && (
          <Button
            variant="secondary"
            onClick={onSettings}
            className="h-16 flex flex-col items-center justify-center space-y-1"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
            <span className="text-xs opacity-75">
              Configure
            </span>
          </Button>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {selectedCount} of {totalCount} wallets selected
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Funder: {funderAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Auto-refresh every 30s
          </div>
        </div>
      </div>
    </Card>
  );
};
