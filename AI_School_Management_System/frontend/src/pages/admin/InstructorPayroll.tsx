import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  IdentificationIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface SalarySlipData {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  designation: string;
  branch: string;
  start_date: string;
  end_date: string;
  posting_date: string;
  salary_structure: string;
  total_working_days: number;
  payment_days: number;
  gross_pay: number;
  total_deduction: number;
  net_pay: number;
  rounded_total: number;
  company: string;
  status: string;
  salary_slip_based_on_timesheet: number;
  total_loan_repayment: number;
  earnings: any[];
  deductions: any[];
}

interface PayrollEntryData {
  name: string;
  posting_date: string;
  company: string;
  department: string;
  branch: string;
  designation: string;
  payroll_frequency: string;
  start_date: string;
  end_date: string;
  total_employees: number;
  total_salary: number;
  status: string;
}

const InstructorPayroll: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewType, setViewType] = useState<'salary-slips' | 'payroll-entries'>('salary-slips');
  const [instructorEmployeeIds, setInstructorEmployeeIds] = useState<string[]>([]);

  // Fetch instructor data to get employee IDs
  const { data: instructorsData } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const response = await api.get('/frappe/Instructor');
      return response.data.data || response.data || [];
    },
  });

  // Extract employee IDs from instructor data
  useEffect(() => {
    if (instructorsData) {
      const employeeIds = instructorsData
        .map((instructor: any) => instructor.employee)
        .filter((id: string) => id && id !== 'N/A');
      setInstructorEmployeeIds(employeeIds);
    }
  }, [instructorsData]);

  // Fetch Salary Slips
  const { data: salarySlipData, isLoading: slipsLoading, error: slipsError } = useQuery({
    queryKey: ['salary-slips'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Salary Slip');
        console.log('Salary Slip API response:', response);

        let records = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          records = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          records = response.data;
        }

        // Filter to only include instructor salary slips
        const instructorSlips = records.filter((slip: any) =>
          instructorEmployeeIds.includes(slip.employee)
        );

        return instructorSlips || [];
      } catch (error) {
        console.error('Salary Slip API error:', error);
        return [];
      }
    },
    enabled: instructorEmployeeIds.length > 0,
  });

  // Fetch Payroll Entries
  const { data: payrollData, isLoading: payrollLoading, error: payrollError } = useQuery({
    queryKey: ['payroll-entries'],
    queryFn: async () => {
      try {
        const response = await api.get('/frappe/Payroll Entry');
        console.log('Payroll Entry API response:', response);

        let records = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          records = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          records = response.data;
        }

        return records || [];
      } catch (error) {
        console.error('Payroll Entry API error:', error);
        return [];
      }
    },
  });

  const salarySlips = salarySlipData || [];
  const payrollEntries = payrollData || [];

  // Filter salary slips
  const filteredSlips = salarySlips.filter((slip: SalarySlipData) => {
    const matchesSearch = searchTerm === '' || (
      slip.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchesDate = true;
    if (selectedMonth || selectedYear) {
      const slipDate = new Date(slip.start_date || slip.posting_date);
      if (selectedMonth && slipDate.getMonth() !== parseInt(selectedMonth) - 1) {
        matchesDate = false;
      }
      if (selectedYear && slipDate.getFullYear() !== parseInt(selectedYear)) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Filter payroll entries
  const filteredPayroll = payrollEntries.filter((entry: PayrollEntryData) => {
    const matchesSearch = searchTerm === '' || (
      entry.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchesDate = true;
    if (selectedMonth || selectedYear) {
      const entryDate = new Date(entry.start_date || entry.posting_date);
      if (selectedMonth && entryDate.getMonth() !== parseInt(selectedMonth) - 1) {
        matchesDate = false;
      }
      if (selectedYear && entryDate.getFullYear() !== parseInt(selectedYear)) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const isLoading = viewType === 'salary-slips' ? slipsLoading : payrollLoading;
  const error = viewType === 'salary-slips' ? slipsError : payrollError;

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
        <p className="text-red-600">Error loading payroll data. Please try again.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'draft':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructor Payroll</h1>
          <p className="text-gray-600 mt-1">
            Manage instructor salary and payroll
            {viewType === 'salary-slips' ?
              ` (${filteredSlips.length} salary slips)` :
              ` (${filteredPayroll.length} payroll entries)`
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType('salary-slips')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              viewType === 'salary-slips'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Salary Slips
          </button>
          <button
            onClick={() => setViewType('payroll-entries')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              viewType === 'payroll-entries'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <BanknotesIcon className="h-5 w-5 mr-2" />
            Payroll Entries
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee, name, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </div>

      {/* Salary Slips View */}
      {viewType === 'salary-slips' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlips.map((slip: SalarySlipData) => (
            <div key={slip.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{slip.employee_name}</h3>
                      <p className="text-sm text-gray-500">{slip.designation}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">{slip.employee}</span>
                    </div>
                    {slip.department && (
                      <div className="text-sm text-gray-600">
                        Dept: {slip.department}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(slip.start_date).toLocaleDateString()} - {new Date(slip.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(slip.status || 'Draft')}`}>
                  {slip.status || 'Draft'}
                </span>
              </div>

              {/* Salary Details */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Working Days:</span>
                  <span className="font-medium">{slip.payment_days || 0} / {slip.total_working_days || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gross Pay:</span>
                  <span className="font-medium text-green-600">{formatCurrency(slip.gross_pay)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deductions:</span>
                  <span className="font-medium text-red-600">{formatCurrency(slip.total_deduction)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Net Pay:</span>
                  <span className="font-bold text-lg text-blue-600">{formatCurrency(slip.net_pay)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 mt-4 pt-4 border-t">
                <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm">
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  Print
                </button>
                <button className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors text-sm">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payroll Entries View */}
      {viewType === 'payroll-entries' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredPayroll.map((entry: PayrollEntryData) => (
              <li key={entry.name}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BanknotesIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            Payroll for {new Date(entry.start_date).toLocaleDateString()} - {new Date(entry.end_date).toLocaleDateString()}
                          </p>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          {entry.department && (
                            <span className="text-sm text-gray-600">Dept: {entry.department}</span>
                          )}
                          {entry.payroll_frequency && (
                            <span className="text-sm text-gray-600">Frequency: {entry.payroll_frequency}</span>
                          )}
                          <span className="text-sm text-gray-600">Employees: {entry.total_employees || 0}</span>
                          <span className="text-sm font-medium text-green-600">
                            Total: {formatCurrency(entry.total_salary)}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Posted: {new Date(entry.posting_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <CalculatorIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty State */}
      {((viewType === 'salary-slips' && filteredSlips.length === 0) ||
        (viewType === 'payroll-entries' && filteredPayroll.length === 0)) && (
        <div className="text-center py-12">
          <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {viewType === 'salary-slips'
              ? 'No salary slips found for instructors.'
              : 'No payroll entries found.'}
          </p>
          {instructorEmployeeIds.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No instructors have Employee IDs assigned in ERPNext.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructorPayroll;