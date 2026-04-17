import api from '../../../shared/api/axios';

// Auth uses its own paths under /api/auth
// The shared axios instance handles JWT + 401 redirect automatically

export const authAPI = {
  signup:                 (data)  => api.post('/auth/signup',                  data),
  verifyEmail:            (data)  => api.post('/auth/verify-email',             data),
  resendVerificationOTP:  (email) => api.post('/auth/resend-verification-otp',  { email }),
  login:                  (data)  => api.post('/auth/login',                   data),
  googleAuth:             (token) => api.post('/auth/google',                  { idToken: token }),
  completeProfile:        (data)  => api.post('/auth/complete-profile',        data),
  forgotPassword:         (email) => api.post('/auth/forgot-password',         { email }),
  resendPasswordResetOTP: (email) => api.post('/auth/resend-password-reset-otp',{ email }),
  resetPassword:          (data)  => api.post('/auth/reset-password',          data),
  getMe:                  ()      => api.get('/auth/me'),
};
