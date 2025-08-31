import React, { useState, useEffect } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { WalletService, JobStatus } from '../services/walletService';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';

interface ProgressDashboardProps {
  activeJobIds?: string[];
  onJobComplete?: (jobId: string, result: any) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  activeJobIds = [],
  onJobComplete
}) => {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // Polling interval for job updates
  useEffect(() => {
    loadJobs();
    
    const interval = setInterval(() => {
      loadJobs();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [activeJobIds]);

  const loadJobs = async () => {
    try {
      const allJobs = await WalletService.getAllJobs();
      setJobs(allJobs);
      
      // Check for completed jobs
      allJobs.forEach(job => {
        if ((job.status === 'completed' || job.status === 'failed') && 
            activeJobIds.includes(job.id)) {
          onJobComplete?.(job.id, job.result);
        }
      });
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString();
    } catch {
      return timeString;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }
  };

  const getStatusIcon = (status: JobStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: JobStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Activity className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            📊 Operations Dashboard
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadJobs}
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No operations running</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Start a wallet generation or funding operation to see progress here
            </p>
          </div>
        </Card>
      ) : (
        jobs.map(job => (
          <Card key={job.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start space-x-3">
                {getStatusIcon(job.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {job.progress.message}
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {job.type} • Started {formatTime(job.startedAt)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status.replace('_', ' ').toUpperCase()}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleJobExpansion(job.id)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            {job.status === 'in_progress' && (
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    {job.progress.current} / {job.progress.total}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {job.progress.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${job.progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Estimated Completion */}
            {job.estimatedCompletionTime && job.status === 'in_progress' && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Clock className="w-4 h-4 inline mr-1" />
                ETA: {formatTime(job.estimatedCompletionTime)}
              </div>
            )}
            
            {/* Results (if completed) */}
            {job.status === 'completed' && job.result && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center text-green-800 dark:text-green-300">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="font-medium">
                    ✅ Completed in {job.executionTime ? formatDuration(job.executionTime) : 'N/A'}
                  </span>
                </div>
                {job.result.walletsCreated && (
                  <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Created {job.result.walletsCreated} wallets
                  </div>
                )}
                {job.result.totalAmount && (
                  <div className="text-sm text-green-700 dark:text-green-400">
                    Total amount: {job.result.totalAmount} SOL
                  </div>
                )}
              </div>
            )}
            
            {/* Error (if failed) */}
            {job.status === 'failed' && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center text-red-800 dark:text-red-300">
                  <XCircle className="w-4 h-4 mr-2" />
                  <span className="font-medium">❌ Operation Failed</span>
                </div>
                {job.result?.error && (
                  <div className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {job.result.error}
                  </div>
                )}
              </div>
            )}
            
            {/* Expanded Details */}
            {expandedJobs.has(job.id) && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Job Details
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div><strong>ID:</strong> {job.id}</div>
                  <div><strong>Type:</strong> {job.type}</div>
                  <div><strong>Started:</strong> {formatTime(job.startedAt)}</div>
                  {job.executionTime && (
                    <div><strong>Execution Time:</strong> {formatDuration(job.executionTime)}</div>
                  )}
                  {job.result && (
                    <div className="mt-2">
                      <strong>Result:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                        {JSON.stringify(job.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
};
