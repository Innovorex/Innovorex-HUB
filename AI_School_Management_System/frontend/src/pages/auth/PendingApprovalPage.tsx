// pages/auth/PendingApprovalPage.tsx - Account pending approval page
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const PendingApprovalPage: React.FC = () => {
  const { user, logout } = useAuth();

  const getStatusIcon = () => {
    switch (user?.status) {
      case 'pending':
        return <ClockIcon className="h-16 w-16 text-orange-500" />;
      case 'suspended':
        return <ExclamationCircleIcon className="h-16 w-16 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-16 w-16 text-green-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (user?.status) {
      case 'pending':
        return {
          title: 'Account Pending Approval',
          message: 'Your account has been created successfully and is currently under review by our administrators. You will receive an email notification once your account is approved.',
          color: 'orange'
        };
      case 'suspended':
        return {
          title: 'Account Suspended',
          message: 'Your account has been temporarily suspended. Please contact the school administration for more information.',
          color: 'red'
        };
      default:
        return {
          title: 'Account Status Unknown',
          message: 'There seems to be an issue with your account status. Please contact support.',
          color: 'gray'
        };
    }
  };

  const status = getStatusMessage();

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
          <h2 className="text-2xl font-bold text-gray-900">AI School Management</h2>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-sm border border-gray-300 rounded-lg sm:px-10"
        >
          <div className="text-center">
            {/* Status Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-6"
            >
              {getStatusIcon()}
            </motion.div>

            {/* Status Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {status.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {status.message}
              </p>
            </motion.div>

            {/* User Information */}
            {user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 rounded-lg p-4 mb-6 text-left"
              >
                <h4 className="font-medium text-gray-900 mb-3">Account Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Name:</span>
                    <span className="text-gray-600">{user.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Email:</span>
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Role:</span>
                    <span className="text-gray-600 capitalize">{user.role}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Next Steps */}
            {user?.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
              >
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <div className="text-sm text-blue-800 text-left space-y-1">
                  <p>• An administrator will review your registration</p>
                  <p>• You'll receive an email notification when approved</p>
                  <p>• Approval typically takes 1-2 business days</p>
                  <p>• You can then log in and access your dashboard</p>
                </div>
              </motion.div>
            )}

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 rounded-lg p-4 mb-6"
            >
              <h4 className="font-medium text-gray-900 mb-3">Need Help?</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  <span>support@school.edu</span>
                </div>
                <div className="flex items-center justify-center">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <button
                onClick={logout}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign Out
              </button>

              <Link
                to="/auth/login"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Back to Login
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center text-xs text-gray-500"
      >
        <p>© 2024 AI School Management System. All rights reserved.</p>
      </motion.div>
    </div>
  );
};

export default PendingApprovalPage;