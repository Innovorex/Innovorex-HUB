// pages/dashboards/AdminDashboard.tsx - ERPNext-style Admin Executive Dashboard
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ArrowPathIcon,
  CpuChipIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';


const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard', user?.id],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        total_users: 1247,
        total_students: 896,
        total_teachers: 47,
        total_parents: 651,
        active_alerts: 2,
        memory_usage: 67,
        cpu_usage: 23,
        storage_usage: 84,
        server_uptime: "99.9%"
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* ERPNext-style Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold">System Command Center</h1>
                <div className="flex items-center bg-green-500 px-2 py-1 rounded-full text-xs">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  All Systems Operational
                </div>
              </div>
              <p className="text-blue-100 mt-1">Comprehensive monitoring and management of Innovorex AI School Platform</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              className="flex items-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="px-6">
          {/* Main KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 12.5%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.total_users}</div>
              <div className="text-sm text-gray-500">All platform users</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Active Students</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 8.2%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.total_students}</div>
              <div className="text-sm text-gray-500">Currently enrolled</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Teaching Staff</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 5.1%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.total_teachers}</div>
              <div className="text-sm text-gray-500">Active instructors</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ShieldCheckIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Active Alerts</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-500 text-sm flex items-center">
                    ↓ 40.0%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.active_alerts}</div>
              <div className="text-sm text-gray-500">1 requires attention</div>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* System Performance Health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <ComputerDesktopIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">System Performance Monitoring</h3>
                </div>
                <div className="text-sm text-gray-500">Real-time metrics</div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{dashboardData?.memory_usage}%</div>
                    <div className="text-sm text-gray-600">Memory Usage</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${dashboardData?.memory_usage}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{dashboardData?.cpu_usage}%</div>
                    <div className="text-sm text-gray-600">CPU Usage</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${dashboardData?.cpu_usage}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{dashboardData?.storage_usage}%</div>
                    <div className="text-sm text-gray-600">Storage Usage</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${dashboardData?.storage_usage}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* User Management Activity Chain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">User Management Activity</h3>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">All Current</span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-green-900">New Teacher Registration</div>
                        <div className="text-sm text-green-700">Dr. Sarah Wilson - Mathematics Dept.</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-700 font-medium">APPROVED</div>
                      <div className="text-sm text-green-600">2 hours ago</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-blue-900">Bulk Student Import</div>
                        <div className="text-sm text-blue-700">Processing 45 new student records</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-700 font-medium">IN PROGRESS</div>
                      <div className="text-sm text-blue-600">85% complete</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <UsersIcon className="h-5 w-5 text-gray-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Parent Access Review</div>
                        <div className="text-sm text-gray-700">Quarterly security audit scheduled</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-700 font-medium">SCHEDULED</div>
                      <div className="text-sm text-gray-600">Sept 20, 10:00 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* System Alerts & Issues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <BellIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">System Alerts & Issues</h3>
                </div>
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </a>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">Database backup running slower than usual</div>
                        <div className="text-sm text-gray-600">System Maintenance • 2 hours ago</div>
                      </div>
                    </div>
                    <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">medium</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">Multiple failed login attempts detected</div>
                        <div className="text-sm text-gray-600">Security Alert • 1 hour ago</div>
                      </div>
                    </div>
                    <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">high</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">All scheduled maintenance completed</div>
                        <div className="text-sm text-gray-600">System Update • 6 hours ago</div>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">resolved</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Platform Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <PresentationChartLineIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Platform Analytics</h3>
                </div>
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">Trending Up</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{dashboardData?.server_uptime}</div>
                    <div className="text-sm text-gray-600">Server Uptime</div>
                    <div className="text-xs text-green-600">Last 30 days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">1.2M</div>
                    <div className="text-sm text-gray-600">Total Interactions</div>
                    <div className="text-xs text-blue-600">This month</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-lg font-bold text-blue-600">{dashboardData?.total_students}</div>
                    <div className="text-xs text-gray-600">Active Students</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded border border-purple-200">
                    <div className="text-lg font-bold text-purple-600">{dashboardData?.total_teachers}</div>
                    <div className="text-xs text-gray-600">Teaching Staff</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="text-lg font-bold text-green-600">{dashboardData?.total_parents}</div>
                    <div className="text-xs text-gray-600">Parent Accounts</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};


export default AdminDashboard;