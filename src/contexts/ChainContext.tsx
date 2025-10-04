import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN, getSupportedChainById } from '../config/chains';

interface ChainConfig {
  id: number;
  name: string;
  symbol: string;
  decimals: number;
  color: string;
  icon: string;
  type: string;
}

interface ChainContextType {
  selectedChain: ChainConfig;
  setSelectedChain: (chain: ChainConfig) => void;
  supportedChains: ChainConfig[];
  isChainSupported: (chainId: number) => boolean;
  getChainById: (chainId: number) => ChainConfig | undefined;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

const CHAIN_STORAGE_KEY = 'warmup-selected-chain';

interface ChainProviderProps {
  children: ReactNode;
}

export const ChainProvider: React.FC<ChainProviderProps> = ({ children }) => {
  const [selectedChain, setSelectedChainState] = useState<ChainConfig>(DEFAULT_CHAIN);
  const supportedChains = Object.values(SUPPORTED_CHAINS);

  // Load selected chain from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CHAIN_STORAGE_KEY);
    if (stored) {
      try {
        const chainId = parseInt(stored);
        const chain = getSupportedChainById(chainId);
        if (chain) {
          setSelectedChainState(chain);
        }
      } catch (error) {
        console.warn('Failed to load selected chain from localStorage:', error);
      }
    }
  }, []);

  // Save selected chain to localStorage whenever it changes
  const setSelectedChain = (chain: ChainConfig) => {
    setSelectedChainState(chain);
    localStorage.setItem(CHAIN_STORAGE_KEY, chain.id.toString());
    
    // Dispatch custom event for other components to react to chain changes
    window.dispatchEvent(new CustomEvent('chainChanged', { 
      detail: { chainId: chain.id, chain } 
    }));
  };

  const isChainSupported = (chainId: number): boolean => {
    return supportedChains.some(chain => chain.id === chainId);
  };

  const getChainById = (chainId: number): ChainConfig | undefined => {
    return supportedChains.find(chain => chain.id === chainId);
  };

  const value: ChainContextType = {
    selectedChain,
    setSelectedChain,
    supportedChains,
    isChainSupported,
    getChainById
  };

  return (
    <ChainContext.Provider value={value}>
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = (): ChainContextType => {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};

// Hook to listen for chain changes
export const useChainListener = (callback: (chainId: number) => void) => {
  useEffect(() => {
    const handleChainChange = (event: CustomEvent) => {
      callback(event.detail.chainId);
    };

    window.addEventListener('chainChanged', handleChainChange as EventListener);
    return () => {
      window.removeEventListener('chainChanged', handleChainChange as EventListener);
    };
  }, [callback]);
};

export default ChainProvider;

