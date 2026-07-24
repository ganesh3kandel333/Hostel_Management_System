import { Router } from 'express';
import {
  createHostel,
  getAllHostels,
  getHostelById,
  updateHostel,
  deleteHostel,
} from '../controllers/hostelController.js';
import { protect, attachUserIfPresent } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = Router();

// Publicly readable for promotions (scoped to own hostel if a hostel_admin is logged in)
router.get('/', attachUserIfPresent, getAllHostels);
router.get('/:id', getHostelById);

// Admin / Super Admin write permissions
// hostel_admin may create their own hostel (limited to one, enforced in controller)
router.post('/', protect, authorize('super_admin', 'hostel_admin'), uploadSingleImage('image'), createHostel);
router.put('/:id', protect, authorize('super_admin', 'hostel_admin'), uploadSingleImage('image'), updateHostel);
router.delete('/:id', protect, authorize('super_admin'), deleteHostel);

export default router;
