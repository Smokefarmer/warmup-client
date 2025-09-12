export interface ProtectedToken {
  _id?: string;
  tokenAddress: string;
  reason: string;
  symbol?: string;
  name?: string;
  addedAt?: string;
  addedBy?: string;
  createdAt?: string; // Keep for backward compatibility
  updatedAt?: string;
}

export interface CreateProtectedTokenDto {
  tokenAddress: string;
  reason: string;
  symbol?: string;
  name?: string;
}

export interface BulkCreateProtectedTokensDto {
  tokens: CreateProtectedTokenDto[];
}

export interface ProtectedTokenCheckResponse {
  isProtected: boolean;
  token?: ProtectedToken;
}

export interface ProtectedTokenStatistics {
  totalProtected: number;
  activeProtected: number;
  recentlyAdded: number;
  cacheSize: number;
  lastCacheUpdate: string;
  status?: string;
  uptime?: string;
  lastChecked?: string;
}
