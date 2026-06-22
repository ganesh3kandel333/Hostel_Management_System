import ApiError from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Global Express Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert raw native errors to ApiError instances
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], error.stack);
  }

  // Handle Mongoose duplicate key errors (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field '${field}'. Please use another value!`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose Cast Error (invalid ObjectIds)
  if (err.name === 'CastError') {
    const message = `Invalid resource identifier: ${err.value}`;
    error = new ApiError(400, message);
  }

  // Log the error details
  logger.error(
    `API ERROR [${error.statusCode}]: ${error.message} (Route: ${req.method} ${req.originalUrl})`
  );

  // Send JSON response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors.length > 0 ? error.errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};
export default errorHandler;
