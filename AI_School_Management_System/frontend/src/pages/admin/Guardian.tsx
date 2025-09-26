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
  HomeIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface GuardianData {
  name: string;
  guardian_name: string;
  email_address: string;
  mobile_number: string;
  alternate_number: string;
  relation: string;
  address: string;
  occupation: string;
  organization: string;
}

const Guardian: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: guardiansData, isLoading, error } = useQuery({
    queryKey: ['guardians'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Guardian');
        console.log('Guardian API response:', response);

        // Handle different response structures
        let guardianData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          guardianData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          guardianData = response.data;
        } else if (response.data && response.data.message) {
          guardianData = response.data.message;
        }

        console.log('Processed guardian data:', guardianData);
        return guardianData || [];
      } catch (error) {
        console.error('Guardian API error:', error);
        // Return empty array for "no records found" instead of throwing
        return [];
      }
    },
  });

  const guardians = guardiansData || [];

  const filteredGuardians = guardians.filter((guardian: GuardianData) =>
    (guardian.guardian_name || guardian.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guardian.email_address || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guardian.relation || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guardian.occupation || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading guardians. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guardians</h1>
          <p className="text-gray-600 mt-1">Manage student guardians and parents ({guardians.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Guardian
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search guardians..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuardians.map((guardian: GuardianData) => (
          <div key={guardian.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{guardian.guardian_name || 'Unknown Guardian'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {guardian.name}</p>
                    {guardian.relation && (
                      <span className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {guardian.relation}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {guardian.email_address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{guardian.email_address}</span>
                    </div>
                  )}

                  {guardian.mobile_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{guardian.mobile_number}</span>
                    </div>
                  )}

                  {guardian.occupation && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Occupation:</span> {guardian.occupation}
                      {guardian.organization && (
                        <span className="block text-xs text-gray-500 mt-1">
                          at {guardian.organization}
                        </span>
                      )}
                    </div>
                  )}

                  {guardian.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <HomeIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs line-clamp-2">{guardian.address}</span>
                    </div>
                  )}

                  {guardian.alternate_number && (
                    <div className="text-xs text-gray-500">
                      Alt: {guardian.alternate_number}
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

      {filteredGuardians.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No guardians found.</p>
        </div>
      )}
    </div>
  );
};

export default Guardian;