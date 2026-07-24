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
        new ApiError(
          400,
          `You can only book one hostel at a time. You already have a ${activeBooking.status} booking. Please check out of your current hostel before applying to a new one.`
        )
      );
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return next(new ApiError(404, 'Hostel not found'));
    }

    // Find a room of the requested type that actually has a vacant bed right
    // now (not just any room of that type — one that may already be full).
    // Pick the cheapest such room to calculate rent, since the specific bed
    // isn't assigned until an admin approves the request.
    const availableRoom = await Room.findOne({
      hostelId,
      type: roomType,
      status: { $ne: 'maintenance' },
      $expr: { $lt: [{ $size: '$currentOccupants' }, '$capacity'] },
    }).sort({ rent: 1 });

    if (!availableRoom) {
      return next(
        new ApiError(404, `No '${roomType}' rooms are currently available in this hostel`)
      );
    }
    const sampleRoom = availableRoom;

    // Calculate stay duration in calendar months (not days / 30 — most
    // calendar months are 31, 28, or 29 days, so a plain 1-month stay like
    // Jan 1 -> Feb 1 is 31 days, and days/30 rounded that up to 2 months,
    // silently doubling the rent shown to the student). Count full calendar
    // months between the two dates, rounding any partial trailing month up.
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    let months =
      (checkOut.getFullYear() - checkIn.getFullYear()) * 12 +
      (checkOut.getMonth() - checkIn.getMonth());
    if (checkOut.getDate() > checkIn.getDate()) {
      months += 1; // stayed a few extra days past a full month — round up
    }
    months = Math.max(1, months);

    const totalAmount = sampleRoom.rent * months;

    const booking = await Booking.create({
      userId,
      hostelId,
      roomType,
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
    // SECURITY: if two requests from the same user race past the app-level
    // check above, the partial unique index on Booking rejects the second
    // insert at the DB level (error code 11000). Surface that as a normal
    // 400 instead of a raw duplicate-key 500.
    if (error?.code === 11000) {
      return next(
        new ApiError(400, 'You can only book one hostel at a time. You already have an active booking.')
      );
    }
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

    // SECURITY: enforce a valid state machine. Without this, a booking that
    // was already approved/rejected/cancelled/checked-out could be
    // re-processed (e.g. re-approving a checked-out booking would silently
    // re-add the student as a room occupant without a fresh request).
    if ((status === 'approved' || status === 'rejected') && booking.status !== 'pending') {
      return next(
        new ApiError(400, `This booking has already been ${booking.status} and cannot be ${status} again.`)
      );
    }
    if (status === 'cancelled' && !['pending', 'approved'].includes(booking.status)) {
      return next(new ApiError(400, `A ${booking.status} booking cannot be cancelled.`));
    }

    const hostel = await Hostel.findById(booking.hostelId);
    const hostelName = hostel ? hostel.name : 'Hostel';

    if (status === 'approved') {
      if (!roomId) {
        return next(new ApiError(400, 'Room ID is required to approve booking'));
      }

      const roomToCheck = await Room.findById(roomId);
      if (!roomToCheck) {
        return next(new ApiError(404, 'Room not found'));
      }
      if (roomToCheck.hostelId.toString() !== booking.hostelId.toString()) {
        return next(new ApiError(400, 'Room does not belong to the selected hostel'));
      }

      // SECURITY: assign the occupant with a single atomic update instead of
      // "read capacity, then write" — two admins approving different bookings
      // into the same last-available bed at the same moment could otherwise
      // both pass the capacity check and overbook the room. The $expr guard
      // re-checks capacity as part of the same atomic operation.
      const room = await Room.findOneAndUpdate(
        {
          _id: roomId,
          status: { $ne: 'maintenance' },
          currentOccupants: { $ne: booking.userId._id },
          $expr: { $lt: [{ $size: '$currentOccupants' }, '$capacity'] },
        },
        { $push: { currentOccupants: booking.userId._id } },
        { new: true }
      );

      if (!room) {
        return next(new ApiError(400, 'Selected room is already at full capacity or unavailable'));
      }

      if (room.currentOccupants.length >= room.capacity && room.status !== 'full') {
        room.status = 'full';
        await room.save();
      }

      // Assign room to booking
      booking.roomId = roomId;
      booking.assignedRoomNumber = room.roomNumber;
      booking.status = 'approved';

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

    await booking.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, booking, `Booking status successfully updated to ${status}`));
  } catch (error) {
    next(error);
  }
};

export const requestCheckout = async (req, res, next) => {
  try {
    const { id } = req.params; // Booking ID
    const userId = req.user._id;

    const booking = await Booking.findById(id).populate('hostelId', 'name');
    if (!booking) {
      return next(new ApiError(404, 'Booking not found'));
    }

    if (booking.userId.toString() !== userId.toString()) {
      return next(new ApiError(403, 'You do not have permission to modify this booking'));
    }

    if (booking.status !== 'approved') {
      return next(new ApiError(400, 'You can only apply for check out from an approved, active stay'));
    }

    if (booking.checkoutRequested) {
      return next(new ApiError(400, 'You have already applied for check out. Awaiting admin confirmation.'));
    }

    booking.checkoutRequested = true;
    booking.checkoutRequestedAt = new Date();
    await booking.save({ validateBeforeSave: false });

    // Notify the hostel admin managing this booking's hostel (and super admins)
    // so they know a resident is waiting on a checkout to be finalized.
    const hostel = await Hostel.findById(booking.hostelId._id || booking.hostelId);
    const notifyRecipients = [];
    if (hostel?.admin) notifyRecipients.push(hostel.admin);

    if (notifyRecipients.length > 0) {
      await Notification.create(
        notifyRecipients.map((recipientId) => ({
          userId: recipientId,
          title: 'Checkout Requested',
          message: `${req.user.name} has applied to check out of ${hostel.name}. Please review and finalize.`,
          type: 'booking',
        }))
      );
    }

    await Notification.create({
      userId,
      title: 'Checkout Application Submitted',
      message: `Your request to check out of ${booking.hostelId?.name || 'your hostel'} has been submitted and is awaiting confirmation.`,
      type: 'booking',
    });

    res.status(200).json(new ApiResponse(200, booking, 'Checkout application submitted successfully'));
  } catch (error) {
    next(error);
  }
};

export const declineCheckoutRequest = async (req, res, next) => {
  try {
    const { id } = req.params; // Booking ID

    const booking = await Booking.findById(id).populate('userId', 'name email');
    if (!booking) {
      return next(new ApiError(404, 'Booking not found'));
    }

    if (!ensureOwnHostel(req, next, booking.hostelId)) return;

    if (!booking.checkoutRequested) {
      return next(new ApiError(400, 'This booking has no pending checkout request'));
    }

    booking.checkoutRequested = false;
    booking.checkoutRequestedAt = undefined;
    await booking.save({ validateBeforeSave: false });

    await Notification.create({
      userId: booking.userId._id,
      title: 'Checkout Request Declined',
      message: 'Your checkout application was declined by the hostel admin. You remain checked into your room.',
      type: 'booking',
    });

    res.status(200).json(new ApiResponse(200, booking, 'Checkout request declined; resident remains checked in'));
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
    booking.checkoutRequested = false;
    await booking.save({ validateBeforeSave: false });

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
