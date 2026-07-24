import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: [true, 'Hostel reference is required'],
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    roomType: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Dorm'],
      required: [true, 'Requested room type is required'],
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'checked_out'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    assignedRoomNumber: {
      type: String,
      trim: true,
    },
 
    checkoutRequested: {
      type: Boolean,
      default: false,
    },
    checkoutRequestedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

bookingSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } },
    name: 'one_active_booking_per_user',
  }
);

export default Booking;
