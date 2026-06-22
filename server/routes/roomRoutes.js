import { Router } from 'express';
import {
  createRoom,
  getHostelRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { roomValidator } from '../validators/roomValidator.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = Router();

// Room listings (admin-only: students never browse rooms directly — booking
// auto-resolves an available room of the requested type server-side)
router.get('/hostel/:hostelId', protect, authorize('super_admin', 'hostel_admin'), getHostelRooms);
router.get('/:id', protect, getRoomById);

// Admin-only management
router.post('/', protect, authorize('super_admin', 'hostel_admin'), roomValidator, validate, createRoom);
router.put('/:id', protect, authorize('super_admin', 'hostel_admin'), updateRoom);
router.delete('/:id', protect, authorize('super_admin', 'hostel_admin'), deleteRoom);

export default router;
