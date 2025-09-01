import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

import { 
  TrendingUp, 
  BarChart3,
  Target,
  Shield
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'analytics'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">System overview and analytics for the Advanced Warmup System</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={activeView === 'overview' ? 'primary' : 'secondary'} 
            size="sm"
            onClick={() => setActiveView('overview')}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Overview
          </Button>
          <Button 
            variant={activeView === 'analytics' ? 'primary' : 'secondary'} 
            size="sm"
            onClick={() => setActiveView('analytics')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <Card>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Welcome to the Advanced Warmup System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Strategic Generation</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create wallets with intelligent distribution</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Stealth Funding</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enhanced privacy with WSOL transfers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Progress Tracking</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time monitoring of operations</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Analytics */}
      {activeView === 'analytics' && (
        <AnalyticsDashboard />
      )}




    </div>
  );
};
