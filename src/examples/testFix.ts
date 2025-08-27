/**
 * Test to verify the API fix works correctly
 */

import { WarmupService } from '../services/warmupService';

export const testApiFix = async () => {
  try {
    console.log('🧪 Testing API fix...');
    
    // Test 1: Basic connectivity
    const connectivityResult = await WarmupService.testBackendConnectivity();
    console.log('Connectivity test result:', connectivityResult);
    
    if (!connectivityResult.available) {
      console.error('❌ Backend not available:', connectivityResult.error);
      return;
    }
    
    // Test 2: Create a simple process
    const testData = {
      name: 'Test Process - API Fix',
      description: 'Testing the API fix',
      walletIds: ['test-wallet-id'], // This will fail but we can see the request format
      configuration: {
        maxConcurrentWallets: 1
      }
    };
    
    console.log('🧪 Testing with data:', testData);
    
    try {
      const result = await WarmupService.createWarmupProcess(testData);
      console.log('✅ Process created successfully:', result);
    } catch (error: any) {
      // This is expected to fail due to invalid wallet ID, but we can see if the format is correct
      console.log('📋 Request format test completed. Error (expected):', error.response?.data);
      
      // Check if the error is about wallet ID (good) vs configuration format (bad)
      if (error.response?.data?.message?.includes('wallet') || 
          error.response?.data?.message?.includes('not found')) {
        console.log('✅ Request format is correct - error is about wallet ID, not configuration');
      } else if (error.response?.data?.message?.includes('description') ||
                 error.response?.data?.message?.includes('property')) {
        console.error('❌ Request format is still incorrect');
      } else {
        console.log('📋 Unknown error, but request format might be correct');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testApiFix = testApiFix;
}
