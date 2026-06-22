import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { ensureOwnHostel } from '../middleware/roleMiddleware.js';

export const createComplaint = async (req, res, next) => {
  try {
    const { hostelId, subject, description } = req.body;
    const userId = req.user._id;

    if (!hostelId || !subject || !description) {
      return next(new ApiError(400, 'Hostel ID, subject, and description are required'));
    }

    const complaint = await Complaint.create({
      userId,
      hostelId,
      subject,
      description,
      status: 'pending',
    });

    res.status(201).json(new ApiResponse(201, complaint, 'Complaint filed successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id })
      .populate('hostelId', 'name city')
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, complaints, 'Your complaints fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const getHostelComplaints = async (req, res, next) => {
  try {
    const { hostelId, status } = req.query;
    const query = {};

    if (req.user.role === 'hostel_admin') {
      // A hostel_admin only ever sees complaints for their own assigned hostel,
      // regardless of what hostelId filter (if any) was requested.
      if (!req.user.assignedHostel) {
        return res.status(200).json(new ApiResponse(200, [], 'Complaints fetched successfully'));
      }
      query.hostelId = req.user.assignedHostel;
    } else if (hostelId) {
      query.hostelId = hostelId;
    }

    if (status) query.status = status;

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email phoneNumber')
      .populate('hostelId', 'name city')
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, complaints, 'Complaints fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      return next(new ApiError(400, 'Invalid complaint status'));
    }

    const complaint = await Complaint.findById(id).populate('hostelId', 'name');
    if (!complaint) {
      return next(new ApiError(404, 'Complaint not found'));
    }

    // hostel_admin may only respond to complaints for their own assigned hostel
    if (!ensureOwnHostel(req, next, complaint.hostelId._id)) return;

    complaint.status = status;
    if (reply) complaint.reply = reply;

    await complaint.save();

    // Create user notification
    await Notification.create({
      userId: complaint.userId,
      title: `Complaint Status: ${status.toUpperCase().replace('_', ' ')}`,
      message: `Your complaint regarding '${complaint.subject}' at ${complaint.hostelId.name} status updated. Reply: ${reply || 'No comments'}`,
      type: 'complaint',
    });

    res.status(200).json(new ApiResponse(200, complaint, 'Complaint status updated successfully'));
  } catch (error) {
    next(error);
  }
};
