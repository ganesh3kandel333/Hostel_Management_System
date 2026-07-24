import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Slide image is required'],
    },
    label: {
      type: String,
      trim: true,
      default: '',
    },
    // Lower order shows first. Managed via the reorder endpoint / drag controls.
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);
export default HeroSlide;
