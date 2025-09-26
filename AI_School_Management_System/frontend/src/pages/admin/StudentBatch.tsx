import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface StudentBatchData {
  name: string;
  batch_name: string;
  program: string;
  academic_year: string;
  academic_term: string;
  start_date: string;
  end_date: string;
  max_strength: number;
  current_strength: number;
  disabled: number;
}

const StudentBatch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: batchesData, isLoading, error } = useQuery({
    queryKey: ['student-batches'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Student Batch Name');
        console.log('Student Batch API response:', response);

        // Handle different response structures
        let batchData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          batchData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          batchData = response.data;
        } else if (response.data && response.data.message) {
          batchData = response.data.message;
        }

        console.log('Processed Student Batch Name data:', batchData);
        return batchData || [];
      } catch (error) {
        console.error('Student Batch Name API error:', error);
        // Return empty array for "no records found" instead of throwing
        return [];
      }
    },
  });

  const batches = batchesData || [];

  const filteredBatches = batches.filter((batch: StudentBatchData) =>
    (batch.batch_name || batch.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (batch.program || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (batch.academic_year || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading student batches. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Batches</h1>
          <p className="text-gray-600 mt-1">Manage student batch groups ({batches.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Batch
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search batches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((batch: StudentBatchData) => (
          <div key={batch.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <UserGroupIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{batch.batch_name || batch.name}</h3>
                    <p className="text-sm text-gray-500">{batch.program || 'No program assigned'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{batch.academic_year || 'N/A'} {batch.academic_term ? `- ${batch.academic_term}` : ''}</span>
                  </div>

                  {batch.start_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{new Date(batch.start_date).toLocaleDateString()}</span>
                      {batch.end_date && (
                        <span> - {new Date(batch.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Strength: {batch.current_strength || 0}/{batch.max_strength || '-'}
                    </span>
                    {(batch.disabled === 0 || batch.disabled === undefined) ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        Disabled
                      </span>
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
        ))}
      </div>

      {filteredBatches.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No student batches found.</p>
        </div>
      )}
    </div>
  );
};

export default StudentBatch;