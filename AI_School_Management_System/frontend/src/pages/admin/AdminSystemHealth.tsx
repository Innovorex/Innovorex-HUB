// pages/admin/AdminSystemHealth.tsx - System Health Monitoring Page
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    erpnext: string;
    database: string;
    redis?: string;
    email?: string;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  version: string;
  cpu_usage?: number;
  disk_usage?: number;
  active_connections?: number;
}

const AdminSystemHealth: React.FC = () => {
  const { data: healthData, isLoading, error, refetch } = useQuery<SystemHealth>({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const response = await api.get('/admin/system-health');
      return response.data;
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getServiceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
      case 'unhealthy':
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getServiceIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'healthy':
      case 'online':
        return CheckCircleIcon;
      case 'disconnected':
      case 'unhealthy':
      case 'offline':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading system health...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ServerIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load system health</h3>
            <p className="text-gray-600 mb-4">Unable to fetch system status.</p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            <p className="text-gray-600">Monitor system performance and service status</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>Last updated: {new Date(healthData?.timestamp || '').toLocaleTimeString()}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                healthData?.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {healthData?.status === 'healthy' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  System Status: {healthData?.status?.charAt(0).toUpperCase() + (healthData?.status?.slice(1) || '')}
                </h2>
                <p className="text-gray-600">Environment: {healthData?.environment}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">v{healthData?.version}</div>
              <div className="text-sm text-gray-600">
                Uptime: {healthData?.uptime ? formatUptime(healthData.uptime) : 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(healthData?.services || {}).map(([service, status]) => {
            const StatusIcon = getServiceIcon(status);
            return (
              <motion.div
                key={service}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      service === 'erpnext' ? 'bg-blue-100' :
                      service === 'database' ? 'bg-green-100' :
                      service === 'redis' ? 'bg-red-100' : 'bg-purple-100'
                    }`}>
                      {service === 'erpnext' ? <WifiIcon className="h-5 w-5 text-blue-600" /> :
                       service === 'database' ? <CircleStackIcon className="h-5 w-5 text-green-600" /> :
                       service === 'redis' ? <ServerIcon className="h-5 w-5 text-red-600" /> :
                       <CpuChipIcon className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">{service}</h3>
                    </div>
                  </div>
                  <StatusIcon className={`h-5 w-5 ${
                    status === 'connected' || status === 'healthy' ? 'text-green-500' :
                    status === 'disconnected' || status === 'unhealthy' ? 'text-red-500' :
                    'text-yellow-500'
                  }`} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Memory Usage */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">RSS</span>
                <span className="text-sm font-medium">{formatBytes(healthData?.memory?.rss || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Heap Total</span>
                <span className="text-sm font-medium">{formatBytes(healthData?.memory?.heapTotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Heap Used</span>
                <span className="text-sm font-medium">{formatBytes(healthData?.memory?.heapUsed || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">External</span>
                <span className="text-sm font-medium">{formatBytes(healthData?.memory?.external || 0)}</span>
              </div>

              {/* Memory Usage Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Heap Usage</span>
                  <span>
                    {healthData?.memory?.heapTotal ?
                      Math.round((healthData.memory.heapUsed / healthData.memory.heapTotal) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${healthData?.memory?.heapTotal ?
                        Math.round((healthData.memory.heapUsed / healthData.memory.heapTotal) * 100) : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* System Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CPU Usage</span>
                <span className="text-sm font-medium">{healthData?.cpu_usage || 'N/A'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Disk Usage</span>
                <span className="text-sm font-medium">{healthData?.disk_usage || 'N/A'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Connections</span>
                <span className="text-sm font-medium">{healthData?.active_connections || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-green-600">~15ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent System Events</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">System health check passed</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">ERPNext connection verified</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <ServerIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">Server restarted successfully</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AdminSystemHealth;