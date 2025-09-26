// pages/dashboards/ParentDashboard.tsx - ERPNext-style Parent Executive Dashboard
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowPathIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrophyIcon,
  BookOpenIcon,
  BellIcon,
  InboxIcon,
  HomeIcon,
  PhoneIcon,
  VideoCameraIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';


const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState('emma');

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['parent-dashboard', user?.id],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        children: [
          { id: 'emma', name: 'Emma', class: 'Grade 8A', gpa: 8.7, attendance: 95 },
          { id: 'alex', name: 'Alex', class: 'Grade 6B', gpa: 7.9, attendance: 92 }
        ],
        meetings_scheduled: 3,
        urgent_messages: 2,
        upcoming_events: 5,
        overall_performance: 'excellent'
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
              <div className="text-xs text-blue-300">Parent Portal</div>
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
              <span className="text-sm">My Children</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <DocumentTextIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Progress Reports</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <CalendarIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Events & Schedule</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Teacher Messages</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <PhoneIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Parent Meetings</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <TrophyIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Achievements</span>
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
                <div className="text-xs text-blue-300">Parent</div>
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
                <h1 className="text-2xl font-bold">Family Learning Command Center</h1>
                <div className="flex items-center bg-green-500 px-2 py-1 rounded-full text-xs">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  Live Updates
                </div>
              </div>
              <p className="text-blue-100 mt-1">Comprehensive monitoring of your children's academic journey</p>
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
            {/* Children Performance */}
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
                    <div className="text-sm text-gray-600">Overall Performance</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 12.3%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">8.3</div>
              <div className="text-sm text-gray-500">Average GPA (Excellent)</div>
            </motion.div>

            {/* Attendance Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 3.2%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">93.5%</div>
              <div className="text-sm text-gray-500">Above school average</div>
            </motion.div>

            {/* Parent Meetings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <PhoneIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Scheduled Meetings</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-orange-500 text-sm flex items-center">
                    ↑ 50.0%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.meetings_scheduled}</div>
              <div className="text-sm text-gray-500">2 this week</div>
            </motion.div>

            {/* Communications */}
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
                    <div className="text-sm text-gray-600">Unread Messages</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-500 text-sm flex items-center">
                    ↑ 100%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData?.urgent_messages}</div>
              <div className="text-sm text-gray-500">1 urgent response needed</div>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Children Progress Health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Children Progress Health</h3>
                </div>
                <div className="text-sm text-gray-500">Updated 2:15 PM</div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData?.children.map((child, index) => (
                    <div key={child.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {child.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{child.name}</div>
                            <div className="text-sm text-gray-600">{child.class}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{child.gpa}</div>
                          <div className="text-xs text-gray-600">GPA</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Attendance</div>
                          <div className="text-lg font-bold text-blue-600">{child.attendance}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Status</div>
                          <div className="text-lg font-bold text-green-600">Excellent</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Parent Engagement Chain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Parent Activities</h3>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">On Schedule</span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-green-900">Parent-Teacher Conference</div>
                        <div className="text-sm text-green-700">Emma's Math Progress - Mrs. Johnson</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-700 font-medium">COMPLETED</div>
                      <div className="text-sm text-green-600">Sept 15, 3:00 PM</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-blue-900">Virtual Meeting</div>
                        <div className="text-sm text-blue-700">Alex's Science Project Discussion</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-700 font-medium">TODAY</div>
                      <div className="text-sm text-blue-600">4:30 PM</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">School Open House</div>
                        <div className="text-sm text-gray-700">Annual Academic Showcase</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-700 font-medium">UPCOMING</div>
                      <div className="text-sm text-gray-600">Sept 22, 10:00 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Concerns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Areas for Attention</h3>
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
                        <div className="font-medium text-gray-900">Emma's Math homework frequency</div>
                        <div className="text-sm text-gray-600">Grade 8A Mathematics • 15/09/2025</div>
                      </div>
                    </div>
                    <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">medium</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">Alex needs more reading practice</div>
                        <div className="text-sm text-gray-600">Grade 6B English • 14/09/2025</div>
                      </div>
                    </div>
                    <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">low</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">Both children showing improvement</div>
                        <div className="text-sm text-gray-600">Overall performance • 13/09/2025</div>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">positive</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Family Engagement Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <TrophyIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Family Engagement</h3>
                </div>
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">Highly Engaged</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{dashboardData?.children.length}</div>
                    <div className="text-sm text-gray-600">Children Monitored</div>
                    <div className="text-xs text-blue-600">Both excelling</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Meetings This Term</div>
                    <div className="text-xs text-blue-600">Above average</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-purple-50 rounded border border-purple-200">
                    <div className="text-lg font-bold text-purple-600">98%</div>
                    <div className="text-xs text-gray-600">Communication Rate</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="text-lg font-bold text-green-600">A+</div>
                    <div className="text-xs text-gray-600">Engagement Score</div>
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


export default ParentDashboard;