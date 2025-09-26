import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HomeModernIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface RoomData {
  name: string;
  room_name: string;
  room_number: string;
  seating_capacity: number;
  building: string;
  location: string;
}

const Room: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: roomsData, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get('/frappe/Room');
      return response.data.data || [];
    },
  });

  const rooms = roomsData || [];

  const filteredRooms = rooms.filter((room: RoomData) =>
    room.room_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.building?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading rooms. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-600 mt-1">Manage classroom and facility rooms</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Room
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room: RoomData) => (
          <div key={room.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <HomeModernIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{room.room_name}</h3>
                    <p className="text-sm text-gray-500">Room {room.room_number}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {room.building && (
                    <p className="text-sm text-gray-600">Building: {room.building}</p>
                  )}
                  {room.location && (
                    <p className="text-sm text-gray-600">Location: {room.location}</p>
                  )}
                  <div className="flex items-center text-sm">
                    <UsersIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-gray-600">Capacity: {room.seating_capacity || 'N/A'}</span>
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

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <HomeModernIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No rooms found.</p>
        </div>
      )}
    </div>
  );
};

export default Room;