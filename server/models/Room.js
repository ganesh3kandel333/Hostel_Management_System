import mongoose from 'mongoose';


export const FIXED_CAPACITY_BY_TYPE = { Single: 1, Double: 2, Triple: 3 };

const roomSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: [true, 'Hostel reference is required'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: ['Single', 'Double', 'Triple', 'Dorm'],
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    rent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
    },
    facilities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['available', 'full', 'maintenance'],
      default: 'available',
    },
    currentOccupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure room numbers are unique within a single hostel
roomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });


roomSchema.pre('validate', function (next) {
  const fixedCapacity = FIXED_CAPACITY_BY_TYPE[this.type];
  if (fixedCapacity !== undefined) {
    this.capacity = fixedCapacity;
  }
  next();
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
