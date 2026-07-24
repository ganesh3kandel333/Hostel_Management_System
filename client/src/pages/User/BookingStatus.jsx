import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, requestCheckout } from '../../api/bookingApi.js';
import { toast } from 'react-toastify';
import { Calendar, Bed, Clock, CheckCircle, XCircle, LogOut, Hourglass } from 'lucide-react';
import Loader from '../../components/Loader.jsx';

const BookingStatus = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOutId, setCheckingOutId] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await getMyBookings();
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

  const handleApplyCheckout = async (bookingId) => {
    if (!window.confirm('Apply to check out of this hostel? Your hostel admin will review and finalize it.')) return;
    setCheckingOutId(bookingId);
    try {
      const res = await requestCheckout(bookingId);
      if (res.success) {
        toast.success('Checkout application submitted. Awaiting admin confirmation.');
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit checkout application');
    } finally {
      setCheckingOutId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold">
            <XCircle size={14} /> Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-[#6b5c54] rounded-full text-xs font-semibold">
            Cancelled
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
            <LogOut size={14} /> Checked Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
            <Clock size={14} /> Pending Review
          </span>
        );
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-extrabold text-[#2a1a12]">My Booking Requests</h1>
        <p className="text-[#6b5c54] text-sm">Track registration and approval statuses of your applications.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-[#eaddd5]">
          <p className="text-[#9c8b83] text-sm mb-6">No historical booking requests recorded.</p>
          <button
            onClick={() => navigate('/book-room')}
            className="px-6 py-3 bg-[#e6472d] hover:bg-[#c73a22] text-white font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Apply for Accommodation
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {bookings.map((b) => (
            <div key={b._id} className="glass-panel p-6 rounded-2xl border border-[#eaddd5] flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e6472d]/10 text-[#e6472d] border border-[#f3b8a3]/40 flex items-center justify-center">
                    <Bed size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2a1a12]">{b.hostelId?.name || 'Hostel unavailable'}</h3>
                    <p className="text-xs text-[#9c8b83]">{b.hostelId?.city}, {b.hostelId?.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.status === 'approved' && b.checkoutRequested && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold">
                      <Hourglass size={14} /> Checkout Requested
                    </span>
                  )}
                  {getStatusBadge(b.status)}
                </div>
              </div>

              <hr className="border-[#eaddd5]" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#9c8b83] uppercase font-semibold">Total Amount</span>
                  <span className="text-sm font-bold text-[#2a1a12]">Rs. {b.totalAmount}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#9c8b83] uppercase font-semibold">Requested Type</span>
                  <span className="text-sm font-bold text-[#2a1a12]">{b.roomType || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#9c8b83] uppercase font-semibold">Allocated Room</span>
                  <span className="text-sm font-bold text-[#e6472d]">
                    {b.roomId ? b.roomId.roomNumber : 'Pending'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-4">
                  <span className="text-[10px] text-[#9c8b83] uppercase font-semibold">Check Stay Period</span>
                  <span className="text-xs font-semibold text-[#6b5c54] flex items-center gap-1.5 mt-0.5">
                    <Calendar size={14} />
                    {new Date(b.checkInDate).toLocaleDateString()} to {new Date(b.checkOutDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {b.status === 'rejected' && b.rejectionReason && (
                <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-400 text-xs rounded-xl">
                  <strong>Rejection feedback:</strong> {b.rejectionReason}
                </div>
              )}

              {b.status === 'cancelled' && b.rejectionReason && (
                <div className="p-4 bg-gray-500/5 border border-gray-500/10 text-[#6b5c54] text-xs rounded-xl">
                  <strong>Note:</strong> {b.rejectionReason}
                </div>
              )}

              {b.status === 'approved' && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleApplyCheckout(b._id)}
                    disabled={b.checkoutRequested || checkingOutId === b._id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#f1eeec] hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed text-[#2a1a12] hover:text-red-600 font-semibold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    <LogOut size={14} />
                    {b.checkoutRequested
                      ? 'Checkout Application Pending'
                      : checkingOutId === b._id
                      ? 'Submitting...'
                      : 'Apply for Check Out'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingStatus;
