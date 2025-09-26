import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface StudentAttendanceData {
  name: string;
  student: string;
  student_name: string;
  date: string;
  status: string;
  course_schedule: string;
  student_group: string;
  leave_application: string;
  late: number;
  excuse: string;
}

const StudentAttendance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'single' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: attendanceData, isLoading, error } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Student Attendance');
        console.log('Student Attendance API response:', response);

        let attendanceRecords = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          attendanceRecords = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          attendanceRecords = response.data;
        } else if (response.data && response.data.message) {
          attendanceRecords = response.data.message;
        }

        console.log('Processed attendance data:', attendanceRecords);
        return attendanceRecords || [];
      } catch (error) {
        console.error('Student Attendance API error:', error);
        return [];
      }
    },
  });

  const attendance = attendanceData || [];

  const filteredAttendance = attendance.filter((record: StudentAttendanceData) => {
    // Search filter
    const matchesSearch = searchTerm === '' || (
      record.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student_group?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Date filter
    let matchesDate = true;
    if (record.date) {
      const recordDate = new Date(record.date);

      if (dateFilterType === 'single' && selectedDate) {
        const filterDate = new Date(selectedDate);
        matchesDate = recordDate.toDateString() === filterDate.toDateString();
      } else if (dateFilterType === 'range' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the end date fully
        matchesDate = recordDate >= start && recordDate <= end;
      }
    }

    return matchesSearch && matchesDate;
  });

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
        <p className="text-red-600">Error loading student attendance. Please try again.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'half day':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-700';
      case 'absent':
        return 'bg-red-100 text-red-700';
      case 'half day':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Attendance</h1>
          <p className="text-gray-600 mt-1">
            Track student attendance records
            {filteredAttendance.length !== attendance.length ? (
              <span> (Showing {filteredAttendance.length} of {attendance.length})</span>
            ) : (
              <span> ({attendance.length} total)</span>
            )}
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Mark Attendance
        </button>
      </div>

      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search attendance records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter type selector */}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <select
                value={dateFilterType}
                onChange={(e) => {
                  setDateFilterType(e.target.value as 'all' | 'single' | 'range');
                  setSelectedDate('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Dates</option>
                <option value="single">Specific Date</option>
                <option value="range">Date Range</option>
              </select>
            </div>

            {/* Single date picker */}
            {dateFilterType === 'single' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Date range picker */}
            {dateFilterType === 'range' && (
              <>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Clear filters button */}
            {(dateFilterType !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setDateFilterType('all');
                  setSelectedDate('');
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Active filter display */}
          <div className="mt-3 flex flex-wrap gap-2">
            {dateFilterType === 'single' && selectedDate && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {new Date(selectedDate).toLocaleDateString()}
              </span>
            )}
            {dateFilterType === 'range' && startDate && endDate && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs flex items-center">
                <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
                "{searchTerm}"
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredAttendance.map((record: StudentAttendanceData) => (
            <li key={record.name}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {getStatusIcon(record.status)}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {record.student_name}
                        </p>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                        {record.late === 1 && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                            Late
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        {record.date && (
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                        )}
                        {record.student && (
                          <div className="flex items-center text-xs text-gray-500">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {record.student}
                          </div>
                        )}
                        {record.student_group && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {record.student_group}
                          </span>
                        )}
                      </div>
                      {record.excuse && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 italic">
                            Excuse: {record.excuse}
                          </p>
                        </div>
                      )}
                      {record.leave_application && (
                        <div className="mt-1">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Leave App: {record.leave_application}
                          </span>
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
            </li>
          ))}
        </ul>
      </div>

      {filteredAttendance.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No attendance records found.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;