import Room, { FIXED_CAPACITY_BY_TYPE } from '../models/Room.js';
import Hostel from '../models/Hostel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { ensureOwnHostel } from '../middleware/roleMiddleware.js';

export const createRoom = async (req, res, next) => {
  try {
    const { hostelId, roomNumber, type, capacity, rent, facilities } = req.body;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return next(new ApiError(404, 'Hostel not found'));
    }

    // hostel_admin may only add rooms to the hostel they manage
    if (!ensureOwnHostel(req, next, hostel._id)) return;

    // Check if room number already exists in this hostel
    const existingRoom = await Room.findOne({ hostelId, roomNumber });
    if (existingRoom) {
      return next(new ApiError(409, `Room ${roomNumber} already exists in this hostel`));
    }

    const room = await Room.create({
      hostelId,
      roomNumber,
      type,
      capacity,
      rent,
      facilities: facilities || [],
      status: 'available',
    });

    res.status(201).json(new ApiResponse(201, room, 'Room created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getHostelRooms = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const { status, type } = req.query;

    // hostel_admin may only view rooms for the hostel they manage
    if (!ensureOwnHostel(req, next, hostelId)) return;

    const query = { hostelId };
    if (status) query.status = status;
    if (type) query.type = type;

    const rooms = await Room.find(query).populate('currentOccupants', 'name email phoneNumber');
    res.status(200).json(new ApiResponse(200, rooms, 'Rooms fetched successfully'));
  } catch (error) {
    next(error);
  }
};

// Public/student-facing: for a given hostel, return only the room types that
// actually have a vacant bed right now (status 'available' and occupants
// below capacity). Used by the booking form so a student only ever sees
// "Single", "Double", etc. as an option when one is genuinely bookable —
// showing a type with zero real availability just leads to a confused
// student submitting a request that can never be approved.
export const getAvailableRoomTypes = async (req, res, next) => {
  try {
    const { hostelId } = req.params;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return next(new ApiError(404, 'Hostel not found'));
    }

    const rooms = await Room.find({
      hostelId,
      status: { $ne: 'maintenance' },
      $expr: { $lt: [{ $size: '$currentOccupants' }, '$capacity'] },
    });

    // Group by room type: how many vacant beds, and the cheapest rent on offer
    const summary = {};
    for (const room of rooms) {
      const vacancies = room.capacity - room.currentOccupants.length;
      if (!summary[room.type]) {
        summary[room.type] = { type: room.type, availableRooms: 0, availableBeds: 0, rent: room.rent };
      }
      summary[room.type].availableRooms += 1;
      summary[room.type].availableBeds += vacancies;
      summary[room.type].rent = Math.min(summary[room.type].rent, room.rent);
    }

    const availableTypes = Object.values(summary);

    res.status(200).json(new ApiResponse(200, availableTypes, 'Available room types fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id).populate('currentOccupants', 'name email phoneNumber');
    
    if (!room) {
      return next(new ApiError(404, 'Room not found'));
    }

    res.status(200).json(new ApiResponse(200, room, 'Room details fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roomNumber, type, capacity, rent, facilities, status } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return next(new ApiError(404, 'Room not found'));
    }

    // hostel_admin may only update rooms belonging to their own hostel
    if (!ensureOwnHostel(req, next, room.hostelId)) return;

    if (roomNumber && roomNumber !== room.roomNumber) {
      // Check uniqueness of new room number in the same hostel
      const existingRoom = await Room.findOne({ hostelId: room.hostelId, roomNumber });
      if (existingRoom) {
        return next(new ApiError(409, `Room ${roomNumber} already exists in this hostel`));
      }
      room.roomNumber = roomNumber;
    }

    if (type) {
      const newFixedCapacity = FIXED_CAPACITY_BY_TYPE[type];
      if (newFixedCapacity !== undefined && newFixedCapacity < room.currentOccupants.length) {
        return next(
          new ApiError(
            400,
            `Cannot change room type to ${type} (${newFixedCapacity} bed capacity) while it has ${room.currentOccupants.length} current occupant(s)`
          )
        );
      }
      room.type = type;
    }

    // Capacity is fixed by type for Single/Double/Triple (enforced on the
    // model itself), so a submitted value only ever takes effect for Dorm.
    const effectiveType = type || room.type;
    if (capacity && FIXED_CAPACITY_BY_TYPE[effectiveType] === undefined) {
      if (capacity < room.currentOccupants.length) {
        return next(
          new ApiError(
            400,
            `Cannot reduce capacity below current occupant count (${room.currentOccupants.length})`
          )
        );
      }
      room.capacity = capacity;
    }
    if (rent) room.rent = rent;
    if (facilities) room.facilities = facilities;
    if (status) room.status = status;

    // Recalculate room availability state
    if (room.currentOccupants.length >= room.capacity) {
      room.status = 'full';
    } else if (room.status === 'full' && room.currentOccupants.length < room.capacity) {
      room.status = 'available';
    }

    await room.save();
    res.status(200).json(new ApiResponse(200, room, 'Room updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room) {
      return next(new ApiError(404, 'Room not found'));
    }

    // hostel_admin may only delete rooms belonging to their own hostel
    if (!ensureOwnHostel(req, next, room.hostelId)) return;

    if (room.currentOccupants.length > 0) {
      return next(new ApiError(400, 'Cannot delete a room that has occupants'));
    }

    await Room.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, null, 'Room deleted successfully'));
  } catch (error) {
    next(error);
  }
};
