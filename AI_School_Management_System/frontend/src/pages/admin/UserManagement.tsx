// UserManagement.tsx - Comprehensive User Management Interface with CRUD Operations
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { syncService } from '../../services/syncService';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  student_name?: string;
  employee_name?: string;
  email: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  type?: string;
  status?: string;
  assigned_classes?: string[];
  assigned_subjects?: string[];
  program?: string;
  department?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  blood_group?: string;
  employee_id?: string;
  guardian_name?: string;
  student_category?: string;
  student_batch_name?: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  department?: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  department?: string;
}

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form data
  const [formData, setFormData] = useState<Partial<User>>({
    role: 'student',
    status: 'active',
    gender: 'Male'
  });

  // Fetch all users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users', filterRole, filterStatus, filterProgram, filterBatch, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterProgram !== 'all') params.append('program', filterProgram);
      if (filterBatch !== 'all') params.append('batch', filterBatch);
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/users/all?${params}`);
      return response.data;
    }
  });

  // Fetch programs
  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get('/programs');
      return response.data;
    }
  });

  // Fetch student groups
  const { data: studentGroups = [] } = useQuery({
    queryKey: ['student-groups'],
    queryFn: async () => {
      const response = await api.get('/student-groups');
      return response.data;
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      // First create in local system
      const response = await api.post('/users/create', userData);

      // Then sync to ERPNext
      const syncData = syncService.prepareUserForSync({
        ...userData,
        id: response.data.id
      });
      await syncService.syncUser(syncData);

      return response.data;
    },
    onSuccess: () => {
      toast.success('User created and synced to ERPNext successfully');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      // First update in local system
      const response = await api.put(`/users/${id}`, data);

      // Then sync to ERPNext
      const syncData = syncService.prepareUserForSync({
        ...data,
        id
      });
      await syncService.syncUser(syncData);

      return response.data;
    },
    onSuccess: async () => {
      toast.success('User updated and synced to ERPNext successfully');
      // Force immediate refetch of users from backend
      await queryClient.invalidateQueries({ queryKey: ['all-users'] });
      await queryClient.refetchQueries({ queryKey: ['all-users'] });
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the cache with the new data if provided
      if (data && data.data) {
        queryClient.setQueryData(['all-users'], { users: data.data });
      } else {
        queryClient.invalidateQueries({ queryKey: ['all-users'] });
      }
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  const users = usersData?.users || [];

  // Get unique values for filters
  const allBatches = [...new Set(studentGroups.map(g => g.batch).filter(Boolean))].sort();
  const activeFiltersCount = [filterRole, filterStatus, filterProgram, filterBatch]
    .filter(f => f !== 'all').length;

  const clearFilters = () => {
    setFilterRole('all');
    setFilterStatus('all');
    setFilterProgram('all');
    setFilterBatch('all');
    setSearchTerm('');
  };

  const resetForm = () => {
    setFormData({
      role: 'student',
      status: 'active',
      gender: 'Male'
    });
  };

  const handleAddUser = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || user.name?.split(' ')[0] || '',
      last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status || 'active',
      gender: user.gender || 'Male',
      date_of_birth: user.date_of_birth,
      program: user.program,
      department: user.department,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      blood_group: user.blood_group,
      employee_id: user.employee_id
    });
    setShowEditModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        data: formData
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const exportToCSV = () => {
    const csvData = users.map(user => ({
      Name: getUserDisplayName(user),
      ID: user.id,
      Email: user.email,
      Role: user.role,
      Status: user.status || 'Active',
      Program: user.program || 'N/A',
      Department: user.department || 'N/A'
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Users exported successfully');
  };

  const getUserDisplayName = (user: User) => {
    return user.student_name || user.employee_name || user.name ||
           `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'parent': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users, assign classes and subjects</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add User</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={users.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => refetchUsers()}
            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'student').length}
              </div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'teacher').length}
              </div>
              <div className="text-sm text-gray-600">Total Teachers</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {programs.length}
              </div>
              <div className="text-sm text-gray-600">Programs</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {studentGroups.length}
              </div>
              <div className="text-sm text-gray-600">Student Groups</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="parent">Parents</option>
            </select>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${
                  showAdvancedFilters ? 'rotate-180' : ''
                }`}
              />
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program/Class
                </label>
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={filterRole === 'teacher' || filterRole === 'admin'}
                >
                  <option value="all">All Programs</option>
                  {programs.map((program: Program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch/Section
                </label>
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={filterRole === 'teacher' || filterRole === 'admin'}
                >
                  <option value="all">All Batches</option>
                  {allBatches.map((batch: string) => (
                    <option key={batch} value={batch}>
                      Batch {batch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {users.length} users found
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => refetchUsers()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classes/Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role === 'student' ? (
                        user.assigned_classes?.join(', ') || user.program || 'None'
                      ) : (
                        user.department || 'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-gray-600 hover:text-gray-800 p-1"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
            </div>
            <form onSubmit={handleSubmitAdd} className="p-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={formData.middle_name || ''}
                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        required
                        value={formData.role || 'student'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                        <option value="parent">Parent</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.gender || 'Male'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Blood Group
                      </label>
                      <select
                        value={formData.blood_group || ''}
                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Address Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={formData.pincode || ''}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic/Professional Information Section */}
                {formData.role === 'student' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Academic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Program/Class
                        </label>
                        <select
                          value={formData.program || ''}
                          onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Program</option>
                          {programs.map((program: Program) => (
                            <option key={program.id} value={program.name}>
                              {program.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch/Section
                        </label>
                        <input
                          type="text"
                          value={formData.student_batch_name || ''}
                          onChange={(e) => setFormData({ ...formData, student_batch_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Student Category
                        </label>
                        <select
                          value={formData.student_category || 'General'}
                          onChange={(e) => setFormData({ ...formData, student_category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="General">General</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="OBC">OBC</option>
                          <option value="EWS">EWS</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'teacher' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Professional Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={formData.employee_id || ''}
                          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'parent' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Guardian Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relation Type
                        </label>
                        <select
                          value={formData.relation_type || ''}
                          onChange={(e) => setFormData({ ...formData, relation_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Occupation
                        </label>
                        <input
                          type="text"
                          value={formData.occupation || ''}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Annual Income
                        </label>
                        <input
                          type="text"
                          value={formData.annual_income || ''}
                          onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Linked Student(s)
                        </label>
                        <input
                          type="text"
                          value={formData.linked_students || ''}
                          onChange={(e) => setFormData({ ...formData, linked_students: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter student IDs separated by comma"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* System Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">System Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status || 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={formData.middle_name || ''}
                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        required
                        value={formData.role || 'student'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                        <option value="parent">Parent</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.gender || 'Male'}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Blood Group
                      </label>
                      <select
                        value={formData.blood_group || ''}
                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Address Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={formData.pincode || ''}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic/Professional Information Section */}
                {formData.role === 'student' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Academic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Program/Class
                        </label>
                        <select
                          value={formData.program || ''}
                          onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Program</option>
                          {programs.map((program: Program) => (
                            <option key={program.id} value={program.name}>
                              {program.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch/Section
                        </label>
                        <input
                          type="text"
                          value={formData.student_batch_name || ''}
                          onChange={(e) => setFormData({ ...formData, student_batch_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Student Category
                        </label>
                        <select
                          value={formData.student_category || 'General'}
                          onChange={(e) => setFormData({ ...formData, student_category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="General">General</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="OBC">OBC</option>
                          <option value="EWS">EWS</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'teacher' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Professional Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={formData.employee_id || ''}
                          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'parent' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Guardian Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relation Type
                        </label>
                        <select
                          value={formData.relation_type || ''}
                          onChange={(e) => setFormData({ ...formData, relation_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Occupation
                        </label>
                        <input
                          type="text"
                          value={formData.occupation || ''}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Annual Income
                        </label>
                        <input
                          type="text"
                          value={formData.annual_income || ''}
                          onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Linked Student(s)
                        </label>
                        <input
                          type="text"
                          value={formData.linked_students || ''}
                          onChange={(e) => setFormData({ ...formData, linked_students: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter student IDs separated by comma"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* System Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">System Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status || 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal - Comprehensive Details */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">User Details - Complete Profile</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Basic Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.id || selectedUser.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">First Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.first_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Middle Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.middle_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.last_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{getUserDisplayName(selectedUser)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Role</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email || selectedUser.student_email_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mobile Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || selectedUser.student_mobile_number || selectedUser.mobile_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Gender</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.date_of_birth || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Blood Group</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.blood_group || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Address Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Address Line 1</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.address || selectedUser.address_line_1 || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Address Line 2</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.address_line_2 || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">City</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">State</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Country</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Pincode</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.pincode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Academic/Professional Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                  {selectedUser.role === 'student' ? 'Academic Information' : 'Professional Information'}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {selectedUser.role === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Program</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.program || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Batch</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.student_batch_name || selectedUser.batch || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Category</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.student_category || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Admission Date</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.joining_date || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Student Group</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.student_group || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Roll Number</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.roll_number || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {selectedUser.role === 'teacher' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Employee ID</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.employee_id || selectedUser.employee || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Department</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.department || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Designation</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.designation || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Joining Date</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.joining_date || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Qualification</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.qualification || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Experience</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.experience || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {selectedUser.role === 'parent' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Occupation</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.occupation || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Company</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.company || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Work Address</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.work_address || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Annual Income</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.annual_income || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Education</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.education || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Relationship</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.relationship || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* System Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">System Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.status === 'active' || selectedUser.enabled === 1
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.status || (selectedUser.enabled ? 'Active' : 'Inactive')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.owner || selectedUser.created_by || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created On</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.creation || selectedUser.created_at || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Modified By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.modified_by || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Modified On</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.modified || selectedUser.updated_at || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ERPNext ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.name || selectedUser.erpnextId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Fields - Display any other fields */}
              {Object.keys(selectedUser).filter(key =>
                !['id', 'name', 'first_name', 'middle_name', 'last_name', 'email', 'phone', 'role',
                 'status', 'gender', 'date_of_birth', 'blood_group', 'address', 'city', 'state',
                 'pincode', 'program', 'department', 'created_at', 'updated_at', 'password'].includes(key)
              ).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Additional Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(selectedUser).filter(([key]) =>
                      !['id', 'name', 'first_name', 'middle_name', 'last_name', 'email', 'phone', 'role',
                       'status', 'gender', 'date_of_birth', 'blood_group', 'address', 'city', 'state',
                       'pincode', 'program', 'department', 'created_at', 'updated_at', 'password',
                       'student_email_id', 'student_mobile_number', 'address_line_1', 'address_line_2',
                       'student_batch_name', 'student_category', 'employee_id', 'employee', 'mobile_number',
                       'enabled', 'owner', 'creation', 'modified', 'modified_by', 'erpnextId'].includes(key)
                    ).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-500">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className="mt-1 text-sm text-gray-900">{value?.toString() || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit User
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete <strong>{getUserDisplayName(selectedUser)}</strong>? This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteUserMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;