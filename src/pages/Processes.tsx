import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { WarmupProcessModal } from '../components/WarmupProcessModal';
import { ProcessDashboard } from '../components/ProcessDashboard';
import { ProgressDashboard } from '../components/ProgressDashboard';
import { useWarmupProcesses, useStartWarmupProcess, useStopWarmupProcess, useDeleteWarmupProcess } from '../hooks/useWarmupProcesses';
import { WarmupService } from '../services/warmupService';
import { formatDate, formatNumber } from '../utils/formatters';
import { 
  Plus, 
  Play, 
  Square, 
  Trash2, 
  Activity,
  Clock,
  Users,
  TrendingUp,
  Eye,
  ArrowLeft,
  BarChart3
} from 'lucide-react';

export const Processes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProcessId = searchParams.get('process');
  
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    tag: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [activeJobs, setActiveJobs] = useState<string[]>([]);

  const { data: processes, isLoading, error } = useWarmupProcesses();
  const startProcessMutation = useStartWarmupProcess();
  const stopProcessMutation = useStopWarmupProcess();
  const deleteProcessMutation = useDeleteWarmupProcess();

  // Ensure processes is an array and handle errors
  const processesArray = Array.isArray(processes) ? processes : [];
  
  // Get unique tags for filter dropdown
  const uniqueTags = Array.from(
    new Set(
      processesArray
        .filter(process => process.tags && process.tags.length > 0)
        .flatMap(process => process.tags!)
    )
  ).sort();
  
  const filteredProcesses = processesArray.filter(process => {
    if (filters.status && process.status !== filters.status) return false;
    if (filters.search && !process.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.tag) {
      if (filters.tag === 'no-tag') {
        if (process.tags && process.tags.length > 0) return false;
      } else {
        if (!process.tags || !process.tags.includes(filters.tag)) return false;
      }
    }
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

  const handleViewProcess = (processId: string) => {
    setSearchParams({ process: processId });
  };

  const handleBackToList = () => {
    setSearchParams({});
  };

  const handleCreateSuccess = (process: any) => {
    setShowCreateModal(false);
    // Optionally navigate to the new process
    setSearchParams({ process: process._id });
  };

  const handleTestBackend = async () => {
    try {
      const result = await WarmupService.testBackendConnectivity();
      if (result.available) {
        toast.success('Backend connectivity test passed!');
      } else {
        toast.error(`Backend test failed: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Backend test error: ${error.message}`);
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

  // Show process dashboard if a process is selected
  if (selectedProcessId) {
    return (
      <ProcessDashboard 
        processId={selectedProcessId} 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Process Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage warmup processes and monitor real-time operations</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={showProgressDashboard ? 'primary' : 'secondary'} 
            size="md"
            onClick={() => setShowProgressDashboard(!showProgressDashboard)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Progress Dashboard
          </Button>
          <Button 
            variant="secondary" 
            size="md"
            onClick={handleTestBackend}
          >
            Test Backend
          </Button>
          <Button 
            variant="primary" 
            size="md"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Process
          </Button>
        </div>
      </div>

      {/* Progress Dashboard */}
      {showProgressDashboard && (
        <ProgressDashboard 
          activeJobIds={activeJobs} 
          onJobComplete={(jobId, result) => {
            setActiveJobs(prev => prev.filter(id => id !== jobId));
            if (import.meta.env.DEV) {
              console.log('Process job completed:', result);
            }
          }} 
        />
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag</label>
            <select
              className="input"
              value={filters.tag}
              onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
            >
              <option value="">All Tags</option>
              <option value="no-tag">No Tag</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
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
                <th>Tags</th>
                <th>Wallets</th>
                <th>Created</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.map((process) => (
                <tr key={process._id}>
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
                    <div className="flex flex-wrap gap-1">
                      {process.tags && process.tags.length > 0 ? (
                        process.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No tags</span>
                      )}
                    </div>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewProcess(process._id)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      
                      {(process.status === 'pending' || process.status === 'stopped' || process.status === 'completed' || process.status === 'failed') && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStartProcess(process._id)}
                          loading={startProcessMutation.isPending}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {(process.status === 'running' || process.status === 'in_progress') && (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleStopProcess(process._id)}
                          loading={stopProcessMutation.isPending}
                        >
                          <Square className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteProcess(process._id)}
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



      {/* Create Process Modal */}
      <WarmupProcessModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
