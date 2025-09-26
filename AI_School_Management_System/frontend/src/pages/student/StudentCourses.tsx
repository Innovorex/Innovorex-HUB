// pages/student/StudentCourses.tsx - Student Courses List Page
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  credits: number;
  progress: number;
  grade: string;
  status: 'active' | 'completed' | 'dropped';
  schedule: string;
  nextClass: string;
}

const StudentCourses: React.FC = () => {
  const { user } = useAuth();

  const { data: courses, isLoading, error, refetch } = useQuery<Course[]>({
    queryKey: ['student-courses', user?.id],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading courses...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BookOpenIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load courses</h3>
            <p className="text-gray-600 mb-4">Unable to fetch course data.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600">Manage your enrolled courses and track progress</p>
          </div>
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

        {/* Course Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{courses?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
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
                  {courses?.filter(c => c.status === 'active').length || 0}
                </div>
                <div className="text-sm text-gray-600">Active Courses</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {courses?.length
                    ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Avg Progress</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {courses?.reduce((acc, c) => acc + c.credits, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total Credits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-600">{course.code}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.status === 'active' ? 'bg-green-100 text-green-800' :
                    course.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {course.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    {course.instructor}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {course.schedule}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    {course.credits} Credits
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Grade */}
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Grade</span>
                  <span className={`text-lg font-bold ${
                    course.grade.startsWith('A') ? 'text-green-600' :
                    course.grade.startsWith('B') ? 'text-blue-600' :
                    course.grade.startsWith('C') ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {course.grade}
                  </span>
                </div>

                {/* Next Class */}
                {course.nextClass && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Next Class</div>
                    <div className="text-sm text-blue-700">{course.nextClass}</div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {(!courses || courses.length === 0) && (
          <div className="text-center py-12">
            <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courses Found</h3>
            <p className="text-gray-600">You are not enrolled in any courses yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;