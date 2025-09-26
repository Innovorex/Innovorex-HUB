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
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface StudentLogData {
  name: string;
  student: string;
  student_name: string;
  date: string;
  time: string;
  type: string;
  log: string;
  academic_year: string;
  academic_term: string;
}

const StudentLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['student-logs'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Student Log');
        console.log('Student Log API response:', response);

        // Handle different response structures
        let logData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          logData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          logData = response.data;
        } else if (response.data && response.data.message) {
          logData = response.data.message;
        }

        console.log('Processed log data:', logData);
        return logData || [];
      } catch (error) {
        console.error('Student Log API error:', error);
        // Return empty array for "no records found" instead of throwing
        return [];
      }
    },
  });

  const logs = logsData || [];

  const filteredLogs = logs.filter((log: StudentLogData) =>
    (log.student_name || log.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.student || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.type || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.log || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading student logs. Please try again.</p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'achievement':
        return 'bg-green-100 text-green-700';
      case 'incident':
        return 'bg-red-100 text-red-700';
      case 'behavior':
        return 'bg-yellow-100 text-yellow-700';
      case 'academic':
        return 'bg-blue-100 text-blue-700';
      case 'attendance':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Logs</h1>
          <p className="text-gray-600 mt-1">Track student activities and incidents ({logs.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Log Entry
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredLogs.map((log: StudentLogData) => (
            <li key={log.name}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">
                            {log.student_name || log.name || 'Unknown Student'}
                          </h3>
                          {log.type && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getTypeColor(log.type)}`}>
                              {log.type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          {log.date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(log.date).toLocaleDateString()}
                            </div>
                          )}
                          {log.time && (
                            <div className="flex items-center text-xs text-gray-500">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {log.time}
                            </div>
                          )}
                          {log.student && (
                            <div className="flex items-center text-xs text-gray-500">
                              <UserIcon className="h-3 w-3 mr-1" />
                              {log.student}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {log.log && (
                      <div className="ml-13 mb-2">
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                          {log.log}
                        </p>
                      </div>
                    )}

                    <div className="ml-13 flex items-center space-x-4">
                      {log.academic_year && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {log.academic_year}
                        </span>
                      )}
                      {log.academic_term && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {log.academic_term}
                        </span>
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

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No student logs found.</p>
        </div>
      )}
    </div>
  );
};

export default StudentLog;