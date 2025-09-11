import api from './api';
import { 
  ChainId, 
  ChainConfig, 
  CreateMultiChainWalletDto,
  IWarmUpWallet 
} from '../types/wallet';

export interface WalletBalance {
  chainId: ChainId;
  publicKey: string;
  nativeBalance: string;
  nativeBalanceFormatted: string;
  tokenBalances?: {
    [tokenAddress: string]: {
      balance: string;
      symbol: string;
      decimals: number;
    };
  };
}

export interface TransactionStatus {
  chainId: ChainId;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'unknown';
  confirmations?: number;
  blockNumber?: number;
  timestamp?: number;
  error?: string;
}

export interface MultiChainProcess {
  id: string;
  name: string;
  wallets: {
    chainId: ChainId;
    walletId: string;
    publicKey: string;
  }[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export class MultiChainService {
  // Chain configurations
  static readonly CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
    [ChainId.BASE]: {
      chainId: ChainId.BASE,
      name: 'Base',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrl: 'https://mainnet.base.org',
      explorerUrl: 'https://basescan.org',
      isTestnet: false
    },
    [ChainId.SOLANA]: {
      chainId: ChainId.SOLANA,
      name: 'Solana',
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9
      },
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      explorerUrl: 'https://solscan.io',
      isTestnet: false
    },
    [ChainId.SOLANA_DEVNET]: {
      chainId: ChainId.SOLANA_DEVNET,
      name: 'Solana Devnet',
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9
      },
      rpcUrl: 'https://api.devnet.solana.com',
      explorerUrl: 'https://solscan.io/?cluster=devnet',
      isTestnet: true
    },
    [ChainId.SOLANA_TESTNET]: {
      chainId: ChainId.SOLANA_TESTNET,
      name: 'Solana Testnet',
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9
      },
      rpcUrl: 'https://api.testnet.solana.com',
      explorerUrl: 'https://solscan.io/?cluster=testnet',
      isTestnet: true
    }
  };

  // Get chain configuration
  static getChainConfig(chainId: ChainId): ChainConfig {
    return MultiChainService.CHAIN_CONFIGS[chainId];
  }

  // Get all supported chains
  static getSupportedChains(): ChainConfig[] {
    return Object.values(MultiChainService.CHAIN_CONFIGS);
  }

  // Get supported chains from backend
  static async getSupportedChainsFromBackend(): Promise<any[]> {
    console.log('🌐 Getting supported chains from backend');
    
    try {
      const response = await api.get('/api/chains');
      console.log('✅ Supported chains retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting supported chains:', error);
      // Fallback to local config if backend fails
      return Object.values(MultiChainService.CHAIN_CONFIGS);
    }
  }

  // Get enabled chains from backend
  static async getEnabledChains(): Promise<any[]> {
    console.log('🌐 Getting enabled chains from backend');
    
    try {
      const response = await api.get('/api/chains/enabled');
      console.log('✅ Enabled chains retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting enabled chains:', error);
      // Fallback to local config if backend fails
      return Object.values(MultiChainService.CHAIN_CONFIGS);
    }
  }

  // Get specific chain info from backend
  static async getChainInfo(chainId: ChainId): Promise<any> {
    console.log(`🌐 Getting chain info for chain ${chainId}`);
    
    try {
      const response = await api.get(`/api/chains/${chainId}`);
      console.log('✅ Chain info retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting chain info:', error);
      // Fallback to local config if backend fails
      return MultiChainService.CHAIN_CONFIGS[chainId];
    }
  }

  // Create wallet for specific chain
  static async createWallet(walletData: CreateMultiChainWalletDto): Promise<IWarmUpWallet> {
    console.log('🌐 Creating multi-chain wallet:', walletData);
    
    try {
      const response = await api.post('/api/wallets', {
        publicKey: walletData.publicKey,
        chainId: walletData.chainId,
        type: walletData.type,
        // Add other wallet data as needed
        ...walletData.chainSpecificData
      });
      console.log('✅ Multi-chain wallet created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating multi-chain wallet:', error);
      throw error;
    }
  }

  // Generate Solana wallet (backend generates keypair)
  static async generateSolanaWallet(type: string, chainId: ChainId = ChainId.SOLANA_DEVNET): Promise<IWarmUpWallet> {
    console.log('🌐 Generating Solana wallet:', { type, chainId });
    
    try {
      const response = await api.post('/api/wallets/generate-solana', {
        type,
        chainId
      });
      console.log('✅ Solana wallet generated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error generating Solana wallet:', error);
      throw error;
    }
  }

  // Generate multiple Solana wallets with type distribution
  static async generateSolanaWalletsBatch(
    count: number, 
    chainId: ChainId = ChainId.SOLANA_DEVNET,
    typeDistribution?: {
      trendTrader?: number;
      majorTrader?: number;
      holder?: number;
      trencher?: number;
    }
  ): Promise<IWarmUpWallet[]> {
    console.log('🌐 Generating Solana wallets batch:', { count, chainId, typeDistribution });
    
    try {
      const response = await api.post('/api/wallets/batch', {
        count,
        chainId,
        typeDistribution
      });
      console.log('✅ Solana wallets batch generated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error generating Solana wallets batch:', error);
      throw error;
    }
  }

  // Create multiple wallets for different chains
  static async createMultiChainWallets(wallets: CreateMultiChainWalletDto[]): Promise<IWarmUpWallet[]> {
    console.log('🌐 Creating multiple multi-chain wallets:', wallets);
    
    try {
      const response = await api.post('/api/wallets/batch', { wallets });
      console.log('✅ Multi-chain wallets created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating multi-chain wallets:', error);
      throw error;
    }
  }

  // Get wallet balance for specific chain
  static async getWalletBalance(chainId: ChainId, publicKey: string): Promise<WalletBalance> {
    console.log(`🌐 Getting wallet balance for chain ${chainId}, publicKey: ${publicKey}`);
    
    try {
      const response = await api.get(`/api/chains/${chainId}/balance/${publicKey}`);
      console.log('✅ Wallet balance retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting wallet balance:', error);
      throw error;
    }
  }

  // Get balances for multiple wallets across chains
  static async getMultiChainBalances(wallets: { chainId: ChainId; publicKey: string }[]): Promise<WalletBalance[]> {
    console.log('🌐 Getting multi-chain balances:', wallets);
    
    try {
      const promises = wallets.map(wallet => 
        this.getWalletBalance(wallet.chainId, wallet.publicKey)
      );
      const results = await Promise.all(promises);
      console.log('✅ Multi-chain balances retrieved:', results);
      return results;
    } catch (error) {
      console.error('❌ Error getting multi-chain balances:', error);
      throw error;
    }
  }

  // Get transaction status for specific chain
  static async getTransactionStatus(chainId: ChainId, txHash: string): Promise<TransactionStatus> {
    console.log(`🌐 Getting transaction status for chain ${chainId}, txHash: ${txHash}`);
    
    try {
      const response = await api.get(`/api/chains/${chainId}/transaction/${txHash}`);
      console.log('✅ Transaction status retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting transaction status:', error);
      throw error;
    }
  }

  // Get transaction statuses for multiple transactions across chains
  static async getMultiChainTransactionStatuses(transactions: { chainId: ChainId; txHash: string }[]): Promise<TransactionStatus[]> {
    console.log('🌐 Getting multi-chain transaction statuses:', transactions);
    
    try {
      const promises = transactions.map(tx => 
        this.getTransactionStatus(tx.chainId, tx.txHash)
      );
      const results = await Promise.all(promises);
      console.log('✅ Multi-chain transaction statuses retrieved:', results);
      return results;
    } catch (error) {
      console.error('❌ Error getting multi-chain transaction statuses:', error);
      throw error;
    }
  }

  // Fund single Solana wallet
  static async fundSolanaWallet(walletId: string, amount: string): Promise<any> {
    console.log('🌐 Funding Solana wallet:', { walletId, amount });
    
    try {
      const response = await api.post(`/api/funding/wallet/${walletId}`, {
        amount
      });
      console.log('✅ Solana wallet funded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error funding Solana wallet:', error);
      throw error;
    }
  }

  // Fund multiple Solana wallets with same amount
  static async fundSolanaWalletsBatch(walletIds: string[], amount: string): Promise<any> {
    console.log('🌐 Funding Solana wallets batch:', { walletIds, amount });
    
    try {
      const response = await api.post('/api/funding/wallets', {
        walletIds,
        amount
      });
      console.log('✅ Solana wallets batch funded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error funding Solana wallets batch:', error);
      throw error;
    }
  }

  // Fund multiple Solana wallets with random amounts
  static async fundSolanaWalletsRandom(
    walletIds: string[], 
    minAmount: string, 
    maxAmount: string
  ): Promise<any> {
    console.log('🌐 Funding Solana wallets with random amounts:', { walletIds, minAmount, maxAmount });
    
    try {
      const response = await api.post('/api/funding/wallets/random', {
        walletIds,
        minAmount,
        maxAmount
      });
      console.log('✅ Solana wallets funded with random amounts:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error funding Solana wallets with random amounts:', error);
      throw error;
    }
  }

  // Create multi-chain warmup process
  static async createMultiChainProcess(name: string, walletIds: string[]): Promise<MultiChainProcess> {
    console.log('🌐 Creating multi-chain process:', { name, walletIds });
    
    try {
      const response = await api.post('/api/warmup', {
        name,
        walletIds,
        configuration: {
          maxConcurrentWallets: 5
        }
      });
      console.log('✅ Multi-chain process created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating multi-chain process:', error);
      throw error;
    }
  }

  // Get multi-chain process by ID
  static async getMultiChainProcess(id: string): Promise<MultiChainProcess> {
    console.log('🌐 Getting multi-chain process:', id);
    
    try {
      const response = await api.get(`/api/warmup/${id}`);
      console.log('✅ Multi-chain process retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting multi-chain process:', error);
      throw error;
    }
  }

  // Get all multi-chain processes
  static async getMultiChainProcesses(): Promise<MultiChainProcess[]> {
    console.log('🌐 Getting all multi-chain processes');
    
    try {
      const response = await api.get('/api/warmup');
      console.log('✅ Multi-chain processes retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting multi-chain processes:', error);
      throw error;
    }
  }

  // Start multi-chain process
  static async startMultiChainProcess(id: string): Promise<MultiChainProcess> {
    console.log('🌐 Starting multi-chain process:', id);
    
    try {
      const response = await api.post(`/api/warmup/${id}/start`);
      console.log('✅ Multi-chain process started:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error starting multi-chain process:', error);
      throw error;
    }
  }

  // Stop multi-chain process
  static async stopMultiChainProcess(id: string): Promise<MultiChainProcess> {
    console.log('🌐 Stopping multi-chain process:', id);
    
    try {
      const response = await api.post(`/api/warmup/${id}/stop`);
      console.log('✅ Multi-chain process stopped:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error stopping multi-chain process:', error);
      throw error;
    }
  }

  // Get wallets by chain - using the correct endpoint from backend guide
  static async getWalletsByChain(chainId: ChainId): Promise<IWarmUpWallet[]> {
    console.log('🌐 Getting wallets by chain:', chainId);
    
    try {
      const response = await api.get(`/api/wallets?chainId=${chainId}`);
      console.log('✅ Wallets by chain retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting wallets by chain:', error);
      throw error;
    }
  }

  // Get available wallets with optional chain filter
  static async getAvailableWallets(chainId?: ChainId): Promise<IWarmUpWallet[]> {
    console.log('🌐 Getting available wallets:', chainId ? `for chain ${chainId}` : 'all chains');
    
    try {
      const params = chainId ? `?chainId=${chainId}` : '';
      const response = await api.get(`/api/wallets/available${params}`);
      console.log('✅ Available wallets retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting available wallets:', error);
      throw error;
    }
  }


  // Validate chain support
  static isChainSupported(chainId: number): boolean {
    return Object.values(ChainId).includes(chainId as ChainId);
  }

  // Get chain name by ID
  static getChainName(chainId: ChainId): string {
    return MultiChainService.CHAIN_CONFIGS[chainId]?.name || 'Unknown Chain';
  }

  // Format balance for display
  static formatBalance(balance: string, decimals: number): string {
    const num = parseFloat(balance) / Math.pow(10, decimals);
    return num.toFixed(6);
  }

  // Validate address format for specific chain
  static validateAddress(address: string, chainId: ChainId): boolean {
    if (!address) return false;
    
    const isEVM = [ChainId.BASE].includes(chainId);
    const isSolana = [ChainId.SOLANA, ChainId.SOLANA_DEVNET, ChainId.SOLANA_TESTNET].includes(chainId);
    
    if (isEVM) {
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    } else if (isSolana) {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    }
    
    return true;
  }

  // Get explorer URL for address
  static getExplorerUrl(chainId: ChainId, address: string, isTransaction: boolean = false): string | null {
    const config = MultiChainService.CHAIN_CONFIGS[chainId];
    if (!config) return null;
    
    const baseUrl = config.explorerUrl;
    const suffix = isTransaction ? '/tx/' : '/address/';
    
    return `${baseUrl}${suffix}${address}`;
  }
}
