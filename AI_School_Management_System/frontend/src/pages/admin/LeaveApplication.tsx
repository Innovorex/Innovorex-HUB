import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface LeaveApplicationData {
  name: string;
  student: string;
  student_name: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  leave_type: string;
  reason: string;
  status: string;
  posting_date: string;
  leave_approver: string;
  attachment: string;
}

const LeaveApplication: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: applicationsData, isLoading, error } = useQuery({
    queryKey: ['leave-applications'],
    queryFn: async () => {
      const response = await api.get('/frappe/Leave Application');
      return response.data.data || [];
    },
  });

  const applications = applicationsData || [];

  const filteredApplications = applications.filter((application: LeaveApplicationData) =>
    application.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    application.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    application.leave_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    application.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    application.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading leave applications. Please try again.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'open':
      case 'pending':
        return <PendingIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'open':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'sick leave':
        return 'bg-red-100 text-red-700';
      case 'casual leave':
        return 'bg-blue-100 text-blue-700';
      case 'medical leave':
        return 'bg-purple-100 text-purple-700';
      case 'emergency leave':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Applications</h1>
          <p className="text-gray-600 mt-1">Manage student leave requests ({applications.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Leave Application
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search leave applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredApplications.map((application: LeaveApplicationData) => (
            <li key={application.name}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        {getStatusIcon(application.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">
                            {application.student_name}
                          </h3>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                          {application.leave_type && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getLeaveTypeColor(application.leave_type)}`}>
                              {application.leave_type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          {application.from_date && application.to_date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(application.from_date).toLocaleDateString()} - {new Date(application.to_date).toLocaleDateString()}
                            </div>
                          )}
                          {application.total_leave_days && (
                            <div className="flex items-center text-xs text-gray-500">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {application.total_leave_days} days
                            </div>
                          )}
                          {application.student && (
                            <div className="flex items-center text-xs text-gray-500">
                              <UserIcon className="h-3 w-3 mr-1" />
                              {application.student}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {application.reason && (
                      <div className="ml-13 mb-2">
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                          <span className="font-medium">Reason:</span> {application.reason}
                        </p>
                      </div>
                    )}

                    <div className="ml-13 flex items-center space-x-4 text-xs text-gray-500">
                      {application.posting_date && (
                        <span>Applied: {new Date(application.posting_date).toLocaleDateString()}</span>
                      )}
                      {application.leave_approver && (
                        <span>Approver: {application.leave_approver}</span>
                      )}
                      {application.attachment && (
                        <span className="text-blue-600">📎 Attachment</span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No leave applications found.</p>
        </div>
      )}
    </div>
  );
};

export default LeaveApplication;