import Hostel from '../models/Hostel.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { ensureOwnHostel } from '../middleware/roleMiddleware.js';

export const createHostel = async (req, res, next) => {
  try {
    const { name, description, address, city, contactEmail, contactPhone, facilities } = req.body;

    // A hostel_admin may only ever own one hostel — they register it themselves
    // (Super Admin no longer needs to pre-create it for them).
    if (req.user.role === 'hostel_admin' && req.user.assignedHostel) {
      return next(new ApiError(400, 'You already manage a hostel. A hostel admin can only manage one hostel.'));
    }

    const existingHostel = await Hostel.findOne({ name });
    if (existingHostel) {
      return next(new ApiError(409, 'Hostel with this name already exists'));
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'hostels', file.originalname));
      imageUrls = await Promise.all(uploadPromises);
    } else if (req.file) {
      const url = await uploadToCloudinary(req.file.buffer, 'hostels', req.file.originalname);
      imageUrls.push(url);
    }

    const facilitiesArray = typeof facilities === 'string' 
      ? facilities.split(',').map(f => f.trim()) 
      : facilities || [];

    const hostel = await Hostel.create({
      name,
      description,
      address,
      city,
      images: imageUrls,
      contactEmail,
      contactPhone,
      facilities: facilitiesArray,
      createdBy: req.user._id,
      admin: req.user.role === 'hostel_admin' ? req.user._id : null,
    });

    // A hostel_admin who registers their own hostel is immediately linked to it.
    if (req.user.role === 'hostel_admin') {
      await User.findByIdAndUpdate(req.user._id, { assignedHostel: hostel._id });
    }

    res.status(201).json(new ApiResponse(201, hostel, 'Hostel created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getAllHostels = async (req, res, next) => {
  try {
    const query = {};

    // A logged-in hostel_admin only ever sees their own assigned hostel here.
    // (Public/unauthenticated visitors and super_admin/student users see all hostels.)
    if (req.user && req.user.role === 'hostel_admin') {
      query._id = req.user.assignedHostel || null; // null -> matches nothing if unassigned
    }

    const hostels = await Hostel.find(query)
      .populate('createdBy', 'name email')
      .populate('admin', 'name email');
    res.status(200).json(new ApiResponse(200, hostels, 'Hostels fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const getHostelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hostel = await Hostel.findById(id).populate('createdBy', 'name email');
    
    if (!hostel) {
      return next(new ApiError(404, 'Hostel not found'));
    }

    // Get rooms statistics for this hostel
    const totalRooms = await Room.countDocuments({ hostelId: id });
    const availableRooms = await Room.countDocuments({ hostelId: id, status: 'available' });

    res.status(200).json(
      new ApiResponse(
        200,
        { hostel, stats: { totalRooms, availableRooms } },
        'Hostel details fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const updateHostel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, address, city, contactEmail, contactPhone, facilities } = req.body;

    const hostel = await Hostel.findById(id);
    if (!hostel) {
      return next(new ApiError(404, 'Hostel not found'));
    }

    // hostel_admin may only update the single hostel they are assigned to
    if (!ensureOwnHostel(req, next, hostel._id)) return;

    if (name) hostel.name = name;
    if (description) hostel.description = description;
    if (address) hostel.address = address;
    if (city) hostel.city = city;
    if (contactEmail) hostel.contactEmail = contactEmail;
    if (contactPhone) hostel.contactPhone = contactPhone;
    
    if (facilities) {
      hostel.facilities = typeof facilities === 'string'
        ? facilities.split(',').map(f => f.trim())
        : facilities;
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'hostels', file.originalname));
      hostel.images = await Promise.all(uploadPromises);
    } else if (req.file) {
      const url = await uploadToCloudinary(req.file.buffer, 'hostels', req.file.originalname);
      hostel.images = [url];
    }

    await hostel.save();
    res.status(200).json(new ApiResponse(200, hostel, 'Hostel updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteHostel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hostel = await Hostel.findById(id);
    if (!hostel) {
      return next(new ApiError(404, 'Hostel not found'));
    }

    // INTEGRITY: deleting a hostel that still has pending or approved bookings
    // must never delete the students who hold them, and must never leave
    // those students stuck (their booking would otherwise keep occupying
    // their "one active booking" slot forever, pointing at a hostel that no
    // longer exists). So instead of blocking the deletion, auto-cancel every
    // active booking for this hostel first — the student accounts are
    // untouched, and cancelling frees them up to apply to a different hostel.
    const activeBookings = await Booking.find({
      hostelId: id,
      status: { $in: ['pending', 'approved'] },
    });

    for (const booking of activeBookings) {
      booking.status = 'cancelled';
      booking.rejectionReason = `Hostel "${hostel.name}" was removed from the platform by the administrator.`;
      // Only status/rejectionReason are changing here — don't re-validate the
      // whole document. A booking with legacy/pre-existing data missing a
      // required field (e.g. an old record without roomType) would otherwise
      // fail validation on save and abort the entire hostel deletion.
      await booking.save({ validateBeforeSave: false });

      await Notification.create({
        userId: booking.userId,
        title: 'Hostel Removed',
        message: `"${hostel.name}" has been removed from the platform, so your booking there has been cancelled. Your account is unaffected — you're free to apply to a different hostel any time.`,
        type: 'booking',
      });
    }

    await Hostel.findByIdAndDelete(id);

    // Also delete rooms belonging to this hostel
    await Room.deleteMany({ hostelId: id });

    // Release the assigned hostel_admin (if any) so they aren't left pointing at a deleted hostel
    if (hostel.admin) {
      await User.findByIdAndUpdate(hostel.admin, { assignedHostel: null });
    }

    const message =
      activeBookings.length > 0
        ? `Hostel deleted. ${activeBookings.length} affected student booking(s) were cancelled (their accounts were kept, and they can now book a different hostel).`
        : 'Hostel and associated rooms deleted successfully';

    res.status(200).json(new ApiResponse(200, null, message));
  } catch (error) {
    next(error);
  }
};
