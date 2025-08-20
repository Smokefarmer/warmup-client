import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  size = 'sm',
  variant = 'icon',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        className={`inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${className}`}
        title="Copy address"
      >
        {copied ? (
          <Check className={`${sizeClasses[size]} text-green-600 dark:text-green-400`} />
        ) : (
          <Copy className={`${sizeClasses[size]}`} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center space-x-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${buttonSizeClasses[size]} ${className}`}
    >
      {copied ? (
        <>
          <Check className={`${sizeClasses[size]} text-green-600 dark:text-green-400`} />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className={`${sizeClasses[size]}`} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};
