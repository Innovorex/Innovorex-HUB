import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface AttendanceToolData {
  name: string;
  date: string;
  student_group: string;
  course_schedule: string;
  instructor: string;
  from_time: string;
  to_time: string;
  status: string;
  total_present: number;
  total_absent: number;
  total_students: number;
}

const AttendanceTool: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: toolsData, isLoading, error } = useQuery({
    queryKey: ['attendance-tools'],
    queryFn: async () => {
      const response = await api.get('/frappe/Attendance Tool');
      return response.data.data || [];
    },
  });

  const tools = toolsData || [];

  const filteredTools = tools.filter((tool: AttendanceToolData) =>
    tool.student_group?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.course_schedule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.status?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading attendance tools. Please try again.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'submitted':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAttendancePercentage = (present: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tools</h1>
          <p className="text-gray-600 mt-1">Manage attendance marking sessions ({tools.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Attendance Session
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search attendance tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool: AttendanceToolData) => (
          <div key={tool.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tool.student_group}</h3>
                    <div className="flex items-center mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(tool.status)}`}>
                        {tool.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {tool.date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{new Date(tool.date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {tool.instructor && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{tool.instructor}</span>
                    </div>
                  )}

                  {(tool.from_time || tool.to_time) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {tool.from_time && tool.to_time
                          ? `${tool.from_time} - ${tool.to_time}`
                          : tool.from_time || tool.to_time}
                      </span>
                    </div>
                  )}

                  {tool.course_schedule && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Schedule:</span>
                      <span className="block text-xs text-gray-500 mt-1">
                        {tool.course_schedule}
                      </span>
                    </div>
                  )}

                  {tool.total_students > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Attendance</span>
                        <span className="font-medium text-gray-900">
                          {getAttendancePercentage(tool.total_present, tool.total_students)}%
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Present: {tool.total_present || 0} | Absent: {tool.total_absent || 0} | Total: {tool.total_students}
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${getAttendancePercentage(tool.total_present, tool.total_students)}%`
                          }}
                        ></div>
                      </div>
                    </div>
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
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No attendance tools found.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceTool;