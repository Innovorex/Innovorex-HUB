import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface AssessmentPlanData {
  name: string;
  assessment_name: string;
  program: string;
  course: string;
  assessment_group: string;
  schedule_date: string;
  from_time: string;
  to_time: string;
  room: string;
  examiner: string;
  supervisor: string;
  maximum_assessment_score: number;
  grading_scale: string;
  assessment_criteria: string;
  disabled: number;
}

const AssessmentPlan: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: plansData, isLoading, error } = useQuery({
    queryKey: ['assessment-plans'],
    queryFn: async () => {
      const response = await api.get('/frappe/Assessment Plan');
      return response.data.data || [];
    },
  });

  const plans = plansData || [];

  const filteredPlans = plans.filter((plan: AssessmentPlanData) =>
    plan.assessment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.assessment_group?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.examiner?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading assessment plans. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Plans</h1>
          <p className="text-gray-600 mt-1">Manage assessment schedules and plans ({plans.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Assessment Plan
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search assessment plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPlans.map((plan: AssessmentPlanData) => (
          <div key={plan.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.assessment_name}</h3>
                    <div className="flex items-center mt-1">
                      {plan.disabled === 0 ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.program && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{plan.program}</span>
                    </div>
                  )}

                  {plan.course && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Course:</span> {plan.course}
                    </div>
                  )}

                  {plan.assessment_group && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Group:</span> {plan.assessment_group}
                    </div>
                  )}

                  {plan.schedule_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{new Date(plan.schedule_date).toLocaleDateString()}</span>
                      {(plan.from_time || plan.to_time) && (
                        <span className="ml-2 flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {plan.from_time && plan.to_time
                            ? `${plan.from_time} - ${plan.to_time}`
                            : plan.from_time || plan.to_time}
                        </span>
                      )}
                    </div>
                  )}

                  {plan.room && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Room:</span> {plan.room}
                    </div>
                  )}

                  {plan.examiner && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Examiner:</span> {plan.examiner}
                    </div>
                  )}

                  {plan.supervisor && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Supervisor:</span> {plan.supervisor}
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {plan.maximum_assessment_score && (
                        <div>
                          <span className="font-medium text-gray-700">Max Score:</span>
                          <span className="block text-gray-600">{plan.maximum_assessment_score}</span>
                        </div>
                      )}
                      {plan.grading_scale && (
                        <div>
                          <span className="font-medium text-gray-700">Grading Scale:</span>
                          <span className="block text-gray-600 text-xs">{plan.grading_scale}</span>
                        </div>
                      )}
                    </div>
                    {plan.assessment_criteria && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-700 text-sm">Criteria:</span>
                        <span className="block text-gray-600 text-xs">{plan.assessment_criteria}</span>
                      </div>
                    )}
                  </div>
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

      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No assessment plans found.</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentPlan;