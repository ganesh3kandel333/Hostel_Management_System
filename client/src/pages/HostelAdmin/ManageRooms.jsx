import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Bed, Plus, Edit, Trash2, Home, X, Check, AlertTriangle } from 'lucide-react';
import { getHostelRooms, createRoom, updateRoom, deleteRoom } from '../../api/roomApi.js';
import Loader from '../../components/Loader.jsx';

// Bed capacity must match the room type — a Single room always has 1 bed,
// a Double always has 2, a Triple always has 3. Only Dorm rooms genuinely
// vary in size, so that's the one type left editable.
const FIXED_CAPACITY_BY_TYPE = { Single: 1, Double: 2, Triple: 3 };

const ManageRooms = () => {
  const { user } = useSelector((state) => state.auth);
  const assignedHostel = user?.assignedHostel;
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  // Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Double');
  const [capacity, setCapacity] = useState(2);
  const [rent, setRent] = useState('');
  const [facilities, setFacilities] = useState('');
  const [roomStatus, setRoomStatus] = useState('available');

  const loadRooms = async (hostelId) => {
    if (!hostelId) return;
    setRoomsLoading(true);
    try {
      const res = await getHostelRooms(hostelId);
      if (res.success) {
        setRooms(res.data);
      }
    } catch (err) {
      toast.error('Failed to load rooms');
    } finally {
      setRoomsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignedHostel?._id) {
      loadRooms(assignedHostel._id);
    } else {
      setLoading(false);
    }
  }, [assignedHostel?._id]);

  // Whenever the room type changes, snap capacity to the fixed bed count for
  // that type (Single/Double/Triple). Dorm has no fixed value, so leave
  // whatever the admin has entered untouched (default to 4 if unset).
  const handleRoomTypeChange = (newType) => {
    setRoomType(newType);
    const fixedCapacity = FIXED_CAPACITY_BY_TYPE[newType];
    if (fixedCapacity !== undefined) {
      setCapacity(fixedCapacity);
    } else if (!capacity || FIXED_CAPACITY_BY_TYPE[roomType] !== undefined) {
      setCapacity(4);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setRoomNumber('');
    setRoomType('Double');
    setCapacity(FIXED_CAPACITY_BY_TYPE.Double);
    setRent('');
    setFacilities('');
    setShowModal(true);
  };

  const handleOpenEditModal = (room) => {
    setModalMode('edit');
    setSelectedRoomId(room._id);
    setRoomNumber(room.roomNumber);
    setRoomType(room.type);
    setCapacity(room.capacity);
    setRent(room.rent);
    setRoomStatus(room.status);
    setFacilities(room.facilities.join(', '));
    setShowModal(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomNumber || !rent) {
      toast.error('Please input room number and monthly rent price');
      return;
    }

    const facilitiesArray = facilities ? facilities.split(',').map((f) => f.trim()) : [];
    const payload = {
      hostelId: assignedHostel._id,
      roomNumber,
      type: roomType,
      capacity: parseInt(capacity),
      rent: parseFloat(rent),
      facilities: facilitiesArray,
      status: roomStatus,
    };

    try {
      let res;
      if (modalMode === 'add') {
        res = await createRoom(payload);
        if (res.success) toast.success('Room created successfully!');
      } else {
        res = await updateRoom(selectedRoomId, payload);
        if (res.success) toast.success('Room updated successfully!');
      }
      setShowModal(false);
      loadRooms(assignedHostel._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room details');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        const res = await deleteRoom(roomId);
        if (res.success) {
          toast.success('Room deleted successfully');
          loadRooms(assignedHostel._id);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete room');
      }
    }
  };

  if (loading) return <Loader />;

  if (!assignedHostel) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 bg-white p-12 rounded-xl border border-[#eaddd5]/40 shadow-sm text-center max-w-2xl mx-auto mt-6">
        <AlertTriangle size={32} className="text-amber-500" />
        <h2 className="text-lg font-bold text-[#2a1a12]">No Hostel Assigned</h2>
        <p className="text-sm text-[#9c8b83]">
          Your account isn't linked to a hostel yet. Please contact the Super Admin to get assigned to one before you can manage rooms.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a1a12]">Manage Rooms</h1>
          <p className="text-[#6b5c54] text-sm">Create, edit, and audit room allocations in your hostel.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] active:scale-95 text-white font-semibold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus size={18} /> Add New Room
        </button>
      </div>

      {/* Your assigned hostel (read-only) */}
      <div className="bg-white p-5 rounded-2xl border border-[#eaddd5]/40 shadow-sm flex items-center gap-3">
        <Home size={20} className="text-[#d84e32] shrink-0" />
        <span className="text-sm font-semibold text-[#2a1a12]">Managing:</span>
        <span className="px-3 py-1 bg-[#fdece6] text-[#d84e32] text-sm font-bold rounded-lg">
          {assignedHostel.name} — {assignedHostel.city}
        </span>
      </div>

      {/* Rooms Table */}
      {roomsLoading ? (
        <Loader />
      ) : rooms.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#eaddd5]/40 shadow-sm text-[#6b5c54] text-sm">
          No rooms registered in this hostel yet. Click "Add New Room" to add inventory.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#eaddd5]/45 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fdece6] text-[#2a1a12] text-xs font-bold uppercase tracking-wider border-b border-[#eaddd5]/40">
                  <th className="px-6 py-4">Room No</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Occupancy</th>
                  <th className="px-6 py-4">Monthly Rent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Facilities</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaddd5]/30 text-sm">
                {rooms.map((r) => (
                  <tr key={r._id} className="hover:bg-[#fdece6]/30 text-[#2a1a12] transition-colors">
                    <td className="px-6 py-4 font-bold text-[#d84e32]">{r.roomNumber}</td>
                    <td className="px-6 py-4 capitalize">{r.type}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#2a1a12]">{r.currentOccupants?.length} / {r.capacity} Beds</span>
                        {r.currentOccupants && r.currentOccupants.length > 0 && (
                          <span className="text-[10px] text-[#9c8b83] mt-0.5 max-w-[150px] truncate" title={r.currentOccupants.map(o => o.name).join(', ')}>
                            Occupants: {r.currentOccupants.map(o => o.name).join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#2a1a12]">Rs. {r.rent}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${
                          r.status === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'full'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-[#6b5c54]">{r.facilities.join(', ')}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(r)}
                          className="p-2 text-[#9c8b83] hover:text-[#d84e32] hover:bg-[#fdece6] rounded-lg cursor-pointer transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(r._id)}
                          className="p-2 text-[#9c8b83] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Layout */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div onClick={() => setShowModal(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          
          <div className="bg-white border border-[#eaddd5]/50 max-w-md w-full p-6 rounded-2xl shadow-xl relative z-10 animate-fade-in text-[#2a1a12]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#2a1a12] capitalize">
                {modalMode === 'add' ? 'Add Room' : 'Edit Room Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-[#9c8b83] hover:text-[#2a1a12] hover:bg-[#fdece6] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="flex flex-col gap-4">
          
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Room Number</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-sm text-[#2a1a12] placeholder-gray-400 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b5c54]">Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => handleRoomTypeChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-sm text-[#2a1a12] outline-none transition-all cursor-pointer"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                    <option value="Dorm">Dormitory</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b5c54]">Capacity (Beds)</label>
                  <input
                    type="number"
                    min={FIXED_CAPACITY_BY_TYPE[roomType] !== undefined ? FIXED_CAPACITY_BY_TYPE[roomType] : 2}
                    max={FIXED_CAPACITY_BY_TYPE[roomType] !== undefined ? FIXED_CAPACITY_BY_TYPE[roomType] : 10}
                    value={capacity}
                    disabled={FIXED_CAPACITY_BY_TYPE[roomType] !== undefined}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-sm text-[#2a1a12] outline-none transition-all disabled:bg-[#f7f5f4] disabled:text-[#9c8b83] disabled:cursor-not-allowed"
                  />
                  {FIXED_CAPACITY_BY_TYPE[roomType] !== undefined && (
                    <span className="text-[10px] text-[#9c8b83]">
                      {roomType} rooms are always {FIXED_CAPACITY_BY_TYPE[roomType]} bed{FIXED_CAPACITY_BY_TYPE[roomType] === 1 ? '' : 's'}.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b5c54]">Monthly Rent ()</label>
                  <input
                    type="number"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-sm text-[#2a1a12] placeholder-gray-400 outline-none transition-all"
                  />
                </div>
                {modalMode === 'edit' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#6b5c54]">Status</label>
                    <select
                      value={roomStatus}
                      onChange={(e) => setRoomStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-sm text-[#2a1a12] outline-none transition-all cursor-pointer"
                    >
                      <option value="available">Available</option>
                      <option value="full">Full</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Facilities (comma separated)</label>
                <input
                  type="text"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-sm text-[#2a1a12] placeholder-gray-400 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#e6472d] hover:bg-[#c73a22] active:scale-98 text-white font-semibold rounded-xl transition-all cursor-pointer mt-4 flex items-center justify-center gap-1.5 shadow-md shadow-[#e6472d]/20"
              >
                <Check size={18} /> Save Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRooms;
