import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  UserIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface SalesInvoiceData {
  name: string;
  title?: string;
  customer?: string;
  customer_name?: string;
  posting_date?: string;
  due_date?: string;
  grand_total?: number;
  total?: number;
  base_grand_total?: number;
  outstanding_amount?: number;
  status?: string;
  docstatus?: number;
  is_return?: number;
  company?: string;
  cost_center?: string;
  project?: string;
  remarks?: string;
  fee_schedule?: string;
  academic_year?: string;
  academic_term?: string;
  // Additional ERPNext fields that might be present
  workflow_state?: string;
  party?: string;
  party_name?: string;
  base_total?: number;
  net_total?: number;
}

const SalesInvoice: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: invoicesData, isLoading, error } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Sales Invoice');
        console.log('Sales Invoice API response:', response);

        let invoiceData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          invoiceData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          invoiceData = response.data;
        } else if (response.data && response.data.message) {
          invoiceData = response.data.message;
        }

        console.log('Processed sales invoice data:', invoiceData);
        // Log first item to see actual field structure
        if (invoiceData && invoiceData.length > 0) {
          console.log('First invoice fields:', Object.keys(invoiceData[0]));
          console.log('First invoice data:', invoiceData[0]);
        }
        return invoiceData || [];
      } catch (error) {
        console.error('Sales Invoice API error:', error);
        return [];
      }
    },
  });

  // Get Payment Entries for linking
  const { data: paymentEntriesData } = useQuery({
    queryKey: ['payment-entries'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Payment Entry');
        let paymentData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          paymentData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          paymentData = response.data;
        } else if (response.data && response.data.message) {
          paymentData = response.data.message;
        }
        return paymentData || [];
      } catch (error) {
        console.error('Payment Entry API error:', error);
        return [];
      }
    },
  });

  const invoices = invoicesData || [];
  const paymentEntries = paymentEntriesData || [];

  // Helper function to find linked payment entries for a sales invoice
  const getLinkedPaymentEntries = (invoiceId: string) => {
    return paymentEntries.filter((payment: any) =>
      payment.sales_invoice === invoiceId ||
      payment.reference_no === invoiceId ||
      payment.remarks?.includes(invoiceId)
    );
  };

  const filteredInvoices = invoices.filter((invoice: SalesInvoiceData) =>
    (invoice.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.customer || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.customer_name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.fee_schedule || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading sales invoices. Please try again.</p>
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
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'unpaid':
        return 'bg-red-100 text-red-700';
      case 'partly paid':
        return 'bg-orange-100 text-orange-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string, docstatus: number) => {
    if (docstatus === 2) return <ExclamationTriangleIcon className="h-4 w-4" />;
    if (docstatus === 0) return <ExclamationTriangleIcon className="h-4 w-4" />;

    switch (status?.toLowerCase()) {
      case 'paid':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'unpaid':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'partly paid':
        return <BanknotesIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
          <p className="text-gray-600 mt-1">Manage fee-related sales invoices ({invoices.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Sales Invoice
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search sales invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInvoices.map((invoice: SalesInvoiceData) => (
          <div key={invoice.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {invoice.title || invoice.customer_name || invoice.party_name || invoice.customer || invoice.party || invoice.name || 'Sales Invoice'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {invoice.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded flex items-center ${getStatusColor(invoice.status, invoice.docstatus)}`}>
                        {getStatusIcon(invoice.status, invoice.docstatus)}
                        <span className="ml-1">
                          {invoice.docstatus === 2 ? 'Cancelled' :
                           invoice.docstatus === 0 ? 'Draft' :
                           invoice.docstatus === 1 ? 'Submitted' :
                           invoice.status || invoice.workflow_state || 'Unknown'}
                        </span>
                      </span>
                      {invoice.is_return === 1 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                          Return
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(invoice.customer || invoice.customer_name || invoice.party || invoice.party_name) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{invoice.customer_name || invoice.party_name || invoice.customer || invoice.party || 'Customer'}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {invoice.posting_date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Posted: {new Date(invoice.posting_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {invoice.due_date && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Due:</span> {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {invoice.fee_schedule && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Fee Schedule:</span>
                      <span className="block text-xs text-blue-600 mt-1">
                        {invoice.fee_schedule}
                      </span>
                    </div>
                  )}

                  {(invoice.academic_year || invoice.academic_term) && (
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {invoice.academic_year && (
                        <div>
                          <span className="font-medium">Year:</span> {invoice.academic_year}
                        </div>
                      )}
                      {invoice.academic_term && (
                        <div>
                          <span className="font-medium">Term:</span> {invoice.academic_term}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center text-sm font-medium text-green-800">
                        <span className="text-green-600 font-bold mr-2">₹</span>
                        Total Amount
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(invoice.grand_total || invoice.total || invoice.base_grand_total || invoice.net_total || invoice.base_total || 0)}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      (invoice.outstanding_amount || 0) > 0 ? 'bg-red-50' : 'bg-green-50'
                    }`}>
                      <div className={`flex items-center text-sm font-medium ${
                        (invoice.outstanding_amount || 0) > 0 ? 'text-red-800' : 'text-green-800'
                      }`}>
                        <span className={`font-bold mr-2 ${
                          (invoice.outstanding_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>₹</span>
                        Outstanding
                      </div>
                      <div className={`text-lg font-semibold ${
                        (invoice.outstanding_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(invoice.outstanding_amount || 0)}
                      </div>
                    </div>
                  </div>

                  {invoice.company && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Company:</span> {invoice.company}
                    </div>
                  )}

                  {invoice.remarks && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Remarks:</span>
                      <p className="text-xs text-gray-500 mt-1">{invoice.remarks}</p>
                    </div>
                  )}

                  {/* Linked Payment Entries */}
                  {getLinkedPaymentEntries(invoice.name).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center mb-2">
                        <LinkIcon className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm font-medium text-gray-700">Linked Payment Entries</span>
                      </div>
                      <div className="space-y-1">
                        {getLinkedPaymentEntries(invoice.name).map((payment: any) => (
                          <Link
                            key={payment.name}
                            to={`/admin/payment-entry`}
                            className="flex items-center justify-between p-2 bg-green-50 rounded text-xs hover:bg-green-100 transition-colors"
                          >
                            <div>
                              <span className="font-medium text-green-700">{payment.name}</span>
                              <span className="text-gray-600 ml-2">
                                {payment.payment_type} - ₹{(payment.received_amount || payment.paid_amount || 0).toLocaleString()}
                              </span>
                            </div>
                            <ArrowTopRightOnSquareIcon className="h-3 w-3 text-green-500" />
                          </Link>
                        ))}
                      </div>
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

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No sales invoices found.</p>
        </div>
      )}
    </div>
  );
};

export default SalesInvoice;