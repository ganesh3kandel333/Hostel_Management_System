import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  updateBookingStatus,
  checkoutStudent,
  requestCheckout,
  declineCheckoutRequest,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  createBookingValidator,
  updateBookingStatusValidator,
} from '../validators/bookingValidator.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = Router();

// Student routes
router.post('/', protect, authorize('student'), createBookingValidator, validate, createBooking);
router.get('/my', protect, authorize('student'), getMyBookings);

// Admin-only list
router.get('/all', protect, authorize('super_admin', 'hostel_admin'), getAllBookings);

// Detailed view and updates
router.get('/:id', protect, getBookingById);
router.put(
  '/status/:id',
  protect,
  authorize('super_admin', 'hostel_admin'),
  updateBookingStatusValidator,
  validate,
  updateBookingStatus
);

router.put(
  '/checkout/:id',
  protect,
  authorize('super_admin', 'hostel_admin'),
  checkoutStudent
);

// Student applies for check out on their own active stay
router.put(
  '/checkout-request/:id',
  protect,
  authorize('student'),
  requestCheckout
);

// Admin declines a pending checkout application (resident stays checked in)
router.put(
  '/checkout-request/:id/decline',
  protect,
  authorize('super_admin', 'hostel_admin'),
  declineCheckoutRequest
);

export default router;
