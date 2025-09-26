// pages/student/StudentGrades.tsx - Student Grades and Academic Performance Page
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Grade {
  id: string;
  exam: string;
  subject: string;
  grade: string;
  score: number;
  max_score: number;
  percentage: number;
  date: string;
  semester: string;
  type: 'quiz' | 'midterm' | 'final' | 'assignment' | 'project';
}

interface SubjectSummary {
  subject: string;
  average: number;
  grade: string;
  trend: 'up' | 'down' | 'stable';
  credits: number;
  total_assessments: number;
}

const StudentGrades: React.FC = () => {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<string>('current');

  const { data: gradesData, isLoading, error, refetch } = useQuery({
    queryKey: ['student-grades', user?.id, selectedSemester],
    queryFn: async () => {
      const response = await api.get(`/grades?semester=${selectedSemester}`);
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const grades: Grade[] = gradesData?.grades || [];
  const subjects: SubjectSummary[] = gradesData?.subjects || [];
  const gpa = gradesData?.gpa || 0;
  const classRank = gradesData?.class_rank || 0;
  const totalStudents = gradesData?.total_students || 0;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'final': return '🎓';
      case 'midterm': return '📝';
      case 'quiz': return '❓';
      case 'assignment': return '📋';
      case 'project': return '💼';
      default: return '📊';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading grades...</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load grades</h3>
            <p className="text-gray-600 mb-4">Unable to fetch grade data.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Academic Performance</h1>
            <p className="text-gray-600">Track your grades and academic progress</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="current">Current Semester</option>
              <option value="2024-spring">Spring 2024</option>
              <option value="2023-fall">Fall 2023</option>
              <option value="2023-spring">Spring 2023</option>
            </select>
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

        {/* Academic Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{gpa.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Current GPA</div>
                <div className="text-xs text-blue-600">Out of 4.0</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">#{classRank}</div>
                <div className="text-sm text-gray-600">Class Rank</div>
                <div className="text-xs text-green-600">out of {totalStudents}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{subjects.length}</div>
                <div className="text-sm text-gray-600">Subjects</div>
                <div className="text-xs text-purple-600">This semester</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">{grades.length}</div>
                <div className="text-sm text-gray-600">Assessments</div>
                <div className="text-xs text-orange-600">Total recorded</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Subject Performance</h2>
            <p className="text-sm text-gray-600">Your performance across all subjects</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {subject.subject.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{subject.subject}</h3>
                      <p className="text-sm text-gray-600">{subject.credits} credits • {subject.total_assessments} assessments</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{subject.average.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Average</div>
                    </div>

                    <div className="text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(subject.grade)}`}>
                        {subject.grade}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {subject.trend === 'up' && (
                        <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                      )}
                      {subject.trend === 'down' && (
                        <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                      )}
                      {subject.trend === 'stable' && (
                        <div className="w-5 h-0.5 bg-gray-400"></div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Grades</h2>
            <p className="text-sm text-gray-600">Your latest assessment results</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grades.slice(0, 10).map((grade, index) => (
                  <motion.tr
                    key={grade.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(grade.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{grade.exam}</div>
                          <div className="text-sm text-gray-500 capitalize">{grade.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{grade.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grade.score}/{grade.max_score}
                      </div>
                      <div className="text-sm text-gray-500">{grade.percentage.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade.grade)}`}>
                        {grade.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(grade.date).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {grades.length === 0 && (
            <div className="text-center py-12">
              <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Grades Available</h3>
              <p className="text-gray-600">No grades have been recorded for this semester yet.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentGrades;