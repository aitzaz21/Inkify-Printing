import api from '../../../shared/api/axios';

export const orderAPI = {
  create:       (data)           => api.post('/orders', data),
  getMyOrders:  ()               => api.get('/orders/my'),
  getMyOrder:   (id)             => api.get(`/orders/my/${id}`),
  // admin
  getAll:       (params = {})    => api.get('/orders', { params }),
  getById:      (id)             => api.get(`/orders/${id}`),
  updateStatus: (id, data)       => api.patch(`/orders/${id}/status`, data),
  reverseOrder: (id, data)       => api.patch(`/orders/${id}/reverse`, data),
  getStats:     ()               => api.get('/orders/stats'),
};
