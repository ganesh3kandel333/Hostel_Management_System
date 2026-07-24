import api from './axios.js';

export const createHostel = async (formData) => {
  const response = await api.post('/hostels', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAllHostels = async () => {
  const response = await api.get('/hostels');
  return response.data;
};

export const getHostelById = async (id) => {
  const response = await api.get(`/hostels/${id}`);
  return response.data;
};

export const updateHostel = async (id, formData) => {
  const response = await api.put(`/hostels/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteHostel = async (id) => {
  const response = await api.delete(`/hostels/${id}`);
  return response.data;
};
