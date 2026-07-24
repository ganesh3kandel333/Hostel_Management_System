import HeroSlide from '../models/HeroSlide.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Public — landing page fetches these to render the hero slider.
export const getHeroSlides = async (req, res, next) => {
  try {
    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json(new ApiResponse(200, slides, 'Hero slides fetched successfully'));
  } catch (error) {
    next(error);
  }
};

// Super Admin only — add a new slide to the landing page slider.
export const createHeroSlide = async (req, res, next) => {
  try {
    const { label } = req.body;

    if (!req.file) {
      return next(new ApiError(400, 'A slide image is required'));
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, 'hero-slides', req.file.originalname);

    // New slides go to the end of the order by default.
    const lastSlide = await HeroSlide.findOne().sort({ order: -1 });
    const nextOrder = lastSlide ? lastSlide.order + 1 : 0;

    const slide = await HeroSlide.create({
      image: imageUrl,
      label: label || '',
      order: nextOrder,
      createdBy: req.user._id,
    });

    res.status(201).json(new ApiResponse(201, slide, 'Hero slide added successfully'));
  } catch (error) {
    next(error);
  }
};

// Super Admin only — update a slide's label and/or replace its image.
export const updateHeroSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    const slide = await HeroSlide.findById(id);
    if (!slide) {
      return next(new ApiError(404, 'Hero slide not found'));
    }

    if (label !== undefined) slide.label = label;

    if (req.file) {
      slide.image = await uploadToCloudinary(req.file.buffer, 'hero-slides', req.file.originalname);
    }

    await slide.save();
    res.status(200).json(new ApiResponse(200, slide, 'Hero slide updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Super Admin only — remove a slide from the landing page slider.
export const deleteHeroSlide = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slide = await HeroSlide.findById(id);
    if (!slide) {
      return next(new ApiError(404, 'Hero slide not found'));
    }

    await HeroSlide.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, null, 'Hero slide removed successfully'));
  } catch (error) {
    next(error);
  }
};

// Super Admin only — persist a new drag-and-drop order for all slides at once.
export const reorderHeroSlides = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return next(new ApiError(400, 'orderedIds must be a non-empty array of slide IDs'));
    }

    await Promise.all(
      orderedIds.map((id, index) => HeroSlide.findByIdAndUpdate(id, { order: index }))
    );

    const slides = await HeroSlide.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json(new ApiResponse(200, slides, 'Hero slide order updated successfully'));
  } catch (error) {
    next(error);
  }
};
