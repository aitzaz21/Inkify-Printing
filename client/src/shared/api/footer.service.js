import api from './axios';

export const footerAPI = {
  get:    ()     => api.get('/footer'),
  update: (data) => api.put('/footer', data),
};

export const statsAPI = {
  getHome:        ()     => api.get('/stats/home'),
  getOverrides:   ()     => api.get('/stats/overrides'),
  updateOverrides:(data) => api.patch('/stats/overrides', data),
};
