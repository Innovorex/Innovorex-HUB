// pages/admin/CourseEnrollment.tsx - Display all course enrollments from ERPNext
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  BookOpenIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface CourseEnrollment {
  name: string;
  student: string;
  course: string;
  course_name: string;
  enrollment_date: string;
}

const CourseEnrollment: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch course enrollments from ERPNext
  const { data: enrollmentsData, isLoading, error } = useQuery({
    queryKey: ['course-enrollments'],
    queryFn: async () => {
      const response = await api.get('/course-enrollments');
      return response.data;
    },
  });

  const enrollments = enrollmentsData || [];

  // Filter enrollments based on search
  const filteredEnrollments = enrollments.filter((enrollment: CourseEnrollment) =>
    enrollment.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading course enrollments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Enrollment</h1>
          <p className="text-gray-600 mt-1">Assign courses to students ({enrollments.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Enrollment
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search course enrollments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnrollments.map((enrollment: CourseEnrollment, index: number) => (
                <motion.tr
                  key={enrollment.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">{enrollment.student}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 text-blue-600 mr-2" />
                      <div className="text-sm text-gray-900">{enrollment.course}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.course_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {enrollment.enrollment_date ? new Date(enrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEnrollments.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No course enrollments found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollment;