import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface AssessmentCriteriaData {
  name: string;
  criteria_name: string;
  description: string;
  assessment_criteria_group: string;
  weightage: number;
  maximum_score: number;
  disabled: number;
}

const AssessmentCriteria: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: criteriaData, isLoading, error } = useQuery({
    queryKey: ['assessment-criteria'],
    queryFn: async () => {
      const response = await api.get('/frappe/Assessment Criteria');
      return response.data.data || [];
    },
  });

  const criteria = criteriaData || [];

  const filteredCriteria = criteria.filter((criterion: AssessmentCriteriaData) =>
    criterion.criteria_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    criterion.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    criterion.assessment_criteria_group?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading assessment criteria. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Criteria</h1>
          <p className="text-gray-600 mt-1">Manage assessment evaluation criteria ({criteria.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Criteria
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search assessment criteria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCriteria.map((criterion: AssessmentCriteriaData) => (
          <div key={criterion.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{criterion.criteria_name}</h3>
                    <div className="flex items-center mt-1">
                      {criterion.disabled === 0 ? (
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

                <div className="space-y-2">
                  {criterion.description && (
                    <div className="text-sm text-gray-600">
                      <p className="line-clamp-3">{criterion.description}</p>
                    </div>
                  )}

                  {criterion.assessment_criteria_group && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Group:</span> {criterion.assessment_criteria_group}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {criterion.weightage && (
                      <div className="flex items-center text-sm text-gray-600">
                        <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                        <span>{criterion.weightage}% weight</span>
                      </div>
                    )}

                    {criterion.maximum_score && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Max Score:</span> {criterion.maximum_score}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <HashtagIcon className="h-4 w-4 mr-1" />
                    <span className="font-mono text-xs">{criterion.name}</span>
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

      {filteredCriteria.length === 0 && (
        <div className="text-center py-12">
          <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No assessment criteria found.</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentCriteria;