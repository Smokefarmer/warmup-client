import React, { useState } from 'react';
import { WarmupService } from '../services/warmupService';
import { toast } from 'react-hot-toast';

export const ApiDebugger: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const testBackendConnectivity = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await WarmupService.testBackendConnectivity();
      setTestResult(result);
      
      if (result.available) {
        toast.success('Backend connectivity test passed!');
      } else {
        toast.error(`Backend connectivity test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ available: false, error: error.message });
      toast.error('Test failed with error');
    } finally {
      setIsTesting(false);
    }
  };

  const testCreateProcess = async () => {
    setIsTesting(true);
    
    try {
      // First get available wallets
      const walletsResponse = await fetch('/api/wallets/available');
      const wallets = await walletsResponse.json();
      
      if (!wallets || wallets.length === 0) {
        toast.error('No wallets available for testing');
        return;
      }
      
      const testData = {
        name: 'Debug Test Process',
        walletIds: [wallets[0]._id],
        configuration: {
          maxConcurrentWallets: 1
        }
      };
      
      console.log('🔍 Testing with data:', testData);
      
      const result = await WarmupService.createWarmupProcess(testData);
      setTestResult({ success: true, process: result });
      toast.success('Process created successfully!');
      
    } catch (error: any) {
      console.error('Create process test failed:', error);
      setTestResult({ 
        success: false, 
        error: error.response?.data || error.message 
      });
      toast.error('Create process test failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          API Debugger
        </h2>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={testBackendConnectivity}
              disabled={isTesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? 'Testing...' : 'Test Backend Connectivity'}
            </button>
            
            <button
              onClick={testCreateProcess}
              disabled={isTesting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? 'Testing...' : 'Test Create Process'}
            </button>
          </div>
          
          {testResult && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Test Result
              </h3>
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
