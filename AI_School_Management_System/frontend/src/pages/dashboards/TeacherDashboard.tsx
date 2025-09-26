// pages/dashboards/TeacherDashboard.tsx - ERPNext-style Teacher Executive Dashboard
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpenIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowPathIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PresentationChartLineIcon,
  DocumentTextIcon,
  BellIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['teacher-dashboard', user?.id],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        classes: { total: 5, active: 4 },
        students: { total: 120, present: 108 },
        assignments: { pending: 8, graded: 45 },
        performance: { average_grade: 8.2, improvement: 12.5 }
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
    <div className="min-h-screen bg-gray-100">
      {/* ERPNext-style Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white z-50">
        {/* Logo Section */}
        <div className="flex items-center h-16 px-4 border-b border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <div>
              <div className="text-sm font-medium">Innovorex</div>
              <div className="text-xs text-blue-300">Teacher Portal</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <div className="bg-blue-700 rounded-lg px-3 py-2 flex items-center text-white">
              <ChartBarIcon className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">Dashboard</span>
            </div>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <UserGroupIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">My Classes</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Assignments</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <AcademicCapIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Gradebook</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <CalendarIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Schedule</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <DocumentTextIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Curriculum</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Messages</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <PresentationChartLineIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Analytics</span>
            </a>
          </div>
        </nav>

        {/* User Profile at Bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-blue-700 rounded-lg p-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-white">{user?.name}</div>
                <div className="text-xs text-blue-300">Teacher</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* ERPNext-style Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold">Teacher Command Center</h1>
                <div className="flex items-center bg-green-500 px-2 py-1 rounded-full text-xs">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  Live Data
                </div>
              </div>
              <p className="text-blue-100 mt-1">Comprehensive class management and student oversight</p>
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

        {/* KPI Cards Row */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Class Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <AcademicCapIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Class Average vs Target</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 8.5%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">8.2</div>
              <div className="text-sm text-gray-500">8.5 target (96%)</div>
            </motion.div>

            {/* Active Students */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Today's Attendance</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 5.2%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.students?.present}</div>
              <div className="text-sm text-gray-500">{dashboardData?.students?.total} total students (90%)</div>
            </motion.div>

            {/* Pending Grading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Pending Grading</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-500 text-sm flex items-center">
                    ↑ 15.0%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.assignments?.pending}</div>
              <div className="text-sm text-gray-500">5 due tomorrow</div>
            </motion.div>

            {/* Parent Communications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Parent Messages</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-500 text-sm flex items-center">
                    ↑ 25.0%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">4</div>
              <div className="text-sm text-gray-500">2 urgent responses needed</div>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Class Performance Health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Class Performance Health</h3>
                </div>
                <div className="text-sm text-gray-500">Updated 11:45 AM</div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-green-600">+85%</div>
                    <div className="text-sm text-gray-600">Passing Rate</div>
                    <div className="text-xs text-green-600">5% improvement</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">12</div>
                    <div className="text-sm text-gray-600">At-Risk Students</div>
                    <div className="text-xs text-orange-600">Need intervention</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">92%</div>
                    <div className="text-sm text-gray-600">Assignment Completion</div>
                    <div className="text-xs text-blue-600">Above average</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Teaching Activity Chain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Today's Teaching Schedule</h3>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">On Track</span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-green-900">Mathematics - Grade 10A</div>
                        <div className="text-sm text-green-700">Algebra Fundamentals - Room 201</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-700 font-medium">COMPLETED</div>
                      <div className="text-sm text-green-600">8:00 - 9:00 AM</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-blue-900">Physics - Grade 11B</div>
                        <div className="text-sm text-blue-700">Lab: Newton's Laws - Lab Room 3</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-700 font-medium">IN PROGRESS</div>
                      <div className="text-sm text-blue-600">10:00 - 11:30 AM</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Mathematics - Grade 9C</div>
                        <div className="text-sm text-gray-700">Geometry Introduction - Room 201</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-700 font-medium">UPCOMING</div>
                      <div className="text-sm text-gray-600">2:00 - 3:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Teaching Issues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
                </div>
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </a>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">Student attendance dropping in Grade 10A</div>
                        <div className="text-sm text-gray-600">Mathematics • 15/09/2025</div>
                      </div>
                    </div>
                    <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">high</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">Parent meeting request pending</div>
                        <div className="text-sm text-gray-600">Sarah Johnson's mother • 14/09/2025</div>
                      </div>
                    </div>
                    <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">medium</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">Lab equipment maintenance needed</div>
                        <div className="text-sm text-gray-600">Physics Lab Room 3 • 13/09/2025</div>
                      </div>
                    </div>
                    <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">low</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Class Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Class Statistics</h3>
                </div>
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">Performing Well</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{dashboardData?.classes?.active}</div>
                    <div className="text-sm text-gray-600">Active Classes</div>
                    <div className="text-xs text-green-600">All scheduled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">45</div>
                    <div className="text-sm text-gray-600">Graded This Week</div>
                    <div className="text-xs text-blue-600">On schedule</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;