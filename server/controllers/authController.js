import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Helper to set refresh token in cookie
const setRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  res.cookie('refreshToken', token, cookieOptions);
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber, gender } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(409, 'User with this email already exists'));
    }

    // Handle avatar upload if exists
    let avatarUrl = undefined;
    if (req.file) {
      avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars', req.file.originalname);
    }

    // SECURITY: public self-registration is for hostel users (students) only.
    // Super Admins are created via a one-time database script, and Hostel Admins
    // are created directly by a Super Admin, so role/status are never taken from the client here.
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      phoneNumber,
      gender,
      avatar: avatarUrl,
      status: 'active',
    });

    // Prepare response data (exclude password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          userResponse,
          'Registration successful. You can now log in.'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    if (user.status === 'pending_approval') {
      return next(
        new ApiError(
          403,
          'Your warden account is pending approval by the Super Admin. You will receive an email once activated.'
        )
      );
    }

    if (user.status === 'suspended') {
      return next(new ApiError(403, 'Your account has been suspended. Please contact admin.'));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    // Create a login notification so it shows up in the notification bell.
    // Failure to create this should never block the login itself.
    try {
      await Notification.create({
        userId: user._id,
        title: 'New Login',
        message: `You logged in successfully on ${new Date().toLocaleString()}.`,
        type: 'system',
      });
    } catch (notifErr) {
      console.error('Failed to create login notification:', notifErr);
    }

    // Populate the assigned hostel (name only) so the frontend can label the
    // hostel_admin dashboard without an extra round trip
    await user.populate('assignedHostel', 'name city');

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      assignedHostel: user.assignedHostel,
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: userResponse, accessToken },
          `Welcome back, ${user.name}!`
        )
      );
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      return next(new ApiError(401, 'Refresh token missing'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }

    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== token) {
      return next(new ApiError(401, 'Session expired or invalidated'));
    }

    // Generate new tokens (token rotation)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken: newAccessToken },
          'Access token refreshed'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, 'Account with this email does not exist'));
    }

    // Create reset token
    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Send email
    sendPasswordResetEmail(user.email, user.name, resetPasswordToken);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          'Password reset link has been sent to your email.'
        )
      );
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token) {
      return next(new ApiError(400, 'Reset token is missing'));
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired reset token'));
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Clear refresh token to force re-login on all devices
    user.refreshToken = undefined;
    
    await user.save();

    res.status(200).json(new ApiResponse(200, null, 'Password reset successful. You can now log in.'));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    
    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};
