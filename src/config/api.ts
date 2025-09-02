// API configuration matching the backend guide
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://warmup-server-development.up.railway.app';

export const headers = {
  'Content-Type': 'application/json',
  // Add authentication headers if needed
  // 'Authorization': 'Bearer your-token'
};

export { API_BASE_URL };

// API endpoints matching the backend guide
export const API_ENDPOINTS = {
  // Chain management
  CHAINS: '/api/chains',
  CHAINS_ENABLED: '/api/chains/enabled',
  CHAIN_INFO: (chainId: number) => `/api/chains/${chainId}`,
  CHAIN_BALANCE: (chainId: number, address: string) => `/api/chains/${chainId}/balance/${address}`,
  CHAIN_TRANSACTION: (chainId: number, txHash: string) => `/api/chains/${chainId}/transaction/${txHash}`,
  
  // Wallet management
  WALLETS: '/api/wallets',
  WALLETS_BATCH: '/api/wallets/batch',
  WALLETS_AVAILABLE: '/api/wallets/available',
  WALLET_BY_ID: (id: string) => `/api/wallets/${id}`,
  WALLET_STATUS: (id: string) => `/api/wallets/${id}/status`,
  WALLET_TYPE: (id: string) => `/api/wallets/${id}/type`,
  
  // Warmup processes
  WARMUP: '/api/warmup',
  WARMUP_BY_ID: (id: string) => `/api/warmup/${id}`,
  WARMUP_START: (id: string) => `/api/warmup/${id}/start`,
  WARMUP_STOP: (id: string) => `/api/warmup/${id}/stop`,
  WARMUP_WALLETS: (id: string) => `/api/warmup/${id}/wallets`,
  WARMUP_STATISTICS: (id: string) => `/api/warmup/${id}/statistics`,
  WARMUP_TRANSACTIONS: (id: string) => `/api/warmup/${id}/transactions`,
  WARMUP_GLOBAL_STATISTICS: '/api/warmup/statistics',
  
  // Balance management
  BALANCE_SUMMARY: '/api/balance/summary',
  BALANCE_TOTAL_FUNDED_WALLET: (walletId: string) => `/api/balance/total-funded/wallet/${walletId}`,
  BALANCE_TOTAL_FUNDED_WALLETS: '/api/balance/total-funded/wallets',
  BALANCE_FORCE_UPDATE_ALL: '/api/balance/force-update-all',
  
  // Statistics
  STATISTICS_MULTI_CHAIN: '/api/statistics/multi-chain',
  WALLETS_STATISTICS: '/api/wallets/statistics',
  
  // Monitoring Dashboard
  MONITOR_HEALTH: '/api/monitor/health',
  MONITOR_PROCESSES_QUICK: '/api/monitor/processes/quick',
  WARMUP_QUEUE: (processId: string) => `/api/warmup/${processId}/queue`,
  WARMUP_QUEUE_LIVE: (processId: string) => `/api/warmup/${processId}/queue/live`,
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to make API requests with proper error handling
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const url = buildApiUrl(endpoint);
  
  const config: RequestInit = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Helper function for GET requests
export const apiGet = (endpoint: string): Promise<any> => {
  return apiRequest(endpoint, { method: 'GET' });
};

// Helper function for POST requests
export const apiPost = (endpoint: string, data?: any): Promise<any> => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// Helper function for PUT requests
export const apiPut = (endpoint: string, data?: any): Promise<any> => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// Helper function for DELETE requests
export const apiDelete = (endpoint: string): Promise<any> => {
  return apiRequest(endpoint, { method: 'DELETE' });
};
