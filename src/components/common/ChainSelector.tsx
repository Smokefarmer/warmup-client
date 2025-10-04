import React, { useState, useRef, useEffect } from 'react';
import { useChain } from '../../contexts/ChainContext';
import { ChevronDown, Check, Network } from 'lucide-react';

interface ChainSelectorProps {
  className?: string;
  compact?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const { selectedChain, setSelectedChain, supportedChains } = useChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChainSelect = (chain: typeof selectedChain) => {
    setSelectedChain(chain);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          style={{ borderColor: selectedChain.color + '40' }}
        >
          <span className="text-lg">{selectedChain.icon}</span>
          <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-gray-100">
            {selectedChain.symbol}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            {supportedChains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chain)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
              >
                <span className="text-lg">{chain.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {chain.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {chain.symbol}
                  </div>
                </div>
                {selectedChain.id === chain.id && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[200px]"
        style={{ borderColor: selectedChain.color + '40' }}
      >
        <span className="text-xl">{selectedChain.icon}</span>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {selectedChain.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {selectedChain.symbol} • {selectedChain.type}
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
              Select Chain
            </div>
            {supportedChains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chain)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <span className="text-lg">{chain.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {chain.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {chain.symbol} • {chain.decimals} decimals
                  </div>
                </div>
                {selectedChain.id === chain.id && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainSelector;

