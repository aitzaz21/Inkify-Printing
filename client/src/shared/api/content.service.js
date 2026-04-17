import api from './axios';

export const contentAPI = {
  get:             ()           => api.get('/content'),
  update:          (data)       => api.patch('/content', data),
  addHeroImage:    (data)       => api.post('/content/hero-image', data),
  removeHeroImage: (imageId)    => api.delete(`/content/hero-image/${imageId}`),
  addReview:       (data)       => api.post('/content/reviews', data),
  removeReview:    (reviewId)   => api.delete(`/content/reviews/${reviewId}`),
};

export const contactAPI = {
  submit:   (data)       => api.post('/contact', data),
  getAll:   (params)     => api.get('/contact', { params }),
  markRead: (id)         => api.patch(`/contact/${id}/read`),
  remove:   (id)         => api.delete(`/contact/${id}`),
};
