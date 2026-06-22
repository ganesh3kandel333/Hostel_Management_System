import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/authController.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/authValidator.js';
import { validate } from '../middleware/validationMiddleware.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', uploadSingleImage('avatar'), registerValidator, validate, register);
router.get('/verify-email', verifyEmail);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);
router.post('/logout', protect, logout);

export default router;
