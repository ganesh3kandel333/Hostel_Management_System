import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getHostelComplaints,
  updateComplaintStatus,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

// Student complaint filing & listings
router.post('/', protect, authorize('student'), createComplaint);
router.get('/my', protect, authorize('student'), getMyComplaints);

// Administrative logs & feedback
router.get('/all', protect, authorize('super_admin', 'hostel_admin'), getHostelComplaints);
router.put('/status/:id', protect, authorize('super_admin', 'hostel_admin'), updateComplaintStatus);

export default router;
