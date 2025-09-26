// pages/common/NotFoundPage.tsx - 404 error page
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const NotFoundPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const getHomeRoute = () => {
    if (!isAuthenticated || !user) {
      return '/auth/login';
    }

    const roleRoutes = {
      student: '/student',
      teacher: '/teacher',
      parent: '/parent',
      admin: '/admin'
    };

    return roleRoutes[user.role] || '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-12 px-4 shadow-sm border border-gray-300 rounded-lg sm:px-10"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ExclamationTriangleIcon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Page Not Found
              </h2>
              <p className="text-gray-600 mb-8">
                Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Link
                to={getHomeRoute()}
                className="w-full inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>

              <button
                onClick={() => window.history.back()}
                className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Go Back
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-xs text-gray-500"
            >
              If you believe this is an error, please contact support.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;