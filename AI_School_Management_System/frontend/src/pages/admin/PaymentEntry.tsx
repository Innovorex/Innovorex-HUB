import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface PaymentEntryData {
  name: string;
  title?: string;
  payment_type?: string;
  party_type?: string;
  party?: string;
  party_name?: string;
  posting_date?: string;
  paid_amount?: number;
  received_amount?: number;
  status?: string;
  docstatus?: number;
  company?: string;
  paid_from?: string;
  paid_to?: string;
  mode_of_payment?: string;
  reference_no?: string;
  reference_date?: string;
  remarks?: string;
  project?: string;
  cost_center?: string;
  sales_invoice?: string;
  // Additional ERPNext fields
  workflow_state?: string;
  total_allocated_amount?: number;
  unallocated_amount?: number;
  customer?: string;
  customer_name?: string;
}

const PaymentEntry: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['payment-entries'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Payment Entry');
        console.log('Payment Entry API response:', response);

        let paymentData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          paymentData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          paymentData = response.data;
        } else if (response.data && response.data.message) {
          paymentData = response.data.message;
        }

        console.log('Processed payment entry data:', paymentData);
        // Log first item to see actual field structure
        if (paymentData && paymentData.length > 0) {
          console.log('First payment fields:', Object.keys(paymentData[0]));
          console.log('First payment data:', paymentData[0]);
        }
        return paymentData || [];
      } catch (error) {
        console.error('Payment Entry API error:', error);
        return [];
      }
    },
  });

  const payments = paymentsData || [];

  const filteredPayments = payments.filter((payment: PaymentEntryData) =>
    (payment.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.party || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.party_name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.sales_invoice || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.mode_of_payment || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading payment entries. Please try again.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const getStatusColor = (status: string, docstatus: number) => {
    if (docstatus === 2) return 'bg-red-100 text-red-700'; // Cancelled
    if (docstatus === 0) return 'bg-yellow-100 text-yellow-700'; // Draft

    switch (status?.toLowerCase()) {
      case 'submitted':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string, docstatus: number) => {
    if (docstatus === 2) return <ExclamationTriangleIcon className="h-4 w-4" />;
    if (docstatus === 0) return <ExclamationTriangleIcon className="h-4 w-4" />;
    if (docstatus === 1) return <CheckCircleIcon className="h-4 w-4" />;
    return <DocumentTextIcon className="h-4 w-4" />;
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType?.toLowerCase()) {
      case 'receive':
        return 'bg-green-100 text-green-700';
      case 'pay':
        return 'bg-blue-100 text-blue-700';
      case 'internal transfer':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Entries</h1>
          <p className="text-gray-600 mt-1">Manage fee payments and receipts ({payments.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Payment Entry
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search payment entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPayments.map((payment: PaymentEntryData) => (
          <div key={payment.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <BanknotesIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {payment.title || payment.party_name || payment.party || payment.name || 'Payment Entry'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {payment.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded flex items-center ${getStatusColor(payment.status, payment.docstatus)}`}>
                        {getStatusIcon(payment.status, payment.docstatus)}
                        <span className="ml-1">
                          {payment.docstatus === 2 ? 'Cancelled' :
                           payment.docstatus === 0 ? 'Draft' :
                           payment.docstatus === 1 ? 'Submitted' :
                           payment.status || payment.workflow_state || 'Unknown'}
                        </span>
                      </span>
                      {payment.payment_type && (
                        <span className={`px-2 py-0.5 text-xs rounded ${getPaymentTypeColor(payment.payment_type)}`}>
                          {payment.payment_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(payment.party || payment.party_name) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{payment.party_name || payment.party || 'Party'}</span>
                      {payment.party_type && (
                        <span className="text-xs text-gray-400 ml-2">({payment.party_type})</span>
                      )}
                    </div>
                  )}

                  {payment.posting_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Posted: {new Date(payment.posting_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {payment.sales_invoice && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Sales Invoice:</span>
                      <span className="block text-xs text-blue-600 mt-1">
                        {payment.sales_invoice}
                      </span>
                    </div>
                  )}

                  {(payment.paid_from || payment.paid_to) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600">
                        {payment.paid_from && (
                          <div className="flex items-center">
                            <BuildingLibraryIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-xs">{payment.paid_from}</span>
                          </div>
                        )}
                        {payment.paid_from && payment.paid_to && (
                          <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
                        )}
                        {payment.paid_to && (
                          <div className="flex items-center">
                            <BuildingLibraryIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-xs">{payment.paid_to}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {(payment.paid_amount || 0) > 0 && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex items-center text-sm font-medium text-red-800">
                          <span className="text-red-600 font-bold mr-2">₹</span>
                          Paid Amount
                        </div>
                        <div className="text-lg font-semibold text-red-600">
                          {formatCurrency(payment.paid_amount || 0)}
                        </div>
                      </div>
                    )}
                    {(payment.received_amount || 0) > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center text-sm font-medium text-green-800">
                          <span className="text-green-600 font-bold mr-2">₹</span>
                          Received Amount
                        </div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(payment.received_amount || 0)}
                        </div>
                      </div>
                    )}
                    {(payment.total_allocated_amount || 0) > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center text-sm font-medium text-blue-800">
                          <span className="text-blue-600 font-bold mr-2">₹</span>
                          Allocated Amount
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(payment.total_allocated_amount || 0)}
                        </div>
                      </div>
                    )}
                  </div>

                  {payment.mode_of_payment && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Payment Mode:</span> {payment.mode_of_payment}
                    </div>
                  )}

                  {(payment.reference_no || payment.reference_date) && (
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {payment.reference_no && (
                        <div>
                          <span className="font-medium">Ref No:</span> {payment.reference_no}
                        </div>
                      )}
                      {payment.reference_date && (
                        <div>
                          <span className="font-medium">Ref Date:</span> {new Date(payment.reference_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {payment.company && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Company:</span> {payment.company}
                    </div>
                  )}

                  {payment.remarks && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Remarks:</span>
                      <p className="text-xs text-gray-500 mt-1">{payment.remarks}</p>
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

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payment entries found.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentEntry;