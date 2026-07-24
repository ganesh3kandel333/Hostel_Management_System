import User from '../models/User.js';
import Hostel from '../models/Hostel.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { sendHostelAdminCredentialsEmail } from '../services/emailService.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken')
      .populate('assignedHostel', 'name city address');
    if (!user) {
      return next(new ApiError(404, 'User profile not found'));
    }
    res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, gender } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (gender) user.gender = gender;

    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars', req.file.originalname);
      user.avatar = avatarUrl;
    }

    await user.save();
    
    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
    };

    res.status(200).json(new ApiResponse(200, updatedUser, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Any logged-in user (student, hostel_admin, super_admin): change their own
// password while logged in. Requires the current password for verification —
// this is how a hostel_admin replaces the temporary password they were emailed.
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, 'Current password and new password are required'));
    }
    if (newPassword.length < 6) {
      return next(new ApiError(400, 'New password must be at least 6 characters long'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(401, 'Current password is incorrect'));
    }

    if (currentPassword === newPassword) {
      return next(new ApiError(400, 'New password must be different from the current password'));
    }

    user.password = newPassword; // pre-save hook hashes this
    // Force re-login on other devices/sessions after a password change
    user.refreshToken = undefined;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, 'Password changed successfully. Please log in again.'));
  } catch (error) {
    next(error);
  }
};

// Super Admin: Get all users with search and pagination
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const skip = (page - 1) * limit;

    const { role, search, status } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .populate('assignedHostel', 'name city')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Users list fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Super Admin: Update User Status (active / suspended)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return next(new ApiError(400, 'Invalid status value'));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (user.role === 'super_admin') {
      return next(new ApiError(403, 'Super admin status cannot be modified'));
    }

    user.status = status;
    // Clear refresh token to force logout if suspended
    if (status === 'suspended') {
      user.refreshToken = undefined;
    }
    
    await user.save();

    res.status(200).json(new ApiResponse(200, null, `User status updated to ${status}`));
  } catch (error) {
    next(error);
  }
};

// Super Admin: Delete a user account permanently (replaces suspend for
// removal — suspend/activate is still available for temporarily disabling
// access, but a Super Admin can now fully delete a student or hostel_admin
// account). super_admin accounts can never be deleted from here.
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (user.role === 'super_admin') {
      return next(new ApiError(403, 'Super admin accounts cannot be deleted'));
    }

    // If this user is a hostel_admin managing a hostel, free that hostel up
    if (user.role === 'hostel_admin' && user.assignedHostel) {
      await Hostel.findByIdAndUpdate(user.assignedHostel, { admin: null });
    }

    // BUG FIX: deleting a student's account used to leave them sitting in
    // Room.currentOccupants forever, so the room kept counting as occupied
    // (or stuck on "full") and a new student could never be assigned that
    // bed even though the account no longer existed. Release every room
    // this user currently occupies, and cancel any pending/approved
    // bookings tied to them so nothing orphaned is left behind.
    const occupiedRooms = await Room.find({ currentOccupants: user._id });
    for (const room of occupiedRooms) {
      room.currentOccupants = room.currentOccupants.filter(
        (occupantId) => occupantId.toString() !== user._id.toString()
      );
      room.status = 'available';
      await room.save();
    }

    await Booking.updateMany(
      { userId: user._id, status: { $in: ['pending', 'approved'] } },
      { status: 'cancelled', rejectionReason: 'Account deleted' }
    );

    await User.findByIdAndDelete(id);

    res.status(200).json(new ApiResponse(200, null, `${user.name}'s account has been permanently deleted`));
  } catch (error) {
    next(error);
  }
};

// Super Admin: Update a Hostel Admin's own editable details (name, email,
// phone, gender, and optionally reset their password). Completes the CRUD
// set for hostel_admin accounts (Create -> createHostelAdmin, Read -> getAllUsers,
// Update -> this, Delete -> deleteUser).
export const updateHostelAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNumber, gender, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    if (user.role !== 'hostel_admin') {
      return next(new ApiError(400, 'Only hostel_admin accounts can be edited here'));
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return next(new ApiError(409, 'A user with this email already exists'));
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (gender) user.gender = gender;

    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars', req.file.originalname);
      user.avatar = avatarUrl;
    }

    if (password) {
      if (password.length < 6) {
        return next(new ApiError(400, 'New password must be at least 6 characters long'));
      }
      user.password = password; // pre-save hook hashes this
      user.refreshToken = undefined; // force re-login with the new password
    }

    await user.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          gender: user.gender,
          avatar: user.avatar,
        },
        'Hostel Admin updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Super Admin: Update User Role (super_admin, hostel_admin, student)
// NOTE: Deliberately no updateUserRole endpoint. Roles are fixed at account
// creation (student on signup, hostel_admin only via createHostelAdmin below,
// super_admin only via seeding/DB). Allowing a role to be changed later opens
// the door to broken hostel/room assignments and privilege-escalation bugs,
// so this capability is intentionally not exposed.

// Super Admin: Create a Hostel Admin directly (active immediately, no approval needed).
// A hostel does NOT have to be selected up front — a Super Admin can create a bare
// Hostel Admin account, and that admin can then log in and register (create) their
// own hostel and rooms. If a hostelId IS supplied (and is not already taken), the
// admin is assigned to it immediately, preserving the old workflow too.
// The Super Admin must set the admin's initial password themselves (compulsory) —
// it is never auto-generated.
export const createHostelAdmin = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, gender, hostelId, password } = req.body;

    if (!name || !email) {
      return next(new ApiError(400, 'Name and email are required'));
    }

    if (!password || password.length < 6) {
      return next(new ApiError(400, 'A password of at least 6 characters is required to create a Hostel Admin'));
    }

    let hostel = null;
    if (hostelId) {
      hostel = await Hostel.findById(hostelId);
      if (!hostel) {
        return next(new ApiError(404, 'Selected hostel not found'));
      }
      if (hostel.admin) {
        return next(new ApiError(409, 'This hostel already has an assigned admin. Reassign or remove the existing admin first.'));
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(409, 'A user with this email already exists'));
    }

    let avatarUrl = undefined;
    if (req.file) {
      avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars', req.file.originalname);
    }

    const hostelAdmin = await User.create({
      name,
      email,
      password,
      role: 'hostel_admin',
      phoneNumber,
      gender,
      avatar: avatarUrl,
      status: 'active', // No pending approval - Super Admin created this account directly
      assignedHostel: hostel ? hostel._id : null,
    });

    if (hostel) {
      hostel.admin = hostelAdmin._id;
      await hostel.save();
    }

    sendHostelAdminCredentialsEmail(hostelAdmin.email, hostelAdmin.name, password);

    res.status(201).json(
      new ApiResponse(
        201,
        {
          _id: hostelAdmin._id,
          name: hostelAdmin.name,
          email: hostelAdmin.email,
          role: hostelAdmin.role,
          status: hostelAdmin.status,
          assignedHostel: hostel ? { _id: hostel._id, name: hostel.name } : null,
        },
        hostel
          ? 'Hostel Admin created and assigned successfully. Login credentials have been emailed.'
          : 'Hostel Admin created successfully. They can now log in and register their own hostel. Login credentials have been emailed.'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Super Admin: Assign or reassign which hostel a hostel_admin manages
export const assignHostelToAdmin = async (req, res, next) => {
  try {
    const { id } = req.params; // hostel_admin user id
    const { hostelId } = req.body;

    if (!hostelId) {
      return next(new ApiError(400, 'hostelId is required'));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    if (user.role !== 'hostel_admin') {
      return next(new ApiError(400, 'Only hostel_admin users can be assigned to a hostel'));
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return next(new ApiError(404, 'Hostel not found'));
    }

    if (hostel.admin && hostel.admin.toString() !== user._id.toString()) {
      return next(new ApiError(409, 'This hostel already has a different assigned admin'));
    }

    // Release any hostel this admin was previously managing
    if (user.assignedHostel && user.assignedHostel.toString() !== hostel._id.toString()) {
      await Hostel.findByIdAndUpdate(user.assignedHostel, { admin: null });
    }

    user.assignedHostel = hostel._id;
    await user.save();

    hostel.admin = user._id;
    await hostel.save();

    res.status(200).json(
      new ApiResponse(200, { assignedHostel: { _id: hostel._id, name: hostel.name } }, `${user.name} is now the admin for ${hostel.name}`)
    );
  } catch (error) {
    next(error);
  }
};
