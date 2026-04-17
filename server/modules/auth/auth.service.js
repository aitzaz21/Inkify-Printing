const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../user/user.model');
const { createOTP, verifyOTP, resendOTP } = require('../../utils/otpService');
const { sendVerificationOTP, sendPasswordResetOTP } = require('../../utils/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const signup = async ({ firstName, lastName, email, password, gender, address }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.isVerified) {
      throw { status: 409, message: 'Email already registered. Please login.' };
    }
    // Re-send OTP for unverified users
    await existingUser.updateOne({ firstName, lastName, password, gender, address });
  } else {
    await User.create({ firstName, lastName, email, password, gender, address });
  }

  const otp = await createOTP(email, 'verification');
  await sendVerificationOTP(email, firstName, otp);

  return { message: 'Account created. Please verify your email.' };
};

const verifyEmail = async ({ email, otp }) => {
  const result = await verifyOTP(email, otp, 'verification');
  if (!result.success) throw { status: 400, message: result.message };

  const user = await User.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true }
  );
  if (!user) throw { status: 404, message: 'User not found.' };

  const token = generateToken(user._id);
  return { token, user };
};

const resendVerificationOTP = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw { status: 404, message: 'User not found.' };
  if (user.isVerified) throw { status: 400, message: 'Email already verified.' };

  const result = await resendOTP(email, 'verification');
  if (!result.success) {
    throw {
      status: 429,
      message: result.blocked
        ? 'Too many attempts. Please wait before requesting again.'
        : `Please wait ${result.waitSeconds} seconds before resending.`,
      waitSeconds: result.waitSeconds,
    };
  }

  await sendVerificationOTP(email, user.firstName, result.otp);
  return { message: 'OTP resent successfully.', nextCooldown: result.nextCooldown };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw { status: 401, message: 'Invalid email or password.' };
  if (!user.password) throw { status: 401, message: 'Please login with Google.' };
  if (!user.isVerified) throw { status: 403, message: 'Please verify your email first.', needsVerification: true };

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw { status: 401, message: 'Invalid email or password.' };

  const token = generateToken(user._id);
  return { token, user };
};

const googleAuth = async (idToken) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw { status: 401, message: 'Invalid Google token.' };
  }

  const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatar } = payload;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      firstName,
      lastName: lastName || '',
      email,
      googleId,
      avatar,
      isVerified: true,
      isProfileComplete: false,
    });
    const token = generateToken(user._id);
    return { token, user, isNewUser: true, needsProfile: true };
  }

  if (!user.googleId) {
    user.googleId = googleId;
    user.avatar = avatar || user.avatar;
    user.isVerified = true;
    await user.save();
  }

  if (!user.isProfileComplete) {
    const token = generateToken(user._id);
    return { token, user, isNewUser: false, needsProfile: true };
  }

  const token = generateToken(user._id);
  return { token, user, isNewUser: false, needsProfile: false };
};

const completeProfile = async (userId, { gender, address }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { gender, address, isProfileComplete: true },
    { new: true }
  );
  if (!user) throw { status: 404, message: 'User not found.' };
  return { user };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw { status: 404, message: 'No account found with this email.' };
  if (!user.isVerified) throw { status: 403, message: 'Please verify your email first.' };
  if (!user.password) throw { status: 400, message: 'Please use Google login for this account.' };

  const otp = await createOTP(email, 'password_reset');
  await sendPasswordResetOTP(email, user.firstName, otp);
  return { message: 'Password reset OTP sent to your email.' };
};

const resendPasswordResetOTP = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw { status: 404, message: 'User not found.' };

  const result = await resendOTP(email, 'password_reset');
  if (!result.success) {
    throw {
      status: 429,
      message: result.blocked
        ? 'Too many attempts. Please wait before requesting again.'
        : `Please wait ${result.waitSeconds} seconds before resending.`,
      waitSeconds: result.waitSeconds,
    };
  }

  await sendPasswordResetOTP(email, user.firstName, result.otp);
  return { message: 'OTP resent successfully.', nextCooldown: result.nextCooldown };
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const result = await verifyOTP(email, otp, 'password_reset');
  if (!result.success) throw { status: 400, message: result.message };

  const user = await User.findOne({ email });
  if (!user) throw { status: 404, message: 'User not found.' };

  user.password = newPassword;
  await user.save();

  return { message: 'Password reset successfully. You can now login.' };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found.' };
  return { user };
};

module.exports = {
  signup, verifyEmail, resendVerificationOTP,
  login, googleAuth, completeProfile,
  forgotPassword, resendPasswordResetOTP, resetPassword,
  getMe,
};
