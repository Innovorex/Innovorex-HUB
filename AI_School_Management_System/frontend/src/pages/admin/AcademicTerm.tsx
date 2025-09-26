import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface AcademicTermData {
  name: string;
  term_name: string;
  academic_year: string;
  term_start_date: string;
  term_end_date: string;
  title: string;
}

const AcademicTerm: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: termsData, isLoading, error } = useQuery({
    queryKey: ['academic-terms'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Academic Term');
        console.log('Academic Term API response:', response);

        // Handle different response structures
        let termData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          termData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          termData = response.data;
        } else if (response.data && response.data.message) {
          termData = response.data.message;
        }

        console.log('Processed term data:', termData);
        return termData || [];
      } catch (error) {
        console.error('Academic Term API error:', error);
        // Return empty array instead of throwing
        return [];
      }
    },
  });

  const terms = termsData || [];

  const filteredTerms = terms.filter((term: AcademicTermData) =>
    (term.term_name || term.title || term.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (term.academic_year || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading academic terms. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Terms</h1>
          <p className="text-gray-600 mt-1">Manage academic terms and semesters</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Term
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search academic terms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((term: AcademicTermData) => (
          <div key={term.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <CalendarDaysIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{term.term_name || term.title}</h3>
                    <p className="text-sm text-gray-500">{term.academic_year}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {term.term_start_date && (
                    <p>Start: {new Date(term.term_start_date).toLocaleDateString()}</p>
                  )}
                  {term.term_end_date && (
                    <p>End: {new Date(term.term_end_date).toLocaleDateString()}</p>
                  )}
                  {!term.term_start_date && !term.term_end_date && (
                    <p className="text-gray-400 italic">No date information available</p>
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

      {filteredTerms.length === 0 && (
        <div className="text-center py-12">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No academic terms found.</p>
        </div>
      )}
    </div>
  );
};

export default AcademicTerm;