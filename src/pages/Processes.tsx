import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { useWarmupProcesses, useStartWarmupProcess, useStopWarmupProcess, useDeleteWarmupProcess } from '../hooks/useWarmupProcesses';
import { formatDate, formatNumber } from '../utils/formatters';
import { 
  Plus, 
  Play, 
  Square, 
  Trash2, 
  Activity,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

export const Processes: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  const { data: processes, isLoading, error } = useWarmupProcesses();
  const startProcessMutation = useStartWarmupProcess();
  const stopProcessMutation = useStopWarmupProcess();
  const deleteProcessMutation = useDeleteWarmupProcess();

  // Ensure processes is an array and handle errors
  const processesArray = Array.isArray(processes) ? processes : [];
  
  const filteredProcesses = processesArray.filter(process => {
    if (filters.status && process.status !== filters.status) return false;
    if (filters.search && !process.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleStartProcess = (id: string) => {
    startProcessMutation.mutate(id);
  };

  const handleStopProcess = (id: string) => {
    stopProcessMutation.mutate(id);
  };

  const handleDeleteProcess = (id: string) => {
    if (window.confirm('Are you sure you want to delete this process?')) {
      deleteProcessMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error Loading Processes</div>
          <div className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || 'Failed to load process data. Please check your API connection.'}
          </div>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Warmup Processes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your wallet warmup processes</p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="w-4 h-4 mr-2" />
          Create Process
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by process name..."
              className="input"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Processes Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Wallets</th>
                <th>Created</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.map((process) => (
                <tr key={process.id}>
                  <td>
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{process.name}</p>
                        {process.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{process.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={process.status} />
                  </td>
                  <td>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {process.walletIds?.length || 0}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(process.createdAt)}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {process.startedAt ? formatDate(process.startedAt) : 'Not started'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      {process.status === 'pending' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStartProcess(process.id)}
                          loading={startProcessMutation.isPending}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {process.status === 'running' && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleStopProcess(process.id)}
                          loading={stopProcessMutation.isPending}
                        >
                          <Square className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteProcess(process.id)}
                        loading={deleteProcessMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProcesses.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No processes found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredProcesses.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Processes</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">
              {filteredProcesses.filter(p => p.status === 'running').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Running</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning-600">
              {filteredProcesses.filter(p => p.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-success-600">
              {filteredProcesses.filter(p => p.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
