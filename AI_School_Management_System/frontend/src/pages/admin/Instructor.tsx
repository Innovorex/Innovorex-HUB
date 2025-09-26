import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface InstructorData {
  name: string;
  instructor_name: string;
  employee: string;
  employee_id: string;
  email: string;
  mobile_number: string;
  department: string;
  designation: string;
}

const Instructor: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: instructorsData, isLoading, error } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const response = await api.get('/frappe/Instructor');
      return response.data.data || [];
    },
  });

  const instructors = instructorsData || [];

  const filteredInstructors = instructors.filter((instructor: InstructorData) =>
    instructor.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.department?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading instructors. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-600 mt-1">Manage teaching staff and track attendance with Employee IDs</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Instructor
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, employee ID, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstructors.map((instructor: InstructorData) => (
          <div key={instructor.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{instructor.instructor_name}</h3>
                    <p className="text-sm text-gray-500">{instructor.designation}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(instructor.employee || instructor.employee_id) && (
                    <div className="flex items-center text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      <IdentificationIcon className="h-4 w-4 mr-1" />
                      <span>Employee ID: {instructor.employee || instructor.employee_id || 'N/A'}</span>
                    </div>
                  )}
                  {instructor.department && (
                    <p className="text-sm text-gray-600">Dept: {instructor.department}</p>
                  )}
                  {instructor.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="truncate">{instructor.email}</span>
                    </div>
                  )}
                  {instructor.mobile_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{instructor.mobile_number}</span>
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

      {filteredInstructors.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No instructors found.</p>
        </div>
      )}
    </div>
  );
};

export default Instructor;
