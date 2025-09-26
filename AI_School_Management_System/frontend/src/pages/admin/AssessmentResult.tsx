import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface AssessmentResultData {
  name: string;
  student: string;
  student_name: string;
  assessment_plan: string;
  course: string;
  assessment_group: string;
  result: number;
  maximum_score: number;
  grade: string;
  comment: string;
  docstatus: number;
  creation: string;
}

const AssessmentResult: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: resultsData, isLoading, error } = useQuery({
    queryKey: ['assessment-results'],
    queryFn: async () => {
      const response = await api.get('/frappe/Assessment Result');
      return response.data.data || [];
    },
  });

  const results = resultsData || [];

  const filteredResults = results.filter((result: AssessmentResultData) =>
    result.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.assessment_plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.grade?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading assessment results. Please try again.</p>
      </div>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-700';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-700';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-700';
      case 'D':
      case 'F':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPercentage = (result: number, maxScore: number) => {
    if (!maxScore || maxScore === 0) return 0;
    return Math.round((result / maxScore) * 100);
  };

  const getStatusColor = (docstatus: number) => {
    switch (docstatus) {
      case 1:
        return 'bg-green-100 text-green-700';
      case 0:
        return 'bg-yellow-100 text-yellow-700';
      case 2:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (docstatus: number) => {
    switch (docstatus) {
      case 1:
        return 'Submitted';
      case 0:
        return 'Draft';
      case 2:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Results</h1>
          <p className="text-gray-600 mt-1">View and manage student assessment results ({results.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Result
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search assessment results..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredResults.map((result: AssessmentResultData) => (
            <li key={result.name}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          {result.student_name}
                        </h3>
                        {result.grade && (
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded font-semibold ${getGradeColor(result.grade)}`}>
                            {result.grade}
                          </span>
                        )}
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(result.docstatus)}`}>
                          {getStatusText(result.docstatus)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mt-1">
                        {result.student && (
                          <div className="flex items-center text-xs text-gray-500">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {result.student}
                          </div>
                        )}
                        {result.course && (
                          <div className="flex items-center text-xs text-gray-500">
                            <AcademicCapIcon className="h-3 w-3 mr-1" />
                            {result.course}
                          </div>
                        )}
                        {result.creation && (
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(result.creation).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Score</span>
                          <span className="font-medium text-gray-900">
                            {result.result || 0}/{result.maximum_score || 0} ({getPercentage(result.result, result.maximum_score)}%)
                          </span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${getPercentage(result.result, result.maximum_score)}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-2">
                        {result.assessment_plan && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {result.assessment_plan}
                          </span>
                        )}
                        {result.assessment_group && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {result.assessment_group}
                          </span>
                        )}
                      </div>

                      {result.comment && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                            {result.comment}
                          </p>
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

      {filteredResults.length === 0 && (
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No assessment results found.</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentResult;