import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface FeeScheduleData {
  name: string;
  fee_schedule_name: string;
  program: string;
  academic_year: string;
  academic_term: string;
  student_category: string;
  due_date: string;
  student_group: string;
  fee_structure: string;
  posting_date: string;
  disabled: number;
  docstatus: number;
  status: string;
  total_amount?: number;
}

const FeeSchedule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: schedulesData, isLoading, error } = useQuery({
    queryKey: ['fee-schedules'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Fee Schedule');
        console.log('Fee Schedule API response:', response);

        // Handle different response structures
        let scheduleData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          scheduleData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          scheduleData = response.data;
        } else if (response.data && response.data.message) {
          scheduleData = response.data.message;
        }

        console.log('Processed fee schedule data:', scheduleData);
        return scheduleData || [];
      } catch (error) {
        console.error('Fee Schedule API error:', error);
        return [];
      }
    },
  });

  // Get Sales Invoices for linking
  const { data: salesInvoicesData } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Sales Invoice');
        let invoiceData = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          invoiceData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          invoiceData = response.data;
        } else if (response.data && response.data.message) {
          invoiceData = response.data.message;
        }
        return invoiceData || [];
      } catch (error) {
        console.error('Sales Invoice API error:', error);
        return [];
      }
    },
  });

  const schedules = schedulesData || [];
  const salesInvoices = salesInvoicesData || [];

  // Helper function to find linked sales invoices for a fee schedule
  const getLinkedSalesInvoices = (scheduleId: string) => {
    return salesInvoices.filter((invoice: any) =>
      invoice.fee_schedule === scheduleId ||
      invoice.project === scheduleId ||
      invoice.remarks?.includes(scheduleId)
    );
  };

  const filteredSchedules = schedules.filter((schedule: FeeScheduleData) =>
    (schedule.fee_schedule_name || schedule.name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (schedule.program || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (schedule.academic_year || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (schedule.academic_term || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (schedule.student_category || '')?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading fee schedules. Please try again.</p>
      </div>
    );
  }

  const getDaysUntilDue = (dueDate: string) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (dueDate: string) => {
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil === null) return 'text-gray-600';
    if (daysUntil < 0) return 'text-red-600'; // Overdue
    if (daysUntil <= 7) return 'text-orange-600'; // Due soon
    return 'text-green-600'; // Future
  };

  const getDueDateStatus = (dueDate: string) => {
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil === null) return '';
    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
    return `Due in ${daysUntil} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Schedules</h1>
          <p className="text-gray-600 mt-1">Manage fee payment schedules and deadlines ({schedules.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Fee Schedule
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search fee schedules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSchedules.map((schedule: FeeScheduleData) => (
          <div key={schedule.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{schedule.fee_schedule_name || schedule.program || 'Fee Schedule'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {schedule.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {/* Show status based on docstatus: 0=Draft, 1=Submitted/Active, 2=Cancelled */}
                      {schedule.docstatus === 2 ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Cancelled
                        </span>
                      ) : schedule.docstatus === 1 ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          Active
                        </span>
                      ) : schedule.docstatus === 0 ? (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                          Draft
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                          Unknown
                        </span>
                      )}
                      {schedule.status && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {schedule.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {schedule.program && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{schedule.program}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {schedule.academic_year && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Year:</span> {schedule.academic_year}
                      </div>
                    )}
                    {schedule.academic_term && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Term:</span> {schedule.academic_term}
                      </div>
                    )}
                  </div>

                  {schedule.student_category && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Category:</span>
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {schedule.student_category}
                      </span>
                    </div>
                  )}

                  {schedule.student_group && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Group:</span> {schedule.student_group}
                    </div>
                  )}

                  {schedule.fee_structure && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Fee Structure:</span>
                      <span className="block text-xs text-blue-600 mt-1">
                        {schedule.fee_structure}
                      </span>
                    </div>
                  )}

                  {schedule.due_date && (
                    <div className={`p-3 rounded-lg border-l-4 ${
                      getDaysUntilDue(schedule.due_date) && getDaysUntilDue(schedule.due_date)! < 0
                        ? 'bg-red-50 border-red-400'
                        : getDaysUntilDue(schedule.due_date) && getDaysUntilDue(schedule.due_date)! <= 7
                        ? 'bg-orange-50 border-orange-400'
                        : 'bg-green-50 border-green-400'
                    }`}>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          Due: {new Date(schedule.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${getDueDateColor(schedule.due_date)}`}>
                        {getDueDateStatus(schedule.due_date)}
                      </div>
                    </div>
                  )}

                  {schedule.posting_date && (
                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Created: {new Date(schedule.posting_date).toLocaleDateString()}
                    </div>
                  )}

                  {/* Linked Sales Invoices */}
                  {getLinkedSalesInvoices(schedule.name).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center mb-2">
                        <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">Linked Sales Invoices</span>
                      </div>
                      <div className="space-y-1">
                        {getLinkedSalesInvoices(schedule.name).map((invoice: any) => (
                          <Link
                            key={invoice.name}
                            to={`/admin/sales-invoice`}
                            className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs hover:bg-blue-100 transition-colors"
                          >
                            <div>
                              <span className="font-medium text-blue-700">{invoice.name}</span>
                              <span className="text-gray-600 ml-2">
                                {invoice.status} - ₹{(invoice.grand_total || 0).toLocaleString()}
                              </span>
                            </div>
                            <ArrowTopRightOnSquareIcon className="h-3 w-3 text-blue-500" />
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

      {filteredSchedules.length === 0 && (
        <div className="text-center py-12">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No fee schedules found.</p>
        </div>
      )}
    </div>
  );
};

export default FeeSchedule;