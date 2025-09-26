// pages/admin/AIChat.tsx - Dedicated AI Chat Assistant Interface
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  AcademicCapIcon,
  BookOpenIcon,
  SparklesIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  BeakerIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePrograms, useCourses } from '../../hooks/useRoleBasedQuery';
import toast from 'react-hot-toast';

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
  sources?: any[];
}

const AIChat: React.FC = () => {
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sample quick questions
  const quickQuestions = [
    "Explain this topic in simple terms",
    "Give me practice questions",
    "What are the key concepts?",
    "How does this relate to real world?",
    "Summarize this chapter",
    "Help me prepare for exam"
  ];

  // Fetch Programs
  const { data: programs = [] } = usePrograms();

  // Fetch Courses for teacher or admin
  const { data: allCourses = [] } = useCourses();

  // Filter courses by selected program if needed
  const courses = selectedProgram
    ? (Array.isArray(allCourses) ? allCourses.filter((course: Course) => course.program === selectedProgram) : [])
    : (Array.isArray(allCourses) ? allCourses : []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(`ai_chat_${user?.id}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [user]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai_chat_${user?.id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Send message
  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;

    if (!textToSend.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await api.post('/kb/chat/message', {
        message: textToSend,
        program_id: selectedProgram,
        course_id: selectedCourse,
        session_id: user?.id
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date().toISOString(),
        sources: response.data.sources
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response from AI');
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`ai_chat_${user?.id}`);
    toast.success('Chat history cleared');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Learning Assistant</h1>
              <p className="text-sm text-gray-500">Get instant help with your course materials</p>
            </div>
          </div>

          {/* Course Selection */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setSelectedCourse('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Program</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedProgram}
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <button
              onClick={clearChat}
              className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors flex items-center space-x-2"
            >
              <TrashIcon className="h-5 w-5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Chat */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {!selectedCourse ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course to Start</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose your program and course above to begin chatting with your AI learning assistant
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <SparklesIcon className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Help!</h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    Ask me anything about your course materials. I'm here to help you learn and understand better.
                  </p>

                  {/* Quick Start Suggestions */}
                  <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(question)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm text-gray-700"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-3xl ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-blue-500'
                          : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      }`}>
                        {message.role === 'user' ? (
                          <span className="text-white text-sm font-medium">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        ) : (
                          <SparklesIcon className="h-4 w-4 text-white" />
                        )}
                      </div>

                      <div className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium mb-1 flex items-center text-gray-600">
                              <DocumentTextIcon className="h-3 w-3 mr-1" />
                              Sources
                            </p>
                            {message.sources.map((source, idx) => (
                              <p key={idx} className="text-xs text-gray-500">
                                • {source.title}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <SparklesIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={selectedCourse ? "Ask me anything..." : "Select a course first"}
                disabled={!selectedCourse || isTyping}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!selectedCourse || !inputMessage.trim() || isTyping}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel - Tips */}
        <div className="w-80 border-l border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Tips for Better Results
          </h3>

          <div className="space-y-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900 mb-1">Be Specific</p>
              <p className="text-blue-700">Ask detailed questions about specific topics or concepts</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900 mb-1">Context Matters</p>
              <p className="text-green-700">Mention the chapter or topic for more relevant answers</p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="font-medium text-purple-900 mb-1">Learn Actively</p>
              <p className="text-purple-700">Ask for examples, practice questions, or explanations</p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="font-medium text-orange-900 mb-1">Review & Practice</p>
              <p className="text-orange-700">Request summaries and key points for better retention</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Example Questions:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <QuestionMarkCircleIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                <span>What are the main concepts in Chapter 3?</span>
              </li>
              <li className="flex items-start">
                <QuestionMarkCircleIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                <span>Explain photosynthesis in simple terms</span>
              </li>
              <li className="flex items-start">
                <QuestionMarkCircleIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                <span>Give me 5 practice questions on algebra</span>
              </li>
              <li className="flex items-start">
                <QuestionMarkCircleIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                <span>How do I solve quadratic equations?</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;