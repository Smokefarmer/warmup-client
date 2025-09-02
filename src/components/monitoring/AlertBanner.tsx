import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert } from '../../types/monitoring';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ 
  alerts, 
  onDismiss,
  className = '' 
}) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertStyles = (level: Alert['level']) => {
    switch (level) {
      case 'critical':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-600',
          text: 'text-red-800 dark:text-red-200',
          button: 'text-red-600 hover:text-red-800',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600',
          text: 'text-yellow-800 dark:text-yellow-200',
          button: 'text-yellow-600 hover:text-yellow-800',
        };
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600',
          text: 'text-blue-800 dark:text-blue-200',
          button: 'text-blue-600 hover:text-blue-800',
        };
      default:
        return {
          container: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          icon: 'text-gray-600',
          text: 'text-gray-800 dark:text-gray-200',
          button: 'text-gray-600 hover:text-gray-800',
        };
    }
  };

  const getAlertIcon = (level: Alert['level']) => {
    switch (level) {
      case 'critical':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return Info;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {alerts.map((alert, index) => {
        const styles = getAlertStyles(alert.level);
        const IconComponent = getAlertIcon(alert.level);
        const alertId = `${alert.level}-${alert.message}-${index}`;

        return (
          <div
            key={alertId}
            className={`rounded-lg border p-4 ${styles.container}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <IconComponent className={`h-5 w-5 ${styles.icon}`} />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-sm font-medium ${styles.text}`}>
                      {alert.icon} {alert.message}
                    </h3>
                    {alert.action && (
                      <div className={`mt-2 text-sm ${styles.text} opacity-90`}>
                        <strong>Action:</strong> {alert.action}
                      </div>
                    )}
                    {alert.timestamp && (
                      <div className={`mt-1 text-xs ${styles.text} opacity-70`}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  {onDismiss && (
                    <button
                      type="button"
                      className={`ml-3 inline-flex rounded-md p-1.5 ${styles.button} hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      onClick={() => onDismiss(alertId)}
                    >
                      <span className="sr-only">Dismiss</span>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
