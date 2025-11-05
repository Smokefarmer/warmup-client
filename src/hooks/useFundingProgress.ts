import { useState, useCallback } from 'react';

export interface FundingProgress {
  isFunding: boolean;
  currentWallet: string | null;
  currentIndex: number;
  totalWallets: number;
  progress: number;
  successful: number;
  failed: number;
  currentCex?: string;
  startTime: number | null;
}

export const useFundingProgress = () => {
  const [progress, setProgress] = useState<FundingProgress>({
    isFunding: false,
    currentWallet: null,
    currentIndex: 0,
    totalWallets: 0,
    progress: 0,
    successful: 0,
    failed: 0,
    startTime: null,
  });

  const startFunding = useCallback((totalWallets: number) => {
    setProgress({
      isFunding: true,
      currentWallet: null,
      currentIndex: 0,
      totalWallets,
      progress: 0,
      successful: 0,
      failed: 0,
      startTime: Date.now(),
    });
  }, []);

  const updateProgress = useCallback((index: number, walletId: string, cex?: string) => {
    setProgress(prev => ({
      ...prev,
      currentIndex: index,
      currentWallet: walletId,
      currentCex: cex,
      progress: (index / prev.totalWallets) * 100,
    }));
  }, []);

  const addSuccess = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      successful: prev.successful + 1,
    }));
  }, []);

  const addFailure = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      failed: prev.failed + 1,
    }));
  }, []);

  const completeFunding = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isFunding: false,
      progress: 100,
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      isFunding: false,
      currentWallet: null,
      currentIndex: 0,
      totalWallets: 0,
      progress: 0,
      successful: 0,
      failed: 0,
      startTime: null,
    });
  }, []);

  return {
    progress,
    startFunding,
    updateProgress,
    addSuccess,
    addFailure,
    completeFunding,
    resetProgress,
  };
};

