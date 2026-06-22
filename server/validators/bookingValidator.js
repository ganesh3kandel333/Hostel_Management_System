import { body } from 'express-validator';

export const createBookingValidator = [
  body('hostelId')
    .notEmpty()
    .withMessage('Hostel ID is required')
    .isMongoId()
    .withMessage('Invalid Hostel ID format'),
  body('checkInDate')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Check-in date must be a valid ISO8601 date')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),
  body('checkOutDate')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Check-out date must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.checkInDate)) {
        throw new Error('Check-out date must be after the check-in date');
      }
      return true;
    }),
];

export const updateBookingStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Invalid booking status'),
  body('rejectionReason')
    .optional()
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Rejection reason is required when status is rejected'),
  body('roomId')
    .optional()
    .if(body('status').equals('approved'))
    .isMongoId()
    .withMessage('Valid Room ID is required when status is approved'),
];
