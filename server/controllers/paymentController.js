import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { processPaymentSimulator } from '../services/paymentService.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { ensureOwnHostel } from '../middleware/roleMiddleware.js';

export const createPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod, amount, transactionId, cardDetails } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new ApiError(404, 'Associated booking not found'));
    }

    if (booking.userId.toString() !== userId.toString()) {
      return next(new ApiError(403, 'Unauthorized to make payment for this booking'));
    }

    let pStatus = 'pending';
    let finalTxnId = transactionId;
    let receiptUrl = '';

    // If digital gateway card checkout
    if (paymentMethod === 'card') {
      const chargeResult = await processPaymentSimulator(parseFloat(amount));
      if (!chargeResult.success) {
        return next(new ApiError(400, chargeResult.message));
      }
      pStatus = 'completed';
      finalTxnId = chargeResult.transactionId;
    } else {
      // Manual bank transfer or cash requires receipt image upload
      if (!req.file) {
        return next(
          new ApiError(400, 'Payment receipt upload is required for manual bank transfers')
        );
      }
      receiptUrl = await uploadToCloudinary(req.file.buffer, 'receipts', req.file.originalname);
      if (!finalTxnId) {
        finalTxnId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      }
    }

    const payment = await Payment.create({
      bookingId,
      userId,
      amount,
      status: pStatus,
      paymentMethod,
      transactionId: finalTxnId,
      receiptImage: receiptUrl,
    });

    // Notify user
    await Notification.create({
      userId,
      title: 'Payment Submitted',
      message: `Your payment of $${amount} has been recorded (Status: ${pStatus.toUpperCase()}).`,
      type: 'payment',
    });

    res.status(201).json(new ApiResponse(201, payment, 'Payment transaction recorded successfully'));
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'completed' or 'failed'

    if (!['completed', 'failed'].includes(status)) {
      return next(new ApiError(400, 'Invalid payment validation state'));
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return next(new ApiError(404, 'Payment transaction not found'));
    }

    if (req.user.role === 'hostel_admin') {
      const booking = await Booking.findById(payment.bookingId);
      if (!booking) {
        return next(new ApiError(404, 'Associated booking not found'));
      }
      if (!ensureOwnHostel(req, next, booking.hostelId)) return;
    }

    payment.status = status;
    await payment.save();

    // Notify resident
    await Notification.create({
      userId: payment.userId,
      title: `Payment ${status.toUpperCase()}`,
      message: `Your payment request of $${payment.amount} has been verified and marked as ${status.toUpperCase()}.`,
      type: 'payment',
    });

    res.status(200).json(new ApiResponse(200, payment, `Payment transaction marked as ${status}`));
  } catch (error) {
    next(error);
  }
};

export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate({
        path: 'bookingId',
        populate: { path: 'hostelId', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, payments, 'Payment history fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    if (req.user.role === 'hostel_admin') {
      // A hostel_admin only ever sees payments tied to bookings within their
      // own assigned hostel. Resolve the relevant booking IDs first since
      // Payment does not store hostelId directly.
      if (!req.user.assignedHostel) {
        return res.status(200).json(new ApiResponse(200, [], 'All payments records fetched successfully'));
      }
      const hostelBookings = await Booking.find({ hostelId: req.user.assignedHostel }).select('_id');
      query.bookingId = { $in: hostelBookings.map((b) => b._id) };
    }

    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .populate({
        path: 'bookingId',
        populate: { path: 'hostelId', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, payments, 'All payments records fetched successfully'));
  } catch (error) {
    next(error);
  }
};
