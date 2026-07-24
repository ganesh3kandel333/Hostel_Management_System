import api from './axios.js';

export const createRoom = async (roomData) => {
  const response = await api.post('/rooms', roomData);
  return response.data;
};

export const getHostelRooms = async (hostelId, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/rooms/hostel/${hostelId}${params ? `?${params}` : ''}`);
  return response.data;
};

// Room types that currently have a real vacant bed in a given hostel
export const getAvailableRoomTypes = async (hostelId) => {
  const response = await api.get(`/rooms/available/${hostelId}`);
  return response.data;
};

export const getRoomById = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const updateRoom = async (id, roomData) => {
  const response = await api.put(`/rooms/${id}`, roomData);
  return response.data;
};

export const deleteRoom = async (id) => {
  const response = await api.delete(`/rooms/${id}`);
  return response.data;
};
