import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface StudentAdmissionData {
  name: string;
  student_name: string;
  application_no: string;
  student_applicant: string;
  academic_year: string;
  academic_term: string;
  program: string;
  student_batch: string;
  admission_date: string;
  student_category: string;
  status: string;
}

const StudentAdmission: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: admissionsData, isLoading, error } = useQuery({
    queryKey: ['student-admissions'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Student Admission');
        console.log('Student Admission API response:', response);

        // Handle different response structures
        let admissionData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          admissionData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          admissionData = response.data;
        } else if (response.data && response.data.message) {
          admissionData = response.data.message;
        }

        console.log('Processed admission data:', admissionData);
        return admissionData || [];
      } catch (error) {
        console.error('Student Admission API error:', error);
        // Return empty array for "no records found" instead of throwing
        return [];
      }
    },
  });

  const admissions = admissionsData || [];

  const filteredAdmissions = admissions.filter((admission: StudentAdmissionData) =>
    admission.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admission.application_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admission.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admission.status?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading student admissions. Please try again.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Admissions</h1>
          <p className="text-gray-600 mt-1">Manage student admission records ({admissions.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Admission
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search admissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredAdmissions.map((admission: StudentAdmissionData) => (
            <li key={admission.name}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <AcademicCapIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {admission.student_name}
                        </p>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(admission.status)}`}>
                          {admission.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">App No: {admission.application_no}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        {admission.program && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {admission.program}
                          </span>
                        )}
                        {admission.student_batch && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            Batch: {admission.student_batch}
                          </span>
                        )}
                        {admission.admission_date && (
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(admission.admission_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
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

      {filteredAdmissions.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No student admissions found.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAdmission;