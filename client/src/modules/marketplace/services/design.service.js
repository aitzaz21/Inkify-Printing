import api from '../../../shared/api/axios';

export const designAPI = {
  // Public
  getApproved:  (params = {})    => api.get('/designs',          { params }),
  getById:      (id)             => api.get(`/designs/${id}`),

  // Authenticated user
  create:       (data)           => api.post('/designs',          data),
  getMyDesigns: (params = {})    => api.get('/designs/my/uploads',{ params }),
  update:       (id, data)       => api.put(`/designs/${id}`,    data),
  delete:       (id)             => api.delete(`/designs/${id}`),

  // Admin
  getAll:       (params = {})    => api.get('/designs/admin/all', { params }),
  approve:      (id)             => api.patch(`/designs/${id}/approve`),
  reject:       (id, reason)     => api.patch(`/designs/${id}/reject`, { reason }),
  adminDelete:  (id)             => api.delete(`/designs/admin/${id}`),
};
