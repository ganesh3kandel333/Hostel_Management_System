import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Mail, Phone, User as UserIcon, Building2 } from 'lucide-react';
import { getMyBookings } from '../../api/bookingApi.js';
import { getMyComplaints } from '../../api/complaintApi.js';
import Loader from '../../components/Loader.jsx';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-[#ba1a1a] border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
};

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [complaintCount, setComplaintCount] = useState(0);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const bookingsRes = await getMyBookings();
        if (bookingsRes.success && bookingsRes.data.length > 0) {
          setBooking(bookingsRes.data[0]);
        }

        const complaintsRes = await getMyComplaints();
        if (complaintsRes.success) {
          setComplaintCount(complaintsRes.data.filter((c) => c.status !== 'resolved').length);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-[#2a1a12]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <h1 className="text-2xl font-extrabold text-[#2a1a12]">hello, {user?.name || 'Student'}</h1>
        <button
          onClick={() => navigate('/hostels')}
          className="px-5 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] text-white font-bold text-xs rounded-full shadow-sm transition-all cursor-pointer"
        >
          Browse Hostels
        </button>
      </div>

      {/* Your Details */}
      <div className="bg-white border border-[#eaddd5]/40 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#9c8b83] uppercase tracking-wider">Your Details</span>
          <Link to="/profile" className="text-xs font-bold text-[#e6472d] hover:underline">
            Edit Profile
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-16 h-16 rounded-full object-cover border border-[#eaddd5] shrink-0"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm w-full">
            <div className="flex items-center gap-2 text-[#2a1a12]">
              <UserIcon size={14} className="text-[#e6472d] shrink-0" />
              <span className="font-semibold">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6b5c54]">
              <Mail size={14} className="text-[#e6472d] shrink-0" />
              <span className="truncate">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6b5c54]">
              <Phone size={14} className="text-[#e6472d] shrink-0" />
              <span>{user?.phoneNumber || 'Not provided'}</span>
            </div>
            {booking && (
              <div className="flex items-center gap-2 text-[#6b5c54]">
                <Building2 size={14} className="text-[#e6472d] shrink-0" />
                <span>{booking.hostelId?.name || 'Hostel unavailable'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two simple cards: Booking Status & Assigned Room */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Status */}
        <div className="bg-[#fdece6]/60 border border-[#eaddd5]/40 p-6 rounded-2xl shadow-sm min-h-[160px] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#9c8b83] uppercase tracking-wider">Booking Status</span>
            {booking && (
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border shrink-0 ${statusStyles[booking.status] || statusStyles.cancelled}`}>
                {booking.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {!booking ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <p className="text-sm text-[#6b5c54]">No active booking yet.</p>
              <Link to="/hostels" className="text-xs font-bold text-[#e6472d] hover:underline">
                Browse hostels to apply →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-lg font-bold text-[#2a1a12]">{booking.hostelId?.name || 'Hostel unavailable'}</span>
              <span className="text-xs text-[#6b5c54]">
                {new Date(booking.checkInDate).toLocaleDateString()} – {new Date(booking.checkOutDate).toLocaleDateString()}
              </span>
              {booking.status === 'rejected' && booking.rejectionReason && (
                <p className="text-[11px] text-[#ba1a1a] mt-1">Reason: {booking.rejectionReason}</p>
              )}
            </div>
          )}
        </div>

        {/* Assign Room */}
        <div className="bg-[#fdece6]/60 border border-[#eaddd5]/40 p-6 rounded-2xl shadow-sm min-h-[160px] flex flex-col justify-between">
          <span className="text-xs font-bold text-[#9c8b83] uppercase tracking-wider">Assigned Room</span>

          {booking && booking.status === 'approved' ? (
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-2xl font-extrabold text-[#2a1a12]">
                Room {booking.assignedRoomNumber || booking.roomId?.roomNumber || 'TBA'}
              </span>
              <span className="text-xs text-[#6b5c54]">{booking.hostelId?.name || 'Hostel unavailable'}</span>
              <Link
                to="/complaints"
                className="mt-3 w-fit px-4 py-2 border border-[#e6472d] text-[#e6472d] hover:bg-[#fdece6] font-bold text-xs rounded-lg transition-all"
              >
                File a Complaint
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-center">
              <p className="text-sm text-[#6b5c54]">
                {booking ? 'Your room will appear here once approved.' : 'Apply for a hostel to get a room assigned.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Complaints + Booking details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#fdece6]/60 border border-[#eaddd5]/40 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#9c8b83] uppercase">Open Complaints</span>
            <span className="text-2xl font-extrabold text-[#2a1a12]">{complaintCount}</span>
          </div>
          <Link
            to="/complaints"
            className="w-full py-2 border border-[#e6472d] text-[#e6472d] hover:bg-[#fdece6] font-bold text-xs rounded-lg transition-all text-center"
          >
            File or Track a Complaint
          </Link>
        </div>

        <div className="bg-[#fdece6]/60 border border-[#eaddd5]/40 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#9c8b83] uppercase">Booking Details</span>
            {booking && (
              <Link to="/booking-status" className="text-xs font-bold text-[#e6472d] hover:underline">
                Full History
              </Link>
            )}
          </div>

          {!booking ? (
            <p className="text-sm text-[#6b5c54] text-center py-4">No booking history yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-[#9c8b83] uppercase">Room</span>
                <span className="font-semibold text-[#2a1a12]">
                  {booking.assignedRoomNumber || booking.roomId?.roomNumber || 'Not yet assigned'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-[#9c8b83] uppercase">Total Amount</span>
                <span className="font-semibold text-[#e6472d]">Rs. {booking.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-[#9c8b83] uppercase">Check-In</span>
                <span className="font-semibold text-[#2a1a12] flex items-center gap-1">
                  <Calendar size={12} /> {new Date(booking.checkInDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-[#9c8b83] uppercase">Check-Out</span>
                <span className="font-semibold text-[#2a1a12] flex items-center gap-1">
                  <Calendar size={12} /> {new Date(booking.checkOutDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
