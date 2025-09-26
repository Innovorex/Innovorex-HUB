import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  IdentificationIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface EmployeeCheckinData {
  name: string;
  employee: string;
  employee_name: string;
  log_type: string;
  time: string;
  device_id: string;
  skip_auto_attendance: number;
}

interface AttendanceData {
  name: string;
  employee: string;
  employee_name: string;
  attendance_date: string;
  status: string;
  check_in_time: string;
  check_out_time: string;
  working_hours: number;
  late_entry: number;
  early_exit: number;
  department: string;
  shift: string;
}

const InstructorAttendance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'single' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewType, setViewType] = useState<'attendance' | 'checkin'>('attendance');

  // Fetch Employee Attendance
  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['employee-attendance'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Attendance');
        console.log('Attendance API response:', response);

        let records = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          records = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          records = response.data;
        }

        return records || [];
      } catch (error) {
        console.error('Attendance API error:', error);
        return [];
      }
    },
  });

  // Fetch Employee Checkin
  const { data: checkinData, isLoading: checkinLoading, error: checkinError } = useQuery({
    queryKey: ['employee-checkin'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Employee Checkin');
        console.log('Employee Checkin API response:', response);

        let records = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          records = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          records = response.data;
        }

        return records || [];
      } catch (error) {
        console.error('Employee Checkin API error:', error);
        return [];
      }
    },
  });

  const attendance = attendanceData || [];
  const checkins = checkinData || [];

  // Filter attendance records
  const filteredAttendance = attendance.filter((record: AttendanceData) => {
    const matchesSearch = searchTerm === '' || (
      record.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchesDate = true;
    if (record.attendance_date) {
      const recordDate = new Date(record.attendance_date);

      if (dateFilterType === 'single' && selectedDate) {
        const filterDate = new Date(selectedDate);
        matchesDate = recordDate.toDateString() === filterDate.toDateString();
      } else if (dateFilterType === 'range' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = recordDate >= start && recordDate <= end;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Filter checkin records
  const filteredCheckins = checkins.filter((record: EmployeeCheckinData) => {
    const matchesSearch = searchTerm === '' || (
      record.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchesDate = true;
    if (record.time) {
      const recordDate = new Date(record.time);

      if (dateFilterType === 'single' && selectedDate) {
        const filterDate = new Date(selectedDate);
        matchesDate = recordDate.toDateString() === filterDate.toDateString();
      } else if (dateFilterType === 'range' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = recordDate >= start && recordDate <= end;
      }
    }

    return matchesSearch && matchesDate;
  });

  const isLoading = viewType === 'attendance' ? attendanceLoading : checkinLoading;
  const error = viewType === 'attendance' ? attendanceError : checkinError;

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
        <p className="text-red-600">Error loading instructor attendance. Please try again.</p>
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
      case 'half-day':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'on leave':
        return <CalendarIcon className="h-5 w-5 text-blue-600" />;
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
      case 'half-day':
        return 'bg-yellow-100 text-yellow-700';
      case 'on leave':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLogTypeIcon = (logType: string) => {
    return logType?.toLowerCase() === 'in' ?
      <ArrowRightOnRectangleIcon className="h-5 w-5 text-green-600" /> :
      <ArrowLeftOnRectangleIcon className="h-5 w-5 text-orange-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructor Attendance</h1>
          <p className="text-gray-600 mt-1">
            Track instructor attendance using Employee IDs
            {viewType === 'attendance' ?
              ` (Showing ${filteredAttendance.length} of ${attendance.length} records)` :
              ` (Showing ${filteredCheckins.length} of ${checkins.length} check-ins)`
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType('attendance')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              viewType === 'attendance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
            Attendance
          </button>
          <button
            onClick={() => setViewType('checkin')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              viewType === 'checkin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Check-ins
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee ID, name, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
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
        </div>
      </div>

      {/* Attendance View */}
      {viewType === 'attendance' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAttendance.map((record: AttendanceData) => (
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
                            {record.employee_name || 'Unknown'}
                          </p>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                          {record.late_entry === 1 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                              Late Entry
                            </span>
                          )}
                          {record.early_exit === 1 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                              Early Exit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <IdentificationIcon className="h-3 w-3 mr-1" />
                            {record.employee}
                          </div>
                          {record.attendance_date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(record.attendance_date).toLocaleDateString()}
                            </div>
                          )}
                          {record.department && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {record.department}
                            </span>
                          )}
                          {record.shift && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Shift: {record.shift}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          {record.check_in_time && (
                            <span className="text-xs text-gray-600">
                              <strong>In:</strong> {record.check_in_time}
                            </span>
                          )}
                          {record.check_out_time && (
                            <span className="text-xs text-gray-600">
                              <strong>Out:</strong> {record.check_out_time}
                            </span>
                          )}
                          {record.working_hours && (
                            <span className="text-xs text-gray-600">
                              <strong>Hours:</strong> {record.working_hours}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {filteredAttendance.length === 0 && (
            <div className="text-center py-12">
              <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found.</p>
            </div>
          )}
        </div>
      )}

      {/* Checkin View */}
      {viewType === 'checkin' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredCheckins.map((record: EmployeeCheckinData) => (
              <li key={record.name}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getLogTypeIcon(record.log_type)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {record.employee_name || 'Unknown'}
                          </p>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                            record.log_type?.toLowerCase() === 'in'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            Check {record.log_type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <IdentificationIcon className="h-3 w-3 mr-1" />
                            {record.employee}
                          </div>
                          {record.time && (
                            <div className="flex items-center text-xs text-gray-500">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {new Date(record.time).toLocaleString()}
                            </div>
                          )}
                          {record.device_id && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              Device: {record.device_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {filteredCheckins.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No check-in records found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructorAttendance;