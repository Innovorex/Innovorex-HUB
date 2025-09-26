import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface ApplicantData {
  name: string;
  first_name: string;
  last_name: string;
  program: string;
  application_status: string;
  email_id: string;
  mobile_no: string;
}

const StudentApplicant: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: applicantsData, isLoading, error } = useQuery({
    queryKey: ['student-applicants'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Student Applicant');
        console.log('Student Applicant API response:', response);

        // Handle different response structures
        let applicantData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          applicantData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          applicantData = response.data;
        } else if (response.data && response.data.message) {
          applicantData = response.data.message;
        }

        console.log('Processed applicant data:', applicantData);
        return applicantData || [];
      } catch (error) {
        console.error('Student Applicant API error:', error);
        // Return empty array for "no records found" instead of throwing
        return [];
      }
    },
  });

  const applicants = applicantsData || [];

  const filteredApplicants = applicants.filter((applicant: ApplicantData) =>
    applicant.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    applicant.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    applicant.email_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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
        <p className="text-red-600">Error loading applicants. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Applicants</h1>
          <p className="text-gray-600 mt-1">Review and manage admission applications</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Applicant
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search applicants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApplicants.map((applicant: ApplicantData) => (
          <div key={applicant.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <UserPlusIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {applicant.first_name} {applicant.last_name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(applicant.application_status)}`}>
                      {applicant.application_status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Program: {applicant.program}</p>
                  <p>{applicant.email_id}</p>
                  <p>{applicant.mobile_no}</p>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100">
                    <CheckIcon className="h-3 w-3 inline mr-1" />
                    Approve
                  </button>
                  <button className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100">
                    <XMarkIcon className="h-3 w-3 inline mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApplicants.length === 0 && (
        <div className="text-center py-12">
          <UserPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No applicants found.</p>
        </div>
      )}
    </div>
  );
};

export default StudentApplicant;
