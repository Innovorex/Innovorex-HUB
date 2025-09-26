// pages/admin/KnowledgeBase.tsx - Knowledge Base with Document Management and AI Chat
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FolderOpenIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  AcademicCapIcon,
  BookOpenIcon,
  XMarkIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  program_id: string;
  program_name: string;
  course_id: string;
  course_name: string;
  uploaded_by: string;
  uploaded_at: string;
  status: 'pending' | 'processed' | 'failed';
  download_url?: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  program?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  documents?: Document[];
}

const KnowledgeBase: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State Management
  const [activeTab, setActiveTab] = useState<'documents' | 'ai-chat'>('documents');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Fetch Programs
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get('/programs');
      // Ensure response.data is an array
      return Array.isArray(response.data) ? response.data : [];
    }
  });

  // Fetch Courses based on selected program
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses', selectedProgram],
    queryFn: async () => {
      // Pass program as query parameter if selected
      const url = selectedProgram ? `/courses?program=${selectedProgram}` : '/courses';
      const response = await api.get(url);
      // Ensure response.data is an array
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: true
  });

  // Fetch Documents
  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<Document[]>({
    queryKey: ['kb-documents', selectedProgram, selectedCourse, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProgram) params.append('program_id', selectedProgram);
      if (selectedCourse) params.append('course_id', selectedCourse);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/kb/documents?${params}`);
      // API returns { success: true, data: [...] }
      const documents = response.data?.data || response.data || [];
      return Array.isArray(documents) ? documents : [];
    }
  });

  // Upload Document Mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // api.post now automatically detects FormData and handles headers correctly
      const response = await api.post('/kb/documents/upload', formData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['kb-documents'] });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload document');
      setUploadProgress(0);
    }
  });

  // Delete Document Mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.delete(`/kb/documents/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['kb-documents'] });
    },
    onError: () => {
      toast.error('Failed to delete document');
    }
  });

  // Send Chat Message
  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedCourse) {
      toast.error('Please select a course and enter a message');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await api.post('/kb/chat/message', {
        message: inputMessage,
        program_id: selectedProgram,
        course_id: selectedCourse,
        session_id: user?.id
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date().toISOString(),
        documents: response.data.sources
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response from AI');
      setChatMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = () => {
    if (!uploadFile || !selectedProgram || !selectedCourse) {
      toast.error('Please select a file, program, and course');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('program_id', selectedProgram);
    formData.append('course_id', selectedCourse);
    formData.append('uploaded_by', user?.id || '');

    uploadDocumentMutation.mutate(formData);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle View Document
  const handleViewDocument = async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/kb/documents/${documentId}/view`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('View failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');

      // Clean up the URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to view document');
    }
  };

  // Handle Download Document
  const handleDownloadDocument = async (documentId: string, title: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/kb/documents/${documentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BeakerIcon className="h-7 w-7 mr-2 text-blue-600" />
              Knowledge Base
            </h1>
            <p className="text-gray-600">Manage course documents and access AI-powered assistance</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'documents'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline-block mr-2" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab('ai-chat')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'ai-chat'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 inline-block mr-2" />
              AI Chat
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Program
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedCourse('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Programs</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name} ({program.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedProgram && courses.length === 0}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'documents' ? (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Documents Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Course Documents</h2>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Upload Document
                </button>
              </div>

              <div className="p-4">
                {documentsLoading ? (
                  <div className="text-center py-12">
                    <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading documents...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-500">
                      {selectedCourse ? 'Upload documents for this course' : 'Select a course to view documents'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">{doc.title}</h4>
                              <p className="text-xs text-gray-500">
                                {doc.course_name} • {doc.program_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatFileSize(doc.file_size)} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {doc.status === 'processed' && (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            )}
                            {doc.status === 'pending' && (
                              <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />
                            )}
                            {doc.status === 'failed' && (
                              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                            )}

                            <button
                              onClick={() => handleViewDocument(doc.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Document"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc.id, doc.title)}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Download Document"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ai-chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* AI Chat Section */}
            <div className="bg-white rounded-lg border border-gray-200 h-[600px] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                <p className="text-sm text-gray-500">
                  Ask questions about your course materials
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!selectedCourse ? (
                  <div className="text-center py-12">
                    <ChatBubbleBottomCenterTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Please select a course to start chatting</p>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <ChatBubbleBottomCenterTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Start a conversation by asking a question</p>
                  </div>
                ) : (
                  chatMessages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.documents && message.documents.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className="text-xs font-medium mb-1">Sources:</p>
                            {message.documents.map(doc => (
                              <p key={doc.id} className="text-xs opacity-75">
                                • {doc.title}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-lg">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder={selectedCourse ? "Ask a question about your course..." : "Select a course first"}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!selectedCourse || isTyping}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!selectedCourse || !inputMessage.trim() || isTyping}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload Document</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program *
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedProgram}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document File *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    {uploadFile ? (
                      <>
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-green-500" />
                        <p className="text-sm text-gray-600">{uploadFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, TXT, PPT up to 50MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadProgress(0);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!uploadFile || !selectedProgram || !selectedCourse || uploadDocumentMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;