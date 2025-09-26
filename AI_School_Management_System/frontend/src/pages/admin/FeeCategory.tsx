import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TagIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface FeeCategoryData {
  name: string;
  category_name: string;
  description: string;
  is_refundable: number;
  disabled: number;
}

const FeeCategory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categoriesData, isLoading, error } = useQuery({
    queryKey: ['fee-categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Fee Category');
        console.log('Fee Category API response:', response);

        // Handle different response structures
        let categoryData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          categoryData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          categoryData = response.data;
        } else if (response.data && response.data.message) {
          categoryData = response.data.message;
        }

        console.log('Processed fee category data:', categoryData);
        return categoryData || [];
      } catch (error) {
        console.error('Fee Category API error:', error);
        return [];
      }
    },
  });

  const categories = categoriesData || [];

  const filteredCategories = categories.filter((category: FeeCategoryData) =>
    (category.category_name || category.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading fee categories. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Categories</h1>
          <p className="text-gray-600 mt-1">Manage fee classification categories ({categories.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Fee Category
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search fee categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category: FeeCategoryData) => (
          <div key={category.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <TagIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.category_name || category.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {(category.disabled === 0 || category.disabled === undefined) ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Disabled
                        </span>
                      )}
                      {category.is_refundable === 1 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Refundable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {category.description && (
                    <div className="text-sm text-gray-600">
                      <p className="line-clamp-3">{category.description}</p>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-500 mt-3">
                    <HashtagIcon className="h-4 w-4 mr-1" />
                    <span className="font-mono text-xs">{category.name}</span>
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

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No fee categories found.</p>
        </div>
      )}
    </div>
  );
};

export default FeeCategory;