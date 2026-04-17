import api from '../../../shared/api/axios';

export const reviewAPI = {
  // Public
  getFeatured:  ()               => api.get('/reviews/featured'),
  getAll:       (params = {})    => api.get('/reviews', { params }),
  getStats:     ()               => api.get('/reviews/stats'),

  // User
  create:       (data)           => api.post('/reviews', data),
  getMy:        ()               => api.get('/reviews/my'),
  update:       (id, data)       => api.patch(`/reviews/my/${id}`, data),
  userDelete:   (id)             => api.delete(`/reviews/my/${id}`),

  // Admin
  getAdminAll:  (params = {})    => api.get('/reviews/admin/all', { params }),
  toggleFeature:(id)             => api.patch(`/reviews/${id}/feature`),
  delete:       (id)             => api.delete(`/reviews/${id}`),
};
