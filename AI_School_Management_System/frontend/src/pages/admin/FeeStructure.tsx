import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BuildingLibraryIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface FeeStructureData {
  name: string;
  fee_structure_name: string;
  program: string;
  academic_term: string;
  academic_year: string;
  total_amount: number;
  receivable_account: string;
  income_account: string;
  company: string;
  disabled: number;
}

const FeeStructure: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: structuresData, isLoading, error } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Fee Structure');
        console.log('Fee Structure API response:', response);

        // Handle different response structures
        let structureData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          structureData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          structureData = response.data;
        } else if (response.data && response.data.message) {
          structureData = response.data.message;
        }

        console.log('Processed fee structure data:', structureData);
        return structureData || [];
      } catch (error) {
        console.error('Fee Structure API error:', error);
        return [];
      }
    },
  });

  const structures = structuresData || [];

  const filteredStructures = structures.filter((structure: FeeStructureData) =>
    (structure.fee_structure_name || structure.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (structure.program || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (structure.academic_year || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (structure.academic_term || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading fee structures. Please try again.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
          <p className="text-gray-600 mt-1">Manage program fee structures and amounts ({structures.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Fee Structure
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search fee structures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStructures.map((structure: FeeStructureData) => (
          <div key={structure.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <BuildingLibraryIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{structure.fee_structure_name || structure.program || 'Fee Structure'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {structure.name}</p>
                    <div className="flex items-center mt-1">
                      {(structure.disabled === 0 || structure.disabled === undefined) ? (
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

                <div className="space-y-3">
                  {structure.program && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{structure.program}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {structure.academic_year && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{structure.academic_year}</span>
                      </div>
                    )}
                    {structure.academic_term && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Term:</span> {structure.academic_term}
                      </div>
                    )}
                  </div>

                  {structure.total_amount && (
                    <div className="flex items-center text-lg font-semibold text-green-600 bg-green-50 p-3 rounded-lg">
                      <span className="text-green-600 font-bold mr-2">₹</span>
                      <span>{formatCurrency(structure.total_amount)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {structure.receivable_account && (
                      <div className="text-gray-600">
                        <span className="font-medium">Receivable:</span>
                        <span className="block text-xs text-gray-500 mt-1">
                          {structure.receivable_account}
                        </span>
                      </div>
                    )}
                    {structure.income_account && (
                      <div className="text-gray-600">
                        <span className="font-medium">Income:</span>
                        <span className="block text-xs text-gray-500 mt-1">
                          {structure.income_account}
                        </span>
                      </div>
                    )}
                  </div>

                  {structure.company && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Company:</span> {structure.company}
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

      {filteredStructures.length === 0 && (
        <div className="text-center py-12">
          <BuildingLibraryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No fee structures found.</p>
        </div>
      )}
    </div>
  );
};

export default FeeStructure;