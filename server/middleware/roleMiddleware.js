import ApiError from '../utils/ApiError.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized, user details missing'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role ${req.user.role} is not authorized to access this route`
        )
      );
    }
    next();
  };
};

// Confirms a hostel_admin is acting only within their own assigned hostel.
// Super admins are always allowed through. Returns true if allowed, otherwise
// sends a 403 ApiError via `next` and returns false so callers can short-circuit.
export const ensureOwnHostel = (req, next, hostelId) => {
  if (req.user.role === 'super_admin') return true;

  if (req.user.role === 'hostel_admin') {
    if (!req.user.assignedHostel) {
      next(new ApiError(403, 'Your hostel admin account is not yet assigned to a hostel. Contact the Super Admin.'));
      return false;
    }
    if (!hostelId || req.user.assignedHostel.toString() !== hostelId.toString()) {
      next(new ApiError(403, 'You can only manage your own assigned hostel'));
      return false;
    }
    return true;
  }

  next(new ApiError(403, 'You are not authorized to perform this action'));
  return false;
};

