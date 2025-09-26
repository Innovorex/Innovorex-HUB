import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface AcademicYearData {
  name: string;
  academic_year_name: string;
  year_start_date: string;
  year_end_date: string;
  creation: string;
  modified: string;
}

const AcademicYear: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: yearsData, isLoading, error } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await api.get('/frappe/Academic Year');
      return response.data.data || [];
    },
  });

  const years = yearsData || [];

  const filteredYears = years.filter((year: AcademicYearData) =>
    year.academic_year_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading academic years. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Years</h1>
          <p className="text-gray-600 mt-1">Manage academic year settings</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Year
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search academic years..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredYears.map((year: AcademicYearData) => (
            <li key={year.name}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {year.academic_year_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(year.year_start_date).toLocaleDateString()} - {new Date(year.year_end_date).toLocaleDateString()}
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

      {filteredYears.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No academic years found.</p>
        </div>
      )}
    </div>
  );
};

export default AcademicYear;