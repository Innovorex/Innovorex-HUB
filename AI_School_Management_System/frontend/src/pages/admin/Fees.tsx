import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface FeesData {
  name: string;
  student: string;
  student_name: string;
  program: string;
  academic_year: string;
  academic_term: string;
  fee_structure: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: string;
  posting_date: string;
  company: string;
}

const Fees: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: feesData, isLoading, error } = useQuery({
    queryKey: ['fees'],
    queryFn: async () => {
      const response = await api.get('/frappe/Fees');
      return response.data.data || [];
    },
  });

  const fees = feesData || [];

  const filteredFees = fees.filter((fee: FeesData) =>
    fee.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.fee_structure?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading fees. Please try again.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'unpaid':
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'unpaid':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'partially paid':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentPercentage = (paid: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((paid / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Fees</h1>
          <p className="text-gray-600 mt-1">Manage student fee payments and records ({fees.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Fee Record
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search fees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredFees.map((fee: FeesData) => (
            <li key={fee.name}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      {getStatusIcon(fee.status)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          {fee.student_name}
                        </h3>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(fee.status)}`}>
                          {fee.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mt-1">
                        {fee.student && (
                          <div className="flex items-center text-xs text-gray-500">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {fee.student}
                          </div>
                        )}
                        {fee.program && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {fee.program}
                          </span>
                        )}
                        {fee.due_date && (
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Due: {new Date(fee.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Payment Progress</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(fee.paid_amount || 0)} / {formatCurrency(fee.total_amount || 0)}
                          </span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${getPaymentPercentage(fee.paid_amount, fee.total_amount)}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Paid: {getPaymentPercentage(fee.paid_amount, fee.total_amount)}%</span>
                          {fee.outstanding_amount > 0 && (
                            <span className="text-red-600 font-medium">
                              Outstanding: {formatCurrency(fee.outstanding_amount)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-2">
                        {fee.academic_year && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {fee.academic_year}
                          </span>
                        )}
                        {fee.academic_term && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {fee.academic_term}
                          </span>
                        )}
                        {fee.fee_structure && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {fee.fee_structure}
                          </span>
                        )}
                      </div>

                      {fee.posting_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Created: {new Date(fee.posting_date).toLocaleDateString()}
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
            </li>
          ))}
        </ul>
      </div>

      {filteredFees.length === 0 && (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No fee records found.</p>
        </div>
      )}
    </div>
  );
};

export default Fees;