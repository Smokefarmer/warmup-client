import React from 'react';
import { Card } from '../common/Card';
import { SystemHealth } from '../../services/monitoringService';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

interface EmergencyRecoveryCardProps {
  emergencyRecovery: SystemHealth['emergencyRecovery'];
  recentActivity: SystemHealth['recentActivity'];
}

export const EmergencyRecoveryCard: React.FC<EmergencyRecoveryCardProps> = ({
  emergencyRecovery,
  recentActivity
}) => {
  const recoveryRate = emergencyRecovery.totalAttempts > 0 
    ? (emergencyRecovery.successfulRecoveries / emergencyRecovery.totalAttempts * 100)
    : 0;

  const getRecoveryRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const getRecoveryRateStatus = (rate: number) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Card className="emergency-recovery-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Emergency Recovery Status
          </h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRecoveryRateColor(recoveryRate)}`}>
          {getRecoveryRateStatus(recoveryRate)}
        </div>
      </div>

      {/* Recovery Rate Overview */}
      <div className="recovery-overview mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recovery Success Rate
            </span>
          </div>
          <span className={`text-2xl font-bold ${
            recoveryRate >= 80 ? 'text-green-600' : 
            recoveryRate >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {recoveryRate.toFixed(1)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              recoveryRate >= 80 ? 'bg-green-500' : 
              recoveryRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${recoveryRate}%` }}
          />
        </div>
      </div>

      {/* Recovery Statistics Grid */}
      <div className="recovery-stats grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-item text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <span className="text-2xl font-bold text-green-600">
            {emergencyRecovery.successfulRecoveries}
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Successful Recoveries
          </p>
        </div>

        <div className="stat-item text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg mx-auto mb-2">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-2xl font-bold text-red-600">
            {emergencyRecovery.failedRecoveries}
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Failed Recoveries
          </p>
        </div>

        <div className="stat-item text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-2">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {emergencyRecovery.totalAttempts}
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Attempts
          </p>
        </div>
      </div>

      {/* Recent Recovery Activity */}
      <div className="recent-activity mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-500" />
          Recent Recovery Activity
        </h3>
        
        <div className="activity-comparison grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="time-period p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
              Last Hour
            </h4>
            <div className="activity-stats space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Emergency Recoveries:
                </span>
                <span className={`font-medium ${
                  recentActivity.lastHour.emergencyRecoveries > 0 
                    ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {recentActivity.lastHour.emergencyRecoveries}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total Transactions:
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {recentActivity.lastHour.transactions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Success Rate:
                </span>
                <span className="font-medium text-green-600">
                  {recentActivity.lastHour.transactions > 0 
                    ? ((recentActivity.lastHour.successfulTrades / recentActivity.lastHour.transactions) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="time-period p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
              Last 24 Hours
            </h4>
            <div className="activity-stats space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Emergency Recoveries:
                </span>
                <span className={`font-medium ${
                  recentActivity.last24Hours.emergencyRecoveries > 0 
                    ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {recentActivity.last24Hours.emergencyRecoveries}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total Transactions:
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {recentActivity.last24Hours.transactions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Success Rate:
                </span>
                <span className="font-medium text-green-600">
                  {recentActivity.last24Hours.transactions > 0 
                    ? ((recentActivity.last24Hours.successfulTrades / recentActivity.last24Hours.transactions) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Recovery Information */}
      <div className="last-recovery p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Recovery Attempt:
            </span>
          </div>
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {emergencyRecovery.lastRecovery === 'Never' 
              ? 'No recoveries yet' 
              : new Date(emergencyRecovery.lastRecovery).toLocaleString()
            }
          </span>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="mt-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            emergencyRecovery.failedRecoveries === 0 ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-gray-600 dark:text-gray-400">
            Recovery System {emergencyRecovery.failedRecoveries === 0 ? 'Healthy' : 'Needs Attention'}
          </span>
        </div>
      </div>
    </Card>
  );
};
