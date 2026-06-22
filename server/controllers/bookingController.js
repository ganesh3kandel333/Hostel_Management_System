import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hostel from '../models/Hostel.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { sendBookingNotificationEmail } from '../services/emailService.js';
import { ensureOwnHostel } from '../middleware/roleMiddleware.js';

export const createBooking = async (req, res, next) => {
  try {
    const { hostelId, checkInDate, checkOutDate, roomType } = req.body;
    const userId = req.user._id;

    // Check if user already has an active or pending booking
    const activeBooking = await Booking.findOne({
      userId,
      status: { $in: ['pending', 'approved'] },
    });

    if (activeBooking) {
      return next(
        new ApiError(400, `You already have an active/pending booking (Status: ${activeBooking.status})`)
      );
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return next(new ApiError(404, 'Hostel not found'));
    }

    // Find any room of requested type in the hostel to calculate rent
    const sampleRoom = await Room.findOne({ hostelId, type: roomType });
    if (!sampleRoom) {
      return next(
        new ApiError(404, `No rooms of type '${roomType}' found in this hostel`)
      );
    }

    // Calculate stay duration in months
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.max(1, Math.ceil(diffDays / 30));

    const totalAmount = sampleRoom.rent * months;

    const booking = await Booking.create({
      userId,
      hostelId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalAmount,
      status: 'pending',
    });

    // Create Notification
    await Notification.create({
      userId,
      title: 'Booking Submitted',
      message: `Your booking request for ${hostel.name} has been submitted successfully and is pending review.`,
      type: 'booking',
    });

    res.status(201).json(new ApiResponse(201, booking, 'Booking request submitted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('hostelId', 'name city address images')
      .populate('roomId', 'roomNumber type rent')
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, bookings, 'Your bookings fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('userId', 'name email phoneNumber avatar')
      .populate('hostelId', 'name city address')
      .populate('roomId', 'roomNumber type rent');

    if (!booking) {
      return next(new ApiError(404, 'Booking not found'));
    }

    // Authorization check
    if (
      req.user.role === 'student' &&
      booking.userId._id.toString() !== req.user._id.toString()
    ) {
      return next(new ApiError(403, 'You do not have permission to view this booking'));
    }

    if (req.user.role === 'hostel_admin') {
      if (!ensureOwnHostel(req, next, booking.hostelId._id)) return;
    }

    res.status(200).json(new ApiResponse(200, booking, 'Booking details fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const { hostelId, status } = req.query;
    const query = {};

    if (req.user.role === 'hostel_admin') {
      // A hostel_admin only ever sees bookings for their own assigned hostel,
      // regardless of what hostelId filter (if any) was requested.
      if (!req.user.assignedHostel) {
        return res.status(200).json(new ApiResponse(200, [], 'All bookings fetched successfully'));
      }
      query.hostelId = req.user.assignedHostel;
    } else if (hostelId) {
      query.hostelId = hostelId;
    }

    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phoneNumber')
      .populate('hostelId', 'name city')
      .populate('roomId', 'roomNumber type')
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, bookings, 'All bookings fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, roomId, rejectionReason } = req.body;

    const booking = await Booking.findById(id).populate('userId', 'name email');
    if (!booking) {
      return next(new ApiError(404, 'Booking not found'));
    }

    // hostel_admin may only act on bookings for their own assigned hostel
    if (!ensureOwnHostel(req, next, booking.hostelId)) return;

    const hostel = await Hostel.findById(booking.hostelId);
    const hostelName = hostel ? hostel.name : 'Hostel';

    if (status === 'approved') {
      if (!roomId) {
        return next(new ApiError(400, 'Room ID is required to approve booking'));
      }

      const room = await Room.findById(roomId);
      if (!room) {
        return next(new ApiError(404, 'Room not found'));
      }

      if (room.hostelId.toString() !== booking.hostelId.toString()) {
        return next(new ApiError(400, 'Room does not belong to the selected hostel'));
      }

      if (room.currentOccupants.length >= room.capacity) {
        return next(new ApiError(400, 'Selected room is already at full capacity'));
      }

      // Assign room
      booking.roomId = roomId;
      booking.assignedRoomNumber = room.roomNumber;
      booking.status = 'approved';

      // Add user as occupant
      room.currentOccupants.push(booking.userId._id);
      if (room.currentOccupants.length >= room.capacity) {
        room.status = 'full';
      }
      await room.save();

      // Notify user
      await Notification.create({
        userId: booking.userId._id,
        title: 'Booking Approved',
        message: `Congratulations! Your booking request for ${hostelName} has been approved. Room: ${room.roomNumber}`,
        type: 'booking',
      });

      sendBookingNotificationEmail(
        booking.userId.email,
        booking.userId.name,
        'approved',
        hostelName,
        `Room assigned: ${room.roomNumber}.`
      );
    } else if (status === 'rejected') {
      booking.status = 'rejected';
      booking.rejectionReason = rejectionReason || 'Room unavailability or documentation issue';

      // Notify user
      await Notification.create({
        userId: booking.userId._id,
        title: 'Booking Rejected',
        message: `We regret to inform you that your booking for ${hostelName} has been rejected. Reason: ${booking.rejectionReason}`,
        type: 'booking',
      });

      sendBookingNotificationEmail(
        booking.userId.email,
        booking.userId.name,
        'rejected',
        hostelName,
        `Reason: ${booking.rejectionReason}`
      );
    } else if (status === 'cancelled') {
      // If booking was approved, release occupancy
      if (booking.status === 'approved' && booking.roomId) {
        const room = await Room.findById(booking.roomId);
        if (room) {
          room.currentOccupants = room.currentOccupants.filter(
            (id) => id.toString() !== booking.userId._id.toString()
          );
          room.status = 'available';
          await room.save();
        }
      }
      booking.status = 'cancelled';

      // Notify user
      await Notification.create({
        userId: booking.userId._id,
        title: 'Booking Cancelled',
        message: `Your booking request for ${hostelName} has been cancelled.`,
        type: 'booking',
      });
    }

    await booking.save();
    res.status(200).json(new ApiResponse(200, booking, `Booking status successfully updated to ${status}`));
  } catch (error) {
    next(error);
  }
};

export const checkoutStudent = async (req, res, next) => {
  try {
    const { id } = req.params; // Booking ID

    const booking = await Booking.findById(id).populate('userId', 'name email');
    if (!booking) {
      return next(new ApiError(404, 'Booking not found'));
    }

    // hostel_admin may only check out residents from their own assigned hostel
    if (!ensureOwnHostel(req, next, booking.hostelId)) return;

    if (booking.status !== 'approved') {
      return next(new ApiError(400, 'User is not currently checked into this hostel (booking status must be approved)'));
    }

    // Release room
    if (booking.roomId) {
      const room = await Room.findById(booking.roomId);
      if (room) {
        room.currentOccupants = room.currentOccupants.filter(
          (occId) => occId.toString() !== booking.userId._id.toString()
        );
        room.status = 'available';
        await room.save();
      }
    }

    booking.status = 'checked_out';
    await booking.save();

    // Notify user
    await Notification.create({
      userId: booking.userId._id,
      title: 'Checked Out',
      message: 'You have been successfully checked out. Your room allocation has been released.',
      type: 'booking',
    });

    res.status(200).json(new ApiResponse(200, booking, 'Student checked out successfully. Room released.'));
  } catch (error) {
    next(error);
  }
};
