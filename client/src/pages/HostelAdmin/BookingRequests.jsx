import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FileSpreadsheet, Check, X, ShieldAlert, User, Calendar, RefreshCw } from 'lucide-react';
import { getAllBookings, updateBookingStatus } from '../../api/bookingApi.js';
import { getHostelRooms } from '../../api/roomApi.js';
import Loader from '../../components/Loader.jsx';

const BookingRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Approval Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Rejection Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getAllBookings();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      toast.error('Failed to load bookings list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleOpenApproveModal = async (booking) => {
    setSelectedBooking(booking);
    setRoomsLoading(true);
    setShowApproveModal(true);
    try {
      const res = await getHostelRooms(booking.hostelId._id, { status: 'available' });
      if (res.success) {
        // Show matching-type rooms first so the admin can quickly honor the
        // student's original request, while still allowing any available room.
        const sorted = [...res.data].sort((a, b) => {
          const aMatch = a.type === booking.roomType ? 0 : 1;
          const bMatch = b.type === booking.roomType ? 0 : 1;
          return aMatch - bMatch;
        });
        setAvailableRooms(sorted);
        const bestMatch = sorted.find((r) => r.type === booking.roomType);
        if (sorted.length > 0) {
          setSelectedRoomId((bestMatch || sorted[0])._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load available rooms');
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleConfirmApproval = async () => {
    if (!selectedRoomId) {
      toast.error('Please assign a room to approve booking');
      return;
    }

    try {
      const res = await updateBookingStatus(selectedBooking._id, {
        status: 'approved',
        roomId: selectedRoomId,
      });

      if (res.success) {
        toast.success('Booking request approved and room assigned!');
        setShowApproveModal(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleOpenRejectModal = (booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmRejection = async () => {
    if (!rejectionReason) {
      toast.error('Please specify a reason for rejection');
      return;
    }

    try {
      const res = await updateBookingStatus(selectedBooking._id, {
        status: 'rejected',
        rejectionReason,
      });

      if (res.success) {
        toast.success('Booking request rejected successfully');
        setShowRejectModal(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a1a12]">Booking Requests</h1>
          <p className="text-[#6b5c54] text-sm">Review student reservation requests and assign room beds.</p>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2 text-[#6b5c54] hover:text-[#e6472d] hover:bg-[#fdece6] rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-[#eaddd5] text-[#9c8b83] text-sm">
          No booking requests found in the system logs.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-[#eaddd5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f5f4] text-[#6b5c54] text-xs font-bold uppercase tracking-wider border-b border-[#eaddd5]">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Hostel Requested</th>
                  <th className="px-6 py-4">Duration Range</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaddd5] text-sm">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-[#fdece6]/50 text-[#2a1a12] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-[#f1eeec] text-[#6b5c54] rounded-lg">
                          <User size={16} />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#2a1a12]">{b.userId?.name}</span>
                          <span className="text-[10px] text-[#9c8b83]">{b.userId?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#2a1a12]">{b.hostelId?.name}</span>
                        <span className="text-[10px] text-[#e6472d]">
                          Requested: {b.roomType || 'N/A'}
                          {b.assignedRoomNumber ? ` · Room ${b.assignedRoomNumber} assigned` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#6b5c54]">
                        <Calendar size={14} />
                        <span>
                          {new Date(b.checkInDate).toLocaleDateString()} - {new Date(b.checkOutDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize {
                          b.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : b.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400'
                            : b.status === 'cancelled'
                            ? 'bg-gray-500/10 text-[#6b5c54]'
                            : b.status === 'checked_out'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {b.status === 'checked_out' ? 'checked out' : b.status}
                      </span>
                      {b.status === 'approved' && b.checkoutRequested && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                          Checkout requested
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#2a1a12]">{b.totalAmount}</td>
                    <td className="px-6 py-4 text-right">
                      {b.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenApproveModal(b)}
                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg cursor-pointer transition-colors"
                            title="Approve & Assign Room"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(b)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer transition-colors"
                            title="Reject Request"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9c8b83]">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Modal (Allocate Room) */}
      {showApproveModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowApproveModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div className="glass-panel border border-[#eaddd5] max-w-md w-full p-6 rounded-2xl shadow-xl relative z-10 animate-fade-in">
            <h3 className="text-xl font-bold text-[#2a1a12] mb-2">Approve Booking & Assign Room</h3>
            <p className="text-[#6b5c54] text-xs mb-6">
              Select an available room in <strong>{selectedBooking.hostelId?.name}</strong> to allocate.
              Student requested a <strong>{selectedBooking.roomType}</strong> room.
            </p>

            {roomsLoading ? (
              <Loader />
            ) : availableRooms.length === 0 ? (
              <div className="text-center py-4 flex flex-col items-center gap-3 text-red-400">
                <ShieldAlert size={36} />
                <p className="text-xs">No vacant rooms available in this hostel. Add rooms or free occupied slots first.</p>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="mt-4 px-4 py-2 bg-[#f1eeec] text-[#2a1a12] font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b5c54]">Available Rooms</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none"
                  >
                    {availableRooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.type === selectedBooking.roomType ? '✓ ' : ''}
                        Room {r.roomNumber} - {r.type} (Rs. {r.rent}/mo, {r.currentOccupants.length}/{r.capacity} filled)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="px-4 py-2.5 bg-[#f1eeec] text-[#2a1a12] font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmApproval}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Approve Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowRejectModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div className="glass-panel border border-[#eaddd5] max-w-md w-full p-6 rounded-2xl shadow-xl relative z-10 animate-fade-in">
            <h3 className="text-xl font-bold text-[#2a1a12] mb-2">Reject Booking Application</h3>
            <p className="text-[#6b5c54] text-xs mb-6">
              State the reason for rejecting <strong>{selectedBooking.userId?.name}</strong>'s request.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2.5 bg-[#f1eeec] text-[#2a1a12] font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRejection}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingRequests;
