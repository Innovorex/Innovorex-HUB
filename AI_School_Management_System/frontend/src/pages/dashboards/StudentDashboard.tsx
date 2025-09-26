// pages/dashboards/StudentDashboard.tsx - ERPNext-style Student Executive Dashboard
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CalendarIcon,
  TrophyIcon,
  UserGroupIcon,
  CpuChipIcon,
  SparklesIcon,
  ArrowPathIcon,
  ClockIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

import DashboardLayout from '../../components/layouts/DashboardLayout';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface StudentDashboardData {
  student: {
    id: string;
    student_name: string;
    email: string;
    phone?: string;
    class: string;
    batch: string;
    status: string;
  };
  progress: {
    overall_gpa: number;
    subjects: {
      name: string;
      understanding: number;
      trend: 'up' | 'down' | 'stable';
      color: string;
    }[];
  };
  assignments: {
    id: string;
    title: string;
    description: string;
    due_date: string;
    status: string;
    subject: string;
  }[];
  attendance: {
    rate: number;
    present_days: number;
    total_days: number;
    recent: any[];
  };
  fees: {
    total_outstanding: number;
    overdue_count: number;
    recent_fees: any[];
  };
  exams: {
    exam: string;
    subject: string;
    grade: string;
    score: number;
    max_score: number;
    percentage: number;
  }[];
  activities: any[];
  goals: {
    id: string;
    title: string;
    description: string;
    progress: number;
    target_date: string;
    subject: string;
  }[];
  collaboration: {
    study_group_hours: number;
    classmates_helped: number;
    questions_asked: number;
    peer_teaching_hours: number;
  };
  independence: {
    problems_solved_alone: number;
    ai_usage_appropriateness: number;
    original_thinking_score: string;
    ready_for_next_level: boolean;
  };
  ai_chat_available: boolean;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showAIChat, setShowAIChat] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery<StudentDashboardData>({
    queryKey: ['student-dashboard', user?.id],
    queryFn: async () => {
      const response = await api.get('/students/dashboard');
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
            <p className="text-gray-600 mb-4">Unable to connect to the server. Please try again.</p>
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
              <div className="text-xs text-blue-300">Student Portal</div>
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

            <Link to="/student/courses" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <BookOpenIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">My Courses</span>
            </Link>

            <Link to="/student/assignments" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Assignments</span>
            </Link>

            <Link to="/student/grades" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <AcademicCapIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Grades</span>
            </Link>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <CalendarIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Schedule</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <UserGroupIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Study Groups</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <TrophyIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Achievements</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <PresentationChartLineIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">Reports</span>
            </a>

            <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
              <CpuChipIcon className="h-5 w-5 mr-3" />
              <span className="text-sm">AI Tutor</span>
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
                <div className="text-xs text-blue-300">Student</div>
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
                <h1 className="text-2xl font-bold">Student Learning Command Center</h1>
                <div className="flex items-center bg-green-500 px-2 py-1 rounded-full text-xs">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  Live Data
                </div>
              </div>
              <p className="text-blue-100 mt-1">Comprehensive academic intelligence and learning oversight</p>
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

        {/* Assigned Classes and Subjects from ERPNext */}
        <div className="px-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Enrolled Classes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Classes (Programs)</h3>
              <div className="space-y-2">
                {dashboardData?.assigned_classes?.length > 0 ? (
                  dashboardData.assigned_classes.map((className: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{className}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No classes assigned yet</p>
                )}
              </div>
            </div>

            {/* Enrolled Subjects */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Subjects (Courses)</h3>
              <div className="space-y-2">
                {dashboardData?.assigned_subjects?.length > 0 ? (
                  dashboardData.assigned_subjects.map((subject: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <BookOpenIcon className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{subject}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No subjects assigned yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Academic Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AcademicCapIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Current GPA vs Target</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-500 text-sm flex items-center">
                    ↓ 5.2%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData?.progress.overall_gpa.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">4.0 target (95%)</div>
            </motion.div>

            {/* Assignment Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Pending Assignments</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 15.0%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData?.assignments?.length || 0}
              </div>
              <div className="text-sm text-gray-500">
                {(dashboardData?.assignments || []).filter(a =>
                  new Date(a.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ).length || 0} due this week
              </div>
            </motion.div>

            {/* Study Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpenIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">Study Hours This Week</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 12.5%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData?.collaboration?.study_group_hours || 0}h
              </div>
              <div className="text-sm text-gray-500">30h weekly goal</div>
            </motion.div>

            {/* AI Tutor Usage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CpuChipIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-gray-600">AI Tutor Sessions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 text-sm flex items-center">
                    ↑ 8.5%
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData?.independence?.ai_usage_appropriateness || 0}%
              </div>
              <div className="text-sm text-gray-500">AI usage appropriateness</div>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Academic Performance Health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Academic Performance Health</h3>
                </div>
                <div className="text-sm text-gray-500">Updated 10:30 AM</div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData?.progress?.overall_gpa
                        ? (dashboardData.progress.overall_gpa >= 3.7 ? 'A-' :
                           dashboardData.progress.overall_gpa >= 3.3 ? 'B+' :
                           dashboardData.progress.overall_gpa >= 3.0 ? 'B' :
                           dashboardData.progress.overall_gpa >= 2.7 ? 'B-' : 'C+')
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Average Grade</div>
                    <div className="text-xs text-green-600">GPA: {dashboardData?.progress?.overall_gpa?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {(dashboardData?.progress?.subjects || []).filter(s => s.understanding < 75).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Subjects Need Focus</div>
                    <div className="text-xs text-orange-600">
                      {(dashboardData?.progress?.subjects || []).filter(s => s.understanding < 75)
                        .map(s => s.name).join(', ') || 'None'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData?.attendance?.rate || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                    <div className="text-xs text-blue-600">
                      {(dashboardData?.attendance?.rate || 0) >= 90 ? 'Excellent performance' :
                       (dashboardData?.attendance?.rate || 0) >= 75 ? 'Good performance' : 'Needs improvement'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Learning Activity Chain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Learning Activity Chain</h3>
                </div>
                <div className="flex items-center text-yellow-600">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">Monitor</span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData?.assignments?.slice(0, 3).map((assignment, index) => {
                    const isOverdue = new Date(assignment.due_date) < new Date();
                    const statusConfig = {
                      'completed': {
                        bg: 'bg-green-50 border-green-200',
                        icon: CheckCircleIcon,
                        iconColor: 'text-green-600',
                        textColor: 'text-green-900',
                        subtextColor: 'text-green-700',
                        statusColor: 'text-green-700'
                      },
                      'in_progress': {
                        bg: 'bg-blue-50 border-blue-200',
                        icon: ClockIcon,
                        iconColor: 'text-blue-600',
                        textColor: 'text-blue-900',
                        subtextColor: 'text-blue-700',
                        statusColor: 'text-blue-700'
                      },
                      'pending': {
                        bg: isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200',
                        icon: isOverdue ? ExclamationTriangleIcon : ClockIcon,
                        iconColor: isOverdue ? 'text-red-600' : 'text-gray-600',
                        textColor: isOverdue ? 'text-red-900' : 'text-gray-900',
                        subtextColor: isOverdue ? 'text-red-700' : 'text-gray-700',
                        statusColor: isOverdue ? 'text-red-700' : 'text-gray-700'
                      }
                    };

                    const config = statusConfig[assignment.status as keyof typeof statusConfig] || statusConfig.pending;
                    const IconComponent = config.icon;

                    return (
                      <div key={assignment.id} className={`flex items-center justify-between p-3 ${config.bg} border rounded-lg`}>
                        <div className="flex items-center">
                          <IconComponent className={`h-5 w-5 ${config.iconColor} mr-3`} />
                          <div>
                            <div className={`font-medium ${config.textColor}`}>{assignment.title}</div>
                            <div className={`text-sm ${config.subtextColor}`}>{assignment.subject} • {assignment.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`${config.statusColor} font-medium`}>
                            {isOverdue && assignment.status === 'pending' ? 'OVERDUE' : assignment.status.toUpperCase()}
                          </div>
                          <div className={`text-sm ${config.statusColor}`}>
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!dashboardData?.assignments || dashboardData.assignments.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No assignments found</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Study Issues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Recent Study Issues</h3>
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
                        <div className="font-medium text-gray-900">Mathematics quiz grade below target</div>
                        <div className="text-sm text-gray-600">Trigonometry • 17/09/2025</div>
                      </div>
                    </div>
                    <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">high</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">Missing lab report submission</div>
                        <div className="text-sm text-gray-600">Chemistry • 16/09/2025</div>
                      </div>
                    </div>
                    <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">medium</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Current Study Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Current Study Status</h3>
                </div>
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">Excellent</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {dashboardData?.progress?.subjects?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active Courses</div>
                    <div className="text-xs text-green-600">
                      {(dashboardData?.progress?.subjects || []).filter(s => s.understanding >= 75).length || 0} on track
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {dashboardData?.exams?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Recent Exams</div>
                    <div className="text-xs text-orange-600">
                      Avg: {dashboardData?.exams?.length
                        ? Math.round(dashboardData.exams.reduce((acc, exam) => acc + exam.percentage, 0) / dashboardData.exams.length)
                        : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      {showAIChat && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 overflow-hidden"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">AI Learning Assistant</h3>
                <button
                  onClick={() => setShowAIChat(false)}
                  className="text-blue-200 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <div className="h-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <CpuChipIcon className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <p>AI Tutor chat will be integrated here</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentDashboard;