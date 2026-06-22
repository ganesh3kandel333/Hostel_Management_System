import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getMyNotifications);
router.put('/read/:id', protect, markNotificationAsRead);
router.put('/read-all', protect, markAllAsRead);

export default router;
