import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'hostel_cloud' &&
    process.env.CLOUDINARY_API_KEY !== '123456789012345'
  );
};

/**
 * Saves a file buffer to local disk under /server/uploads/<folder>/ and
 * returns a URL that the Express server serves statically. This guarantees
 * the image actually shown is the image the user uploaded.
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @param {string} originalName
 * @returns {Promise<string>} Public URL of the saved image
 */
const saveLocally = (fileBuffer, folder, originalName = 'image.jpg') => {
  return new Promise((resolve, reject) => {
    try {
      const folderPath = path.join(UPLOADS_ROOT, folder);
      fs.mkdirSync(folderPath, { recursive: true });

      const ext = path.extname(originalName) || '.jpg';
      const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      const filePath = path.join(folderPath, fileName);

      fs.writeFile(filePath, fileBuffer, (err) => {
        if (err) return reject(err);
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
        resolve(`${baseUrl}/uploads/${folder}/${fileName}`);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Uploads a file buffer. Uses Cloudinary when real credentials are configured,
 * otherwise saves the actual uploaded file to local disk and serves it statically.
 * Either way, the URL returned always points to the file the user actually uploaded.
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @param {string} originalName
 * @returns {Promise<string>} URL of the image
 */
export const uploadToCloudinary = (fileBuffer, folder = 'hostel-management', originalName = 'image.jpg') => {
  if (!isCloudinaryConfigured()) {
    logger.info('Cloudinary credentials not configured. Saving uploaded file locally instead.');
    return saveLocally(fileBuffer, folder, originalName);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
