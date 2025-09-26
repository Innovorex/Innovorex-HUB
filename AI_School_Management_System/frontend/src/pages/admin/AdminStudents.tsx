// pages/admin/AdminStudents.tsx - Student Management Page
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  UserPlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface Student {
  id: string;
  student_name: string;
  email: string;
  phone?: string;
  class: string;
  batch: string;
  status: string;
  enrollment_date: string;
  gpa?: number;
  attendance_rate?: number;
  parent_email?: string;
}

const AdminStudents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: students, isLoading, error, refetch } = useQuery<Student[]>({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const response = await api.get('/admin/students');
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || student.class === filterClass;
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;

    return matchesSearch && matchesClass && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      graduated: 'bg-blue-100 text-blue-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading students...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AcademicCapIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load students</h3>
            <p className="text-gray-600 mb-4">Unable to fetch student data.</p>
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
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600">Manage student records and academic information</p>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Add Student
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{students?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {students?.filter(s => s.status === 'active').length || 0}
                </div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {students?.filter(s => s.gpa && s.gpa >= 3.5).length || 0}
                </div>
                <div className="text-sm text-gray-600">Honor Students</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {students?.filter(s => s.attendance_rate && s.attendance_rate >= 95).length || 0}
                </div>
                <div className="text-sm text-gray-600">Perfect Attendance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Classes</option>
              <option value="10th">10th Grade</option>
              <option value="11th">11th Grade</option>
              <option value="12th">12th Grade</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
            </select>

            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Export
              </button>
              <button className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Import
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class/Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GPA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {student.student_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.class}</div>
                      <div className="text-sm text-gray-500">{student.batch}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        (student.gpa || 0) >= 3.5 ? 'text-green-600' :
                        (student.gpa || 0) >= 3.0 ? 'text-blue-600' :
                        (student.gpa || 0) >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.gpa ? student.gpa.toFixed(2) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        (student.attendance_rate || 0) >= 90 ? 'text-green-600' :
                        (student.attendance_rate || 0) >= 75 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.attendance_rate ? `${student.attendance_rate}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">No students match your search criteria.</p>
            </div>
          )}
        </div>
      </div>
  );
};

export default AdminStudents;