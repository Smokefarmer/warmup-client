import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ProtectedTokenService } from '../services/protectedTokenService';
import { CreateProtectedTokenDto, BulkCreateProtectedTokensDto } from '../types/protectedToken';

// Get all protected tokens
export const useProtectedTokens = () => {
  return useQuery({
    queryKey: ['protected-tokens'],
    queryFn: () => ProtectedTokenService.getProtectedTokens(),
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute
  });
};

// Get protected token statistics
export const useProtectedTokenStatistics = () => {
  return useQuery({
    queryKey: ['protected-token-statistics'],
    queryFn: () => ProtectedTokenService.getProtectedTokenStatistics(),
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

// Check if a token is protected
export const useCheckTokenProtection = (tokenAddress: string, enabled = true) => {
  return useQuery({
    queryKey: ['token-protection-check', tokenAddress],
    queryFn: () => ProtectedTokenService.checkTokenProtection(tokenAddress),
    enabled: enabled && !!tokenAddress,
    staleTime: 30000,
  });
};

// Create a single protected token
export const useCreateProtectedToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (token: CreateProtectedTokenDto) => 
      ProtectedTokenService.createProtectedToken(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protected-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['protected-token-statistics'] });
      toast.success('Protected token added successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to add protected token';
      toast.error(`Failed to add protected token: ${message}`);
    },
  });
};

// Create multiple protected tokens
export const useCreateBulkProtectedTokens = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkCreateProtectedTokensDto) => 
      ProtectedTokenService.createBulkProtectedTokens(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['protected-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['protected-token-statistics'] });
      toast.success(`${data.length} protected tokens added successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to add protected tokens';
      toast.error(`Failed to add protected tokens: ${message}`);
    },
  });
};

// Remove a protected token
export const useRemoveProtectedToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tokenAddress: string) => 
      ProtectedTokenService.removeProtectedToken(tokenAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protected-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['protected-token-statistics'] });
      toast.success('Token protection removed successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to remove token protection';
      toast.error(`Failed to remove protection: ${message}`);
    },
  });
};
