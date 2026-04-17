const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const {
  signupValidation,
  loginValidation,
  otpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  completeProfileValidation,
} = require('./auth.validation');

// Public routes
router.post('/signup', signupValidation, authController.signup);
router.post('/verify-email', otpValidation, authController.verifyEmail);
router.post('/resend-verification-otp', authController.resendVerificationOTP);
router.post('/login', loginValidation, authController.login);
router.post('/google', authController.googleAuth);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/resend-password-reset-otp', authController.resendPasswordResetOTP);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Protected routes
router.post('/complete-profile', authMiddleware, completeProfileValidation, authController.completeProfile);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
