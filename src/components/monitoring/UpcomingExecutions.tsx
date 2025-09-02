import React from 'react';
import { Card } from '../common/Card';
import { Clock, Play, Wallet } from 'lucide-react';
import { UpcomingExecution } from '../../types/monitoring';

interface UpcomingExecutionsProps {
  executions: UpcomingExecution[];
  isLoading?: boolean;
}

export const UpcomingExecutions: React.FC<UpcomingExecutionsProps> = ({ 
  executions, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card title="Upcoming Executions" subtitle="Next 5 wallet executions">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!executions || executions.length === 0) {
    return (
      <Card title="Upcoming Executions" subtitle="Next 5 wallet executions">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No upcoming executions</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Start the process to see scheduled transactions
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Upcoming Executions" subtitle={`Next ${executions.length} wallet executions`}>
      <div className="space-y-3">
        {executions.map((execution, index) => {
          const isReady = execution.timeUntil === 'Ready' || (execution.timeUntilMs && execution.timeUntilMs <= 0);
          
          return (
            <div
              key={`${execution.wallet}-${index}`}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isReady 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {/* Wallet Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isReady 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {isReady ? (
                  <Play className={`w-4 h-4 ${isReady ? 'text-green-600' : 'text-blue-600'}`} />
                ) : (
                  <Wallet className={`w-4 h-4 ${isReady ? 'text-green-600' : 'text-blue-600'}`} />
                )}
              </div>

              {/* Wallet Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {execution.wallet}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {execution.action}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: {execution.balance}
                  {execution.status && (
                    <span className="ml-2">• {execution.status}</span>
                  )}
                </p>
              </div>

              {/* Countdown */}
              <div className="flex-shrink-0 text-right">
                <div className={`text-sm font-mono font-medium ${
                  isReady 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {isReady ? (
                    <span className="inline-flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      Ready
                    </span>
                  ) : (
                    execution.timeUntil
                  )}
                </div>
                {!isReady && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    until {execution.action.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {executions.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No executions scheduled
          </p>
        </div>
      )}
    </Card>
  );
};
