// pages/auth/RegisterPage.tsx - ERPNext-style registration page
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'teacher' | 'parent';
  phone?: string;
  additional_info?: {
    student_id?: string;
    grade?: string;
    employee_id?: string;
    department?: string;
    child_name?: string;
  };
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phone: '',
    additional_info: {}
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Registration successful! Please wait for admin approval.');
      navigate('/auth/login');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registrationData } = formData;
    registerMutation.mutate(registrationData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('additional_')) {
      const field = name.replace('additional_', '');
      setFormData(prev => ({
        ...prev,
        additional_info: {
          ...prev.additional_info,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const getRoleSpecificFields = () => {
    switch (formData.role) {
      case 'student':
        return (
          <>
            <div>
              <label htmlFor="additional_student_id" className="block text-sm font-medium text-gray-700">
                Student ID (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="additional_student_id"
                  name="additional_student_id"
                  type="text"
                  value={formData.additional_info?.student_id || ''}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your student ID"
                />
              </div>
            </div>
            <div>
              <label htmlFor="additional_grade" className="block text-sm font-medium text-gray-700">
                Grade/Class (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="additional_grade"
                  name="additional_grade"
                  type="text"
                  value={formData.additional_info?.grade || ''}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your grade/class"
                />
              </div>
            </div>
          </>
        );

      case 'teacher':
        return (
          <>
            <div>
              <label htmlFor="additional_employee_id" className="block text-sm font-medium text-gray-700">
                Employee ID (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="additional_employee_id"
                  name="additional_employee_id"
                  type="text"
                  value={formData.additional_info?.employee_id || ''}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your employee ID"
                />
              </div>
            </div>
            <div>
              <label htmlFor="additional_department" className="block text-sm font-medium text-gray-700">
                Department (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="additional_department"
                  name="additional_department"
                  type="text"
                  value={formData.additional_info?.department || ''}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your department"
                />
              </div>
            </div>
          </>
        );

      case 'parent':
        return (
          <div>
            <label htmlFor="additional_child_name" className="block text-sm font-medium text-gray-700">
              Child's Name (Optional)
            </label>
            <div className="mt-1">
              <input
                id="additional_child_name"
                name="additional_child_name"
                type="text"
                value={formData.additional_info?.child_name || ''}
                onChange={handleInputChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter your child's name"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <AcademicCapIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Join Our School</h2>
          <p className="mt-2 text-sm text-gray-600">Create your account to get started</p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-sm border border-gray-300 rounded-lg sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I am a <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Role-specific fields */}
            {getRoleSpecificFields()}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit button */}
            <div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={registerMutation.isPending}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </motion.button>
            </div>

            {/* Error message */}
            {registerMutation.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md bg-red-50 p-4 border border-red-200"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Registration Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {(registerMutation.error as any)?.response?.data?.message || 'An error occurred during registration.'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success message */}
            {registerMutation.isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md bg-green-50 p-4 border border-green-200"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Registration Successful!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      Your account has been created. Please wait for admin approval before logging in.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </form>

          {/* Sign in link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Account Approval</h4>
          <p className="text-xs text-blue-700">
            All new registrations require approval from a school administrator.
            You will receive an email notification once your account is approved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;