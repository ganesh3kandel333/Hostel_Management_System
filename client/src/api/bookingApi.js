import api from './axios.js';

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get('/bookings/my');
  return response.data;
};

export const getAllBookings = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/bookings/all${params ? `?${params}` : ''}`);
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const updateBookingStatus = async (id, statusData) => {
  const response = await api.put(`/bookings/status/${id}`, statusData);
  return response.data;
};

export const checkoutStudent = async (id) => {
  const response = await api.put(`/bookings/checkout/${id}`);
  return response.data;
};

// Student applies to check out of their current, approved stay
export const requestCheckout = async (id) => {
  const response = await api.put(`/bookings/checkout-request/${id}`);
  return response.data;
};

// Admin declines a pending checkout application (resident stays checked in)
export const declineCheckoutRequest = async (id) => {
  const response = await api.put(`/bookings/checkout-request/${id}/decline`);
  return response.data;
};
