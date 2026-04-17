import api from '../../../shared/api/axios';

export const productAPI = {
  getAll:        (params = {}) => api.get('/products', { params }),
  getCategories: ()            => api.get('/products/categories'),
  getById:       (id)          => api.get(`/products/${id}`),
  create:        (data)        => api.post('/products', data),
  update:        (id, data)    => api.put(`/products/${id}`, data),
  remove:        (id)          => api.delete(`/products/${id}`),
  delete:        (id)          => api.delete(`/products/${id}`),
};
