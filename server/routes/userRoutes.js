import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserStatus,
  createHostelAdmin,
  updateHostelAdmin,
  deleteUser,
  assignHostelToAdmin,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = Router();

// Profile operations (Accessible to any logged-in user)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, uploadSingleImage('avatar'), updateProfile);
router.put('/profile/change-password', protect, changePassword);

// Admin-only operations
router.get('/admin/all', protect, authorize('super_admin'), getAllUsers);
router.post('/admin/hostel-admin', protect, authorize('super_admin'), uploadSingleImage('avatar'), createHostelAdmin);
router.put('/admin/hostel-admin/:id', protect, authorize('super_admin'), uploadSingleImage('avatar'), updateHostelAdmin);
router.delete('/admin/users/:id', protect, authorize('super_admin'), deleteUser);
router.put('/admin/status/:id', protect, authorize('super_admin'), updateUserStatus);
router.put('/admin/assign-hostel/:id', protect, authorize('super_admin'), assignHostelToAdmin);

export default router;
