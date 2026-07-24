import api from './axios.js';

export const getHeroSlides = async () => {
  const response = await api.get('/hero-slides');
  return response.data;
};

export const createHeroSlide = async (formData) => {
  const response = await api.post('/hero-slides', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateHeroSlide = async (id, formData) => {
  const response = await api.put(`/hero-slides/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteHeroSlide = async (id) => {
  const response = await api.delete(`/hero-slides/${id}`);
  return response.data;
};

export const reorderHeroSlides = async (orderedIds) => {
  const response = await api.put('/hero-slides/reorder', { orderedIds });
  return response.data;
};
