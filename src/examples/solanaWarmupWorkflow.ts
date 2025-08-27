import { SolanaWarmupService, SolanaWarmupConfiguration } from '../services/solanaWarmupService';
import { MultiChainService } from '../services/multiChainService';
import { ChainId, WalletType } from '../types/wallet';

/**
 * Complete Solana Warmup Workflow Example
 * 
 * This example demonstrates a complete workflow for setting up and monitoring
 * a Solana warmup process with proper error handling and real-time monitoring.
 */

export class SolanaWarmupWorkflow {
  private processId: string | null = null;
  private monitoringCleanup: (() => void) | null = null;

  /**
   * Complete setup and execution of Solana warmup process
   */
  static async setupSolanaWarmup(options: {
    walletCount?: number;
    customConfig?: Partial<SolanaWarmupConfiguration>;
    processName?: string;
    chainId?: ChainId;
    typeDistribution?: {
      trendTrader?: number;
      majorTrader?: number;
      holder?: number;
      trencher?: number;
    };
  } = {}): Promise<{
    success: boolean;
    processId?: string;
    wallets?: any[];
    error?: string;
  }> {
    try {
      console.log('🚀 Starting Solana warmup workflow...');
      
      const {
        walletCount = 5,
        customConfig,
        processName = "Solana Multi-Strategy Warmup",
        chainId = ChainId.SOLANA_DEVNET,
        typeDistribution = {
          trendTrader: 2,
          majorTrader: 1,
          holder: 1,
          trencher: 1
        }
      } = options;

      // Step 1: Create batch of Solana wallets
      console.log(`📝 Creating ${walletCount} Solana wallets...`);
      const wallets = await MultiChainService.generateSolanaWalletsBatch(
        walletCount,
        chainId,
        typeDistribution
      );
      console.log(`✅ Created ${wallets.length} Solana wallets`);

      // Step 2: Extract wallet IDs
      const walletIds = wallets.map(wallet => wallet._id);
      console.log('📋 Wallet IDs:', walletIds);

      // Step 3: Validate wallets before creating process
      console.log('🔍 Validating Solana wallets...');
      const validation = await SolanaWarmupService.validateSolanaWallets(walletIds);
      
      if (!validation.valid) {
        console.error('❌ Wallet validation failed:', validation.errors);
        return {
          success: false,
          error: `Wallet validation failed: ${validation.errors.join(', ')}`
        };
      }

      console.log(`✅ Validated ${validation.validWallets.length} Solana wallets`);

      // Step 4: Create warmup process with validated wallets
      console.log('🏗️ Creating Solana warmup process...');
      const process = await SolanaWarmupService.createSolanaWarmupProcess(
        validation.validWallets,
        processName,
        customConfig
      );
      console.log(`✅ Created warmup process: ${process._id}`);

      // Step 5: Start the process
      console.log('🚀 Starting warmup process...');
      await SolanaWarmupService.startSolanaWarmupProcess(process._id);
      console.log('✅ Warmup process started successfully!');

      return {
        success: true,
        processId: process._id,
        wallets
      };

    } catch (error: any) {
      console.error('❌ Error in Solana warmup workflow:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Monitor a running Solana warmup process with real-time updates
   */
  static async monitorSolanaProcess(
    processId: string,
    options: {
      onProgress?: (stats: any) => void;
      onComplete?: (finalStats: any) => void;
      onError?: (error: any) => void;
      intervalMs?: number;
    } = {}
  ): Promise<() => void> {
    const {
      onProgress,
      onComplete,
      onError,
      intervalMs = 5000
    } = options;

    console.log(`📊 Starting monitoring for process: ${processId}`);

    // Set up monitoring with callbacks
    const cleanup = await SolanaWarmupService.monitorSolanaProcess(
      processId,
      (stats) => {
        console.log(`📈 Progress Update:`, {
          completedWallets: stats.completedWallets,
          totalWallets: stats.totalWallets,
          successRate: `${(stats.successRate * 100).toFixed(1)}%`,
          totalSOLVolume: stats.solanaSpecific?.totalSOLVolume || '0'
        });
        
        if (onProgress) onProgress(stats);
      },
      (finalStats) => {
        console.log('🎉 Process completed!', {
          totalWallets: finalStats.totalWallets,
          completedWallets: finalStats.completedWallets,
          totalSOLVolume: finalStats.solanaSpecific?.totalSOLVolume || '0',
          averageTransactionTime: finalStats.solanaSpecific?.averageTransactionTime || 0
        });
        
        if (onComplete) onComplete(finalStats);
      },
      (error) => {
        console.error('❌ Monitoring error:', error);
        if (onError) onError(error);
      },
      intervalMs
    );

    // Return cleanup function for manual stopping
    return cleanup;
  }

  /**
   * Get detailed transaction logs for analysis
   */
  static async getDetailedTransactionLogs(
    processId: string,
    filters?: {
      status?: 'pending' | 'completed' | 'failed';
      limit?: number;
      walletId?: string;
    }
  ): Promise<any[]> {
    try {
      console.log(`📋 Fetching transaction logs for process: ${processId}`);
      const logs = await SolanaWarmupService.getSolanaTransactionLogs(processId, filters);
      console.log(`✅ Retrieved ${logs.length} transaction logs`);
      return logs;
    } catch (error: any) {
      console.error('❌ Error fetching transaction logs:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive statistics and analytics
   */
  static async getComprehensiveStats(processId: string): Promise<any> {
    try {
      console.log(`📊 Fetching comprehensive stats for process: ${processId}`);
      
      // Get process-specific stats
      const processStats = await SolanaWarmupService.getSolanaProcessStats(processId);
      
      // Get transaction logs
      const transactionLogs = await SolanaWarmupService.getSolanaTransactionLogs(processId, {
        limit: 100
      });
      
      // Get overall multi-chain stats
      const overallStats = await SolanaWarmupService.getSolanaOverallStats();
      
      const comprehensiveStats = {
        process: processStats,
        transactions: transactionLogs,
        overall: overallStats,
        summary: {
          totalWallets: processStats.totalWallets,
          completedWallets: processStats.completedWallets,
          successRate: processStats.successRate,
          totalSOLVolume: processStats.solanaSpecific?.totalSOLVolume || '0',
          averageTransactionTime: processStats.solanaSpecific?.averageTransactionTime || 0,
          totalTransactions: processStats.totalTransactions
        }
      };
      
      console.log('✅ Comprehensive stats retrieved');
      return comprehensiveStats;
    } catch (error: any) {
      console.error('❌ Error fetching comprehensive stats:', error);
      throw error;
    }
  }
}

/**
 * Usage Examples
 */

// Example 1: Basic workflow
export const basicSolanaWarmupExample = async () => {
  const result = await SolanaWarmupWorkflow.setupSolanaWarmup({
    walletCount: 3,
    processName: "My First Solana Warmup"
  });

  if (result.success && result.processId) {
    console.log('🎉 Setup completed! Process ID:', result.processId);
    
    // Start monitoring
    await SolanaWarmupWorkflow.monitorSolanaProcess(result.processId, {
      onProgress: (stats) => {
        console.log(`Progress: ${stats.completedWallets}/${stats.totalWallets}`);
      },
      onComplete: (finalStats) => {
        console.log('Process completed!', finalStats);
      }
    });
  } else {
    console.error('Setup failed:', result.error);
  }
};

// Example 2: Advanced configuration
export const advancedSolanaWarmupExample = async () => {
  const customConfig: Partial<SolanaWarmupConfiguration> = {
    maxConcurrentWallets: 3,
    transactionInterval: 45, // 45 seconds between transactions
    maxTransactionsPerWallet: 5,
    minTransactionAmount: '0.002', // 0.002 SOL
    maxTransactionAmount: '0.005', // 0.005 SOL
    priorityMode: 'sequential',
    retryAttempts: 5,
    gasOptimization: true,
    slippageTolerance: 1.0 // 1% slippage tolerance
  };

  const result = await SolanaWarmupWorkflow.setupSolanaWarmup({
    walletCount: 10,
    customConfig,
    processName: "Advanced Solana Warmup",
    typeDistribution: {
      trendTrader: 4,
      majorTrader: 3,
      holder: 2,
      trencher: 1
    }
  });

  if (result.success && result.processId) {
    // Monitor with detailed callbacks
    const cleanup = await SolanaWarmupWorkflow.monitorSolanaProcess(result.processId, {
      onProgress: (stats) => {
        console.log(`📊 Progress: ${stats.completedWallets}/${stats.totalWallets} wallets`);
        console.log(`💰 SOL Volume: ${stats.solanaSpecific?.totalSOLVolume || '0'} SOL`);
        console.log(`⚡ Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
      },
      onComplete: async (finalStats) => {
        console.log('🎉 Process completed! Getting detailed analysis...');
        
        // Get comprehensive stats
        const comprehensiveStats = await SolanaWarmupWorkflow.getComprehensiveStats(result.processId!);
        console.log('📊 Final Analysis:', comprehensiveStats);
      },
      onError: (error) => {
        console.error('❌ Monitoring error:', error);
      }
    });

    // You can stop monitoring manually if needed
    // setTimeout(() => cleanup(), 60000); // Stop after 1 minute
  }
};

// Example 3: Error handling and recovery
export const robustSolanaWarmupExample = async () => {
  try {
    // Step 1: Setup with error handling
    const setupResult = await SolanaWarmupWorkflow.setupSolanaWarmup({
      walletCount: 5,
      processName: "Robust Solana Warmup"
    });

    if (!setupResult.success) {
      console.error('❌ Setup failed:', setupResult.error);
      return;
    }

    // Step 2: Monitor with error recovery
    let retryCount = 0;
    const maxRetries = 3;

    const monitorWithRetry = async () => {
      try {
        await SolanaWarmupWorkflow.monitorSolanaProcess(setupResult.processId!, {
          onProgress: (stats) => {
            console.log(`Progress: ${stats.completedWallets}/${stats.totalWallets}`);
            retryCount = 0; // Reset retry count on successful progress
          },
          onComplete: (finalStats) => {
            console.log('✅ Process completed successfully!', finalStats);
          },
          onError: async (error) => {
            console.error(`❌ Monitoring error (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`🔄 Retrying monitoring in 10 seconds... (${retryCount}/${maxRetries})`);
              setTimeout(monitorWithRetry, 10000);
            } else {
              console.error('❌ Max retries exceeded. Manual intervention required.');
            }
          }
        });
      } catch (error) {
        console.error('❌ Fatal monitoring error:', error);
      }
    };

    await monitorWithRetry();

  } catch (error) {
    console.error('❌ Fatal workflow error:', error);
  }
};
