import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from './Button';

export interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

interface ActionsMenuProps {
  actions: ActionItem[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ActionsMenu: React.FC<ActionsMenuProps> = ({ 
  actions, 
  className = '', 
  size = 'sm' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleActionClick = (action: ActionItem) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <Button
        variant="secondary"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center"
        title="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled || action.loading}
                title={action.title}
                className={`
                  w-full px-4 py-2 text-left text-sm flex items-center space-x-2 
                  hover:bg-gray-100 dark:hover:bg-gray-700 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-150
                  ${action.variant === 'danger' 
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' 
                    : action.variant === 'warning'
                    ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                    : action.variant === 'success'
                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <span className="flex-shrink-0">
                  {action.icon}
                </span>
                <span className="flex-1">
                  {action.label}
                </span>
                {action.loading && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
