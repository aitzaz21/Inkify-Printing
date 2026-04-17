import api from '../../../shared/api/axios';

export const uploadAPI = {
  uploadDesign:  (file, onProgress) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/design', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  uploadProduct: (file, onProgress) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/product', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  uploadHero: (file, onProgress) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/hero', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  deleteImage: (url) => api.delete('/upload/image', { data: { url } }),
};
