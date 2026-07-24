import { Router } from 'express';
import {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
} from '../controllers/heroSlideController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = Router();

// Public — landing page reads the current slider from here
router.get('/', getHeroSlides);

// Super Admin only — manage the landing page slider
router.post('/', protect, authorize('super_admin'), uploadSingleImage('image'), createHeroSlide);

// Must be declared before '/:id' so it isn't swallowed by the id param route
router.put('/reorder', protect, authorize('super_admin'), reorderHeroSlides);

router.put('/:id', protect, authorize('super_admin'), uploadSingleImage('image'), updateHeroSlide);
router.delete('/:id', protect, authorize('super_admin'), deleteHeroSlide);

export default router;
