import React from 'react';
import { Card } from '../common/Card';
import { SystemHealth } from '../../services/monitoringService';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  Database,
  Coins,
  TrendingUp,
  Wifi
} from 'lucide-react';

interface SystemStatusCardProps {
  health: SystemHealth;
  lastUpdate?: Date;
  isConnected?: boolean;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  health,
  lastUpdate,
  isConnected = true
}) => {
  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6" />;
      case 'degraded':
        return <AlertCircle className="w-6 h-6" />;
      case 'critical':
        return <XCircle className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'solana':
        return <Coins className="w-4 h-4" />;
      case 'jupiter':
        return <TrendingUp className="w-4 h-4" />;
      case 'funding':
        return <Wifi className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'available':
        return 'text-green-500';
      case 'disconnected':
      case 'unavailable':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="system-status-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          System Status
        </h2>
        <div className="flex items-center space-x-2">
          {!isConnected && (
            <div className="flex items-center text-red-500 text-sm">
              <XCircle className="w-4 h-4 mr-1" />
              Offline
            </div>
          )}
          {lastUpdate && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <div className={`status-indicator rounded-lg p-4 mb-6 ${getStatusColor(health.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(health.status)}
            <div className="ml-3">
              <h3 className="text-lg font-semibold capitalize">
                {health.status}
              </h3>
              <p className="text-sm opacity-75">
                Uptime: {health.uptime}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Last Updated</p>
            <p className="text-xs">
              {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-grid grid grid-cols-2 gap-4">
        {Object.entries(health.services).map(([service, status]) => (
          <div
            key={service}
            className="service-item flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className={getServiceStatusColor(status)}>
                {getServiceIcon(service)}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {service}
              </span>
            </div>
            <div className="flex items-center">
              <div
                className={`status-dot w-3 h-3 rounded-full ${
                  status === 'connected' || status === 'available'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 capitalize">
                {status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {health.statistics.activeProcesses}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Active Processes
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(health.statistics.successRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Success Rate
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
