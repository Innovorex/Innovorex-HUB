// pages/student/StudentAssignments.tsx - Student Assignments Page
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'graded';
  grade?: string;
  score?: number;
  max_score?: number;
  submission_date?: string;
  feedback?: string;
  priority: 'low' | 'medium' | 'high';
}

const StudentAssignments: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  const { data: assignments, isLoading, error, refetch } = useQuery<Assignment[]>({
    queryKey: ['student-assignments', user?.id],
    queryFn: async () => {
      const response = await api.get('/assignments');
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const filteredAssignments = assignments?.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status === filter;
  }) || [];

  const getStatusConfig = (assignment: Assignment) => {
    const isOverdue = new Date(assignment.due_date) < new Date() && assignment.status === 'pending';

    if (isOverdue) {
      return {
        bg: 'bg-red-50 border-red-200',
        icon: ExclamationTriangleIcon,
        iconColor: 'text-red-600',
        statusText: 'OVERDUE',
        statusColor: 'text-red-700 bg-red-100'
      };
    }

    const configs = {
      pending: {
        bg: 'bg-yellow-50 border-yellow-200',
        icon: ClockIcon,
        iconColor: 'text-yellow-600',
        statusText: 'PENDING',
        statusColor: 'text-yellow-700 bg-yellow-100'
      },
      in_progress: {
        bg: 'bg-blue-50 border-blue-200',
        icon: ClipboardDocumentListIcon,
        iconColor: 'text-blue-600',
        statusText: 'IN PROGRESS',
        statusColor: 'text-blue-700 bg-blue-100'
      },
      submitted: {
        bg: 'bg-green-50 border-green-200',
        icon: CheckCircleIcon,
        iconColor: 'text-green-600',
        statusText: 'SUBMITTED',
        statusColor: 'text-green-700 bg-green-100'
      },
      graded: {
        bg: 'bg-purple-50 border-purple-200',
        icon: CheckCircleIcon,
        iconColor: 'text-purple-600',
        statusText: 'GRADED',
        statusColor: 'text-purple-700 bg-purple-100'
      }
    };

    return configs[assignment.status] || configs.pending;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading assignments...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ClipboardDocumentListIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load assignments</h3>
            <p className="text-gray-600 mb-4">Unable to fetch assignment data.</p>
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
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
            <p className="text-gray-600">Track and manage your course assignments</p>
          </div>
          <div className="flex space-x-3">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{assignments?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Assignments</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {assignments?.filter(a => a.status === 'pending').length || 0}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {assignments?.filter(a => a.status === 'submitted' || a.status === 'graded').length || 0}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {assignments?.filter(a =>
                    new Date(a.due_date) < new Date() && a.status === 'pending'
                  ).length || 0}
                </div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Assignments' },
                { key: 'pending', label: 'Pending' },
                { key: 'submitted', label: 'Submitted' },
                { key: 'graded', label: 'Graded' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    {tab.key === 'all'
                      ? assignments?.length || 0
                      : assignments?.filter(a => a.status === tab.key).length || 0
                    }
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment, index) => {
            const config = getStatusConfig(assignment);
            const IconComponent = config.icon;
            const daysUntilDue = Math.ceil(
              (new Date(assignment.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
            );

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${config.bg} border rounded-lg p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                      <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.statusColor}`}>
                          {config.statusText}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3">{assignment.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Subject:</span>
                          <span className="ml-2 font-medium text-gray-900">{assignment.subject}</span>
                        </div>

                        <div>
                          <span className="text-gray-500">Due Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        </div>

                        {daysUntilDue > 0 && assignment.status === 'pending' && (
                          <div>
                            <span className="text-gray-500">Time Left:</span>
                            <span className={`ml-2 font-medium ${
                              daysUntilDue <= 1 ? 'text-red-600' :
                              daysUntilDue <= 3 ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                              {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        {assignment.status === 'graded' && assignment.score !== undefined && (
                          <div>
                            <span className="text-gray-500">Score:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {assignment.score}/{assignment.max_score} ({assignment.grade})
                            </span>
                          </div>
                        )}
                      </div>

                      {assignment.feedback && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900 mb-1">Feedback:</div>
                          <div className="text-sm text-gray-700">{assignment.feedback}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {assignment.status === 'pending' && (
                      <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                        <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                        Submit
                      </button>
                    )}

                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No Assignments Found' : `No ${filter} Assignments`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'You have no assignments at the moment.'
                : `You have no ${filter} assignments.`
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentAssignments;