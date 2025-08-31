import api from './api';

// WSOL Stealth Funding types
export interface WsolStealthFundingConfig {
  masterWalletId: string;
  amountPerChild: string; // SOL amount
  childWallets?: string[]; // If not provided, funds all children of master
}

// Advanced Funding Plan types
export interface AdvancedFundingPlan {
  planName: string;
  description?: string;
  totalBudget: string; // SOL amount
  walletCount: number;
  strategy: {
    cexFundingPercentage: number;
    internalFundingPercentage: number;
    useStealthTransfers: boolean;
    minAmountPerWallet: string;
    maxAmountPerWallet: string;
  };
}

export interface FundingPlanExecution {
  planId: string;
  walletIds: string[];
}

export class StrategicFundingService {
  // WSOL Stealth Funding (Clean Funds)
  static async executeStealthFunding(config: WsolStealthFundingConfig): Promise<{ jobId: string }> {
    try {
      const response = await api.post('/api/funding/wsol-stealth', config);
      return response.data;
    } catch (error) {
      console.error('Error executing stealth funding:', error);
      throw error;
    }
  }

  // Create Advanced Funding Plan
  static async createFundingPlan(plan: AdvancedFundingPlan): Promise<{ planId: string }> {
    try {
      const response = await api.post('/api/funding/plans', plan);
      return response.data;
    } catch (error) {
      console.error('Error creating funding plan:', error);
      throw error;
    }
  }

  // Execute Funding Plan
  static async executeFundingPlan(execution: FundingPlanExecution): Promise<{ jobId: string }> {
    try {
      const response = await api.post('/api/funding/plans/execute', execution);
      return response.data;
    } catch (error) {
      console.error('Error executing funding plan:', error);
      throw error;
    }
  }

  // Get all funding plans
  static async getFundingPlans(): Promise<AdvancedFundingPlan[]> {
    try {
      const response = await api.get('/api/funding/plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching funding plans:', error);
      throw error;
    }
  }

  // Get funding plan by ID
  static async getFundingPlan(planId: string): Promise<AdvancedFundingPlan> {
    try {
      const response = await api.get(`/api/funding/plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching funding plan:', error);
      throw error;
    }
  }

  // Delete funding plan
  static async deleteFundingPlan(planId: string): Promise<void> {
    try {
      await api.delete(`/api/funding/plans/${planId}`);
    } catch (error) {
      console.error('Error deleting funding plan:', error);
      throw error;
    }
  }

  // Get master wallets with their children
  static async getMasterWallets(): Promise<Array<{
    id: string;
    address: string;
    childrenCount: number;
    children: Array<{ id: string; address: string; balance: string }>;
  }>> {
    try {
      const response = await api.get('/api/wallets/master-hierarchy');
      return response.data;
    } catch (error) {
      console.error('Error fetching master wallets:', error);
      throw error;
    }
  }
}
