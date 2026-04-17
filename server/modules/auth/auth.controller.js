const { validationResult } = require('express-validator');
const authService = require('./auth.service');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    res.status(422).json({ success: false, message: messages[0], errors: messages });
    return false;
  }
  return true;
};

const respond = (res, status, data) => res.status(status).json({ success: status < 400, ...data });

const signup = async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.signup(req.body);
    respond(res, 201, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message || 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.verifyEmail(req.body);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message || 'Server error' });
  }
};

const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return respond(res, 422, { message: 'Email is required' });
    const result = await authService.resendVerificationOTP(email);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message, waitSeconds: err.waitSeconds });
  }
};

const login = async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.login(req.body);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message, needsVerification: err.needsVerification });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return respond(res, 422, { message: 'Google ID token is required' });
    const result = await authService.googleAuth(idToken);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const completeProfile = async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.completeProfile(req.user._id, req.body);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.forgotPassword(req.body.email);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const resendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return respond(res, 422, { message: 'Email is required' });
    const result = await authService.resendPasswordResetOTP(email);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message, waitSeconds: err.waitSeconds });
  }
};

const resetPassword = async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.resetPassword(req.body);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await authService.getMe(req.user._id);
    respond(res, 200, result);
  } catch (err) {
    respond(res, err.status || 500, { message: err.message });
  }
};

module.exports = {
  signup, verifyEmail, resendVerificationOTP,
  login, googleAuth, completeProfile,
  forgotPassword, resendPasswordResetOTP, resetPassword,
  getMe,
};
