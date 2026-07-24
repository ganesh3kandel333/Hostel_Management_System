import api from './axios.js';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (formData) => {
  const response = await api.put('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/users/profile/change-password', { currentPassword, newPassword });
  return response.data;
};

export const getAllUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/users/admin/all${params ? `?${params}` : ''}`);
  return response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await api.put(`/users/admin/status/${id}`, { status });
  return response.data;
};

export const createHostelAdmin = async (formData) => {
  const response = await api.post('/users/admin/hostel-admin', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const assignHostelToAdmin = async (userId, hostelId) => {
  const response = await api.put(`/users/admin/assign-hostel/${userId}`, { hostelId });
  return response.data;
};

export const updateHostelAdmin = async (id, formData) => {
  const response = await api.put(`/users/admin/hostel-admin/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/admin/users/${id}`);
  return response.data;
};
