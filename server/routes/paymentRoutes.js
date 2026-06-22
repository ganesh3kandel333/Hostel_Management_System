import { Router } from 'express';
import {
  createPayment,
  verifyPayment,
  getMyPayments,
  getAllPayments,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = Router();

// Student payments
router.post('/', protect, authorize('student'), uploadSingleImage('receiptImage'), createPayment);
router.get('/my', protect, authorize('student'), getMyPayments);

// Administrative audit routes
router.get('/all', protect, authorize('super_admin', 'hostel_admin'), getAllPayments);
router.put('/verify/:id', protect, authorize('super_admin', 'hostel_admin'), verifyPayment);

export default router;
