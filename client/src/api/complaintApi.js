import api from './axios.js';

export const createComplaint = async (complaintData) => {
  const response = await api.post('/complaints', complaintData);
  return response.data;
};

export const getMyComplaints = async () => {
  const response = await api.get('/complaints/my');
  return response.data;
};

export const getAllComplaints = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/complaints/all${params ? `?${params}` : ''}`);
  return response.data;
};

export const updateComplaintStatus = async (id, statusData) => {
  const response = await api.put(`/complaints/status/${id}`, statusData);
  return response.data;
};
