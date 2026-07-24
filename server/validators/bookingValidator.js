import { body } from 'express-validator';

export const createBookingValidator = [
  body('hostelId')
    .notEmpty()
    .withMessage('Hostel ID is required')
    .isMongoId()
    .withMessage('Invalid Hostel ID format'),
  body('roomType')
    .notEmpty()
    .withMessage('Room type is required')
    .isIn(['Single', 'Double', 'Triple', 'Dorm'])
    .withMessage('Invalid room type'),
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
      const checkIn = new Date(req.body.checkInDate);
      const checkOut = new Date(value);

      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after the check-in date');
      }

      // Minimum living period: at least 1 month from check-in
      const minCheckOut = new Date(checkIn);
      minCheckOut.setMonth(minCheckOut.getMonth() + 1);
      if (checkOut < minCheckOut) {
        throw new Error('Minimum stay period is 1 month from the check-in date');
      }

      // Maximum living period: at most 2 years from check-in
      const maxCheckOut = new Date(checkIn);
      maxCheckOut.setFullYear(maxCheckOut.getFullYear() + 2);
      if (checkOut > maxCheckOut) {
        throw new Error('Maximum stay period is 2 years from the check-in date');
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
