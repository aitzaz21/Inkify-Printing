const crypto = require('crypto');
const OTP = require('../modules/auth/auth.model');

const RESEND_COOLDOWNS = [30, 60, 120, 300, 600]; // seconds
const MAX_RESEND_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 10;

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const createOTP = async (email, type) => {
  await OTP.deleteMany({ email, type });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otpRecord = await OTP.create({
    email,
    otp,
    type,
    expiresAt,
  });

  return otp;
};

const verifyOTP = async (email, inputOtp, type) => {
  const record = await OTP.findOne({ email, type });

  if (!record) {
    return { success: false, message: 'OTP not found. Please request a new one.' };
  }

  if (record.blockedUntil && record.blockedUntil > new Date()) {
    const minutesLeft = Math.ceil((record.blockedUntil - new Date()) / 60000);
    return { success: false, message: `Too many attempts. Try again in ${minutesLeft} minute(s).` };
  }

  if (record.expiresAt < new Date()) {
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.otp !== inputOtp) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      record.blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    }
    await record.save();
    const remaining = Math.max(0, 5 - record.attempts);
    return { success: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  await OTP.deleteOne({ _id: record._id });
  return { success: true };
};

const canResendOTP = async (email, type) => {
  const record = await OTP.findOne({ email, type });

  if (!record) return { canResend: true, waitSeconds: 0 };

  if (record.blockedUntil && record.blockedUntil > new Date()) {
    const secondsLeft = Math.ceil((record.blockedUntil - new Date()) / 1000);
    return { canResend: false, waitSeconds: secondsLeft, blocked: true };
  }

  if (record.resendCount >= MAX_RESEND_ATTEMPTS) {
    const blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    record.blockedUntil = blockedUntil;
    await record.save();
    return { canResend: false, waitSeconds: 600, blocked: true };
  }

  if (record.nextResendAt && record.nextResendAt > new Date()) {
    const secondsLeft = Math.ceil((record.nextResendAt - new Date()) / 1000);
    return { canResend: false, waitSeconds: secondsLeft };
  }

  return { canResend: true, waitSeconds: 0 };
};

const resendOTP = async (email, type) => {
  const check = await canResendOTP(email, type);
  if (!check.canResend) return { success: false, ...check };

  let record = await OTP.findOne({ email, type });
  const newOtp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const resendCount = record ? record.resendCount + 1 : 1;
  const cooldownSeconds = RESEND_COOLDOWNS[Math.min(resendCount - 1, RESEND_COOLDOWNS.length - 1)];
  const nextResendAt = new Date(Date.now() + cooldownSeconds * 1000);

  if (record) {
    record.otp = newOtp;
    record.expiresAt = expiresAt;
    record.resendCount = resendCount;
    record.nextResendAt = nextResendAt;
    record.attempts = 0;
    await record.save();
  } else {
    await OTP.create({ email, otp: newOtp, type, expiresAt, resendCount, nextResendAt });
  }

  return { success: true, otp: newOtp, nextCooldown: cooldownSeconds };
};

module.exports = { generateOTP, createOTP, verifyOTP, canResendOTP, resendOTP };
