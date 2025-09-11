/**
 * Simple Usage Examples for Solana Warmup
 * 
 * This file shows how to use the new Solana warmup functionality
 * in a simple, straightforward way.
 */

import { SolanaWarmupService } from '../services/solanaWarmupService';
import { MultiChainService } from '../services/multiChainService';
import { ChainId } from '../types/wallet';

/**
 * Example 1: Your original interface, but improved
 */
export const improvedOriginalInterface = async () => {
  try {
    // 1. Create batch of Solana wallets (using existing service)
    const wallets = await MultiChainService.generateSolanaWalletsBatch(5, ChainId.SOLANA_DEVNET);
    console.log(`Created ${wallets.length} Solana wallets`);
    
    // 2. Extract wallet IDs
    const walletIds = wallets.map(wallet => wallet._id);
    
    // 3. Create warmup process (improved version)
    const process = await SolanaWarmupService.createSolanaWarmupProcess(
      walletIds,
      "Solana Multi-Strategy Warmup",
      {
        maxConcurrentWallets: 5,
        transactionInterval: 30,
        maxTransactionsPerWallet: 10,
        minTransactionAmount: '0.001',
        maxTransactionAmount: '0.01',
        priorityMode: 'round-robin'
      }
    );
    console.log(`Created warmup process: ${process._id}`);
    
    // 4. Start the process
    await SolanaWarmupService.startSolanaWarmupProcess(process._id);
    console.log('Warmup process started!');
    
    // 5. Monitor progress (improved polling)
    const stopMonitoring = await SolanaWarmupService.monitorSolanaProcess(
      process._id,
      (stats) => {
        console.log(`Progress: ${stats.completedWallets}/${stats.totalWallets} wallets completed`);
        console.log(`SOL Volume: ${stats.solanaSpecific?.totalSOLVolume || '0'} SOL`);
      },
      (finalStats) => {
        console.log('Warmup process completed!', finalStats);
      },
      (error) => {
        console.error('Monitoring error:', error);
      },
      30000 // 30 seconds
    );
    
    // You can stop monitoring manually if needed
    // setTimeout(() => stopMonitoring(), 60000); // Stop after 1 minute
    
  } catch (error) {
    console.error('Error setting up Solana warmup:', error);
  }
};

/**
 * Example 2: One-liner setup
 */
export const oneLinerSetup = async () => {
  try {
    // Everything in one function call
    const result = await SolanaWarmupService.createSolanaWarmupProcess(
      ['wallet1', 'wallet2', 'wallet3'], // Your wallet IDs
      "Quick Solana Warmup",
      {
        maxConcurrentWallets: 3,
        transactionInterval: 45,
        maxTransactionsPerWallet: 5
      }
    );
    
    console.log('Process created:', result._id);
    return result;
  } catch (error) {
    console.error('Setup failed:', error);
  }
};

/**
 * Example 3: Using the React hook in a component
 */
export const reactComponentExample = `
import React from 'react';
import { useSolanaWarmup } from '../hooks/useSolanaWarmup';

export const MySolanaComponent: React.FC = () => {
  const {
    currentProcessId,
    isMonitoring,
    processStats,
    setupAndStartWarmup,
    stopProcess
  } = useSolanaWarmup({
    onProgress: (stats) => console.log('Progress:', stats),
    onComplete: (stats) => console.log('Completed:', stats)
  });

  const handleStart = async () => {
    try {
      await setupAndStartWarmup({
        walletCount: 5,
        processName: "My Solana Warmup"
      });
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  return (
    <div>
      <button onClick={handleStart} disabled={isMonitoring}>
        Start Solana Warmup
      </button>
      
      {processStats && (
        <div>
          <p>Progress: {processStats.completedWallets}/{processStats.totalWallets}</p>
          <p>SOL Volume: {processStats.solanaSpecific?.totalSOLVolume || '0'} SOL</p>
        </div>
      )}
    </div>
  );
};
`;

/**
 * Example 4: Direct API calls (your original style)
 */
export const directApiCalls = async () => {
  // Your original functions, but with better error handling
  const createWarmupProcess = async (walletIds: string[]) => {
    try {
      const response = await fetch('http://localhost:3000/api/warmup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Solana Multi-Strategy Warmup",
          walletIds: walletIds,
          configuration: {
            maxConcurrentWallets: 5,
            priorityMode: "round-robin",
            transactionInterval: 30,
            maxTransactionsPerWallet: 10,
            minTransactionAmount: "0.001",
            maxTransactionAmount: "0.01"
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to create warmup process:', error);
      throw error;
    }
  };

  const startWarmupProcess = async (processId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/warmup/${processId}/start`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to start warmup process:', error);
      throw error;
    }
  };

  const getProcessStats = async (processId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/warmup/${processId}/statistics`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to get process stats:', error);
      throw error;
    }
  };

  const getTransactionLogs = async (processId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/warmup/${processId}/transactions`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to get transaction logs:', error);
      throw error;
    }
  };

  const getOverallStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/warmup/statistics');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to get overall stats:', error);
      throw error;
    }
  };

  // Usage example
  try {
    const process = await createWarmupProcess(['wallet1', 'wallet2']);
    await startWarmupProcess(process._id);
    
    // Monitor progress
    const interval = setInterval(async () => {
      const stats = await getProcessStats(process._id);
      console.log(`Progress: ${stats.completedWallets}/${stats.totalWallets}`);
      
      if (stats.status === 'completed') {
        clearInterval(interval);
        console.log('Process completed!');
      }
    }, 30000);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

/**
 * Example 5: Complete workflow with validation
 */
export const completeWorkflowWithValidation = async () => {
  try {
    // Step 1: Generate wallets
    const wallets = await MultiChainService.generateSolanaWalletsBatch(5, ChainId.SOLANA_DEVNET);
    const walletIds = wallets.map(w => w._id);
    
    // Step 2: Validate wallets
    const validation = await SolanaWarmupService.validateSolanaWallets(walletIds);
    if (!validation.valid) {
      console.error('Validation failed:', validation.errors);
      return;
    }
    
    // Step 3: Create process
    const process = await SolanaWarmupService.createSolanaWarmupProcess(
      validation.validWallets,
      "Validated Solana Warmup"
    );
    
    // Step 4: Start process
    await SolanaWarmupService.startSolanaWarmupProcess(process._id);
    
    // Step 5: Monitor with comprehensive stats
    const stopMonitoring = await SolanaWarmupService.monitorSolanaProcess(
      process._id,
      async (stats) => {
        console.log('Progress update:', stats);
        
        // Get detailed logs every 10 updates
        if (stats.completedWallets % 10 === 0) {
          const logs = await SolanaWarmupService.getSolanaTransactionLogs(process._id);
          console.log('Recent transactions:', logs.slice(0, 5));
        }
      },
      async (finalStats) => {
        console.log('Process completed!');
        
        // Get comprehensive final report
        const comprehensiveStats = await SolanaWarmupService.getSolanaOverallStats();
        console.log('Final comprehensive stats:', comprehensiveStats);
      }
    );
    
    return { process, stopMonitoring };
    
  } catch (error) {
    console.error('Workflow failed:', error);
  }
};
