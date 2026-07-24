import api from './axios.js';

export const createPayment = async (formData) => {
  const response = await api.post('/payments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMyPayments = async () => {
  const response = await api.get('/payments/my');
  return response.data;
};

export const getAllPayments = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/payments/all${params ? `?${params}` : ''}`);
  return response.data;
};

export const verifyPayment = async (id, status) => {
  const response = await api.put(`/payments/verify/${id}`, { status });
  return response.data;
};
