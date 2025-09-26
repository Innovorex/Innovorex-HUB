import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents } from '../../hooks/useRoleBasedQuery';

interface StudentData {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  student_name: string;
  student_email_id: string;
  student_mobile_number: string;
  program: string;
  batch: string;
  enabled: number;
  enrollment_date: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  nationality: string;
  guardian_name: string;
  guardian_mobile_number: string;
  guardian_email_id: string;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentData | null;
  onSave: (data: Partial<StudentData>) => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, student, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    student_email_id: '',
    student_mobile_number: '',
    program: '',
    batch: '',
    date_of_birth: '',
    gender: '',
    guardian_name: '',
    guardian_mobile_number: '',
    guardian_email_id: '',
  });

  // Update form data when student prop changes
  React.useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        student_email_id: student.student_email_id || '',
        student_mobile_number: student.student_mobile_number || '',
        program: student.program || '',
        batch: student.batch || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        guardian_name: student.guardian_name || '',
        guardian_mobile_number: student.guardian_mobile_number || '',
        guardian_email_id: student.guardian_email_id || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        student_email_id: '',
        student_mobile_number: '',
        program: '',
        batch: '',
        date_of_birth: '',
        gender: '',
        guardian_name: '',
        guardian_mobile_number: '',
        guardian_email_id: '',
      });
    }
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {student ? 'Edit Student' : 'Add Student'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.student_email_id}
                  onChange={(e) => setFormData({ ...formData, student_email_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.student_mobile_number}
                  onChange={(e) => setFormData({ ...formData, student_mobile_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program
                </label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Program</option>
                  <option value="10 STD">10 STD</option>
                  <option value="9 STD">9 STD</option>
                  <option value="8 STD">8 STD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <input
                  type="text"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Mobile
                </label>
                <input
                  type="tel"
                  value={formData.guardian_mobile_number}
                  onChange={(e) => setFormData({ ...formData, guardian_mobile_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Email
                </label>
                <input
                  type="email"
                  value={formData.guardian_email_id}
                  onChange={(e) => setFormData({ ...formData, guardian_email_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {student ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface StudentProps {
  readOnly?: boolean;
}

const Student: React.FC<StudentProps> = ({ readOnly = false }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const instructorId = user?.instructorId || 'EDU-INS-2025-00002';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const queryClient = useQueryClient();

  // Fetch students from our new API endpoint
  const { data: studentsData, isLoading, error } = useStudents();

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<StudentData> & { id: string }) => {
      const response = await api.put(`/students/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Check if data contains the students list
      if (data && data.data) {
        queryClient.setQueryData(['students'], data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['students'] });
      }
      toast.success('Student updated successfully');
      setIsModalOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Failed to update student');
    },
  });

  const students = Array.isArray(studentsData) ? studentsData : [];

  const filteredStudents = students.filter((student: StudentData) =>
    student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_email_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStudent = (student: StudentData) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (data: Partial<StudentData>) => {
    if (selectedStudent) {
      // Include all existing data and override with new data
      updateStudentMutation.mutate({
        ...selectedStudent,
        ...data,
        id: selectedStudent.id
      });
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
        <p className="text-red-600">Error loading students. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage students from ERPNext ({students.length} total)</p>
        </div>
        <div className="text-sm text-gray-500">
          Note: Creating new students requires ERPNext user management setup
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student: StudentData, index: number) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <UserIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{student.student_email_id}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {student.program && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-2" />
                      <span>Program: {student.program}</span>
                    </div>
                  )}

                  {student.batch && (
                    <div className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      Batch: {student.batch}
                    </div>
                  )}

                  {student.student_mobile_number && (
                    <div className="text-sm text-gray-600">
                      Mobile: {student.student_mobile_number}
                    </div>
                  )}

                  <div className="flex items-center">
                    {student.enabled === 1 ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Active
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 text-sm">
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Inactive
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isTeacher && !readOnly && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditStudent(student)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Student"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No students found matching your search.</p>
        </div>
      )}

      {/* Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSave={handleSaveStudent}
      />
    </div>
  );
};

export default Student;
