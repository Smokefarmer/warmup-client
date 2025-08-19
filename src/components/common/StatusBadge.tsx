import React from 'react';
import { getStatusColor } from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const color = getStatusColor(status);
  const colorClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info'
  };

  return (
    <span className={`${colorClasses[color as keyof typeof colorClasses]} ${className}`}>
      {status}
    </span>
  );
};
