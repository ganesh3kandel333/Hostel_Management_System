import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new ApiError(401, 'Not authorized, token missing'));
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      const user = await User.findById(decoded._id).select('-password');
      if (!user) {
        return next(new ApiError(401, 'Not authorized, user not found'));
      }

      if (user.status === 'suspended') {
        return next(new ApiError(403, 'Your account has been suspended'));
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'JWT Expired'));
      }
      return next(new ApiError(401, 'Not authorized, invalid token'));
    }
  } catch (error) {
    next(new ApiError(500, error.message || 'Authentication error'));
  }
};

// Like `protect`, but never blocks the request if no/invalid token is present.
// Used on public routes (e.g. browsing hostels) that still want to personalize
// results (e.g. scope results to a logged-in hostel_admin's own hostel) when a
// valid session exists, while staying open to anonymous visitors.
export const attachUserIfPresent = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded._id).select('-password');
      if (user && user.status !== 'suspended') {
        req.user = user;
      }
    } catch (err) {
      // Invalid/expired token on a public route — proceed as anonymous rather than erroring
    }

    next();
  } catch (error) {
    next(error);
  }
};
