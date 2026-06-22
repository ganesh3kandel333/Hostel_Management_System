import { upload } from '../config/multer.js';
import ApiError from '../utils/ApiError.js';

/**
 * Returns a middleware to handle a single file upload with error catching.
 * @param {string} fieldName Form field name containing the file
 */
export const uploadSingleImage = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, (err) => {
      if (err) {
        return next(new ApiError(400, err.message));
      }
      next();
    });
  };
};
