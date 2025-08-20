import { useState, useCallback, useRef } from 'react';
import { UpdateTotalFundedResponse } from '../services/balanceService';

export interface ScanProgress {
  isScanning: boolean;
  currentWallet: string | null;
  currentIndex: number;
  totalWallets: number;
  progress: number;
  estimatedTimeRemaining: number | null;
  results: UpdateTotalFundedResponse[];
  errors: UpdateTotalFundedResponse[];
  startTime: number | null;
  cancelRequested: boolean;
}

export const useScanProgress = () => {
  const [progress, setProgress] = useState<ScanProgress>({
    isScanning: false,
    currentWallet: null,
    currentIndex: 0,
    totalWallets: 0,
    progress: 0,
    estimatedTimeRemaining: null,
    results: [],
    errors: [],
    startTime: null,
    cancelRequested: false,
  });

  const cancelRef = useRef<boolean>(false);

  // Start scanning
  const startScan = useCallback((totalWallets: number) => {
    setProgress({
      isScanning: true,
      currentWallet: null,
      currentIndex: 0,
      totalWallets,
      progress: 0,
      estimatedTimeRemaining: null,
      results: [],
      errors: [],
      startTime: Date.now(),
      cancelRequested: false,
    });
    cancelRef.current = false;
  }, []);

  // Update current wallet being scanned
  const updateCurrentWallet = useCallback((walletId: string, index: number) => {
    setProgress(prev => {
      const newProgress = (index / prev.totalWallets) * 100;
      const elapsed = Date.now() - (prev.startTime || Date.now());
      const estimatedTimeRemaining = index > 0 
        ? (elapsed / index) * (prev.totalWallets - index)
        : null;

      return {
        ...prev,
        currentWallet: walletId,
        currentIndex: index,
        progress: newProgress,
        estimatedTimeRemaining,
      };
    });
  }, []);

  // Add result
  const addResult = useCallback((result: UpdateTotalFundedResponse) => {
    setProgress(prev => ({
      ...prev,
      results: [...prev.results, result],
      errors: result.success ? prev.errors : [...prev.errors, result],
    }));
  }, []);

  // Request cancellation
  const requestCancel = useCallback(() => {
    setProgress(prev => ({ ...prev, cancelRequested: true }));
    cancelRef.current = true;
  }, []);

  // Check if cancellation was requested
  const isCancelled = useCallback(() => {
    return cancelRef.current;
  }, []);

  // Complete scanning
  const completeScan = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isScanning: false,
      currentWallet: null,
    }));
  }, []);

  // Reset progress
  const resetProgress = useCallback(() => {
    setProgress({
      isScanning: false,
      currentWallet: null,
      currentIndex: 0,
      totalWallets: 0,
      progress: 0,
      estimatedTimeRemaining: null,
      results: [],
      errors: [],
      startTime: null,
      cancelRequested: false,
    });
    cancelRef.current = false;
  }, []);

  // Format estimated time remaining
  const formatEstimatedTime = useCallback((seconds: number | null): string => {
    if (seconds === null) return 'Calculating...';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }, []);

  return {
    progress,
    startScan,
    updateCurrentWallet,
    addResult,
    requestCancel,
    isCancelled,
    completeScan,
    resetProgress,
    formatEstimatedTime,
  };
};
