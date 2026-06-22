import { body } from 'express-validator';

export const roomValidator = [
  body('roomNumber')
    .notEmpty()
    .withMessage('Room number is required')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Room number must be between 1 and 10 characters'),
  body('type')
    .notEmpty()
    .withMessage('Room type is required')
    .isIn(['Single', 'Double', 'Triple', 'Dorm'])
    .withMessage('Room type must be Single, Double, Triple, or Dorm'),
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isInt({ min: 1, max: 10 })
    .withMessage('Capacity must be an integer between 1 and 10'),
  body('rent')
    .notEmpty()
    .withMessage('Monthly rent is required')
    .isFloat({ min: 0 })
    .withMessage('Rent must be a positive number'),
  body('facilities')
    .optional()
    .isArray()
    .withMessage('Facilities must be an array of strings'),
];
