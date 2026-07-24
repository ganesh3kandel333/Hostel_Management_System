import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  FileSpreadsheet,
  AlertTriangle,
  Bed,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Users,
  ClipboardList
} from 'lucide-react';
import { getAllBookings, updateBookingStatus } from '../../api/bookingApi.js';
import { getAllComplaints } from '../../api/complaintApi.js';
import { getHostelRooms } from '../../api/roomApi.js';
import Loader from '../../components/Loader.jsx';

const HostelAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const assignedHostel = user?.assignedHostel;
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    bookingRequests: 0,
    pendingComplaints: 0,
    availableRooms: 0,
    occupancyRate: 0,
    activeResidents: 0,
  });

  const fetchWardenData = async () => {
    setLoading(true);
    try {
      // Fetch pending bookings (backend automatically scopes this to your hostel)
      const bookingsRes = await getAllBookings({ status: 'pending' });
      const pendingBookings = bookingsRes.success ? bookingsRes.data : [];
      setBookings(pendingBookings.slice(0, 4));

      // Fetch active residents count (approved bookings, scoped to your hostel)
      const approvedRes = await getAllBookings({ status: 'approved' });
      const activeResidentsCount = approvedRes.success ? approvedRes.data.length : 0;

      // Fetch pending complaints (backend automatically scopes this to your hostel)
      const complaintsRes = await getAllComplaints({ status: 'pending' });
      const pendingComplaintsCount = complaintsRes.success ? complaintsRes.data.length : 0;

      // Fetch rooms for your assigned hostel only
      let calculatedAvailableRooms = 0;
      let calculatedOccupancyRate = 0;

      if (assignedHostel?._id) {
        const roomsRes = await getHostelRooms(assignedHostel._id);
        if (roomsRes.success && roomsRes.data.length > 0) {
          calculatedAvailableRooms = roomsRes.data.filter(r => r.status === 'available').length;
          const occupiedBeds = roomsRes.data.reduce((sum, r) => sum + (r.currentOccupants?.length || 0), 0);
          const totalBeds = roomsRes.data.reduce((sum, r) => sum + r.capacity, 0);
          calculatedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
        }
      }

      setStats({
        bookingRequests: pendingBookings.length,
        pendingComplaints: pendingComplaintsCount,
        availableRooms: calculatedAvailableRooms,
        occupancyRate: calculatedOccupancyRate,
        activeResidents: activeResidentsCount,
      });
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardenData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedHostel?._id]);

  const handleAction = async (id, status) => {
    try {
      if (status === 'approved') {
        toast.info('Redirecting to allocate rooms...');
        navigate('/bookings');
        return;
      } else {
        const reason = window.prompt('Reason for rejecting this booking:', '');
        if (reason === null) return; // user cancelled
        const res = await updateBookingStatus(id, {
          status: 'rejected',
          rejectionReason: reason || 'Not specified'
        });
        if (res.success) {
          toast.success('Booking application rejected successfully');
          fetchWardenData();
        }
      }
    } catch (err) {
      navigate('/bookings');
    }
  };

  if (loading) return <Loader />;

  if (!assignedHostel) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 bg-white p-12 rounded-xl border border-[#eaddd5]/40 shadow-sm text-center">
        <AlertTriangle size={32} className="text-amber-500" />
        <h2 className="text-lg font-bold text-[#2a1a12]">No Hostel Registered Yet</h2>
        <p className="text-sm text-[#9c8b83] max-w-md">
          Your account isn't linked to a hostel yet. Register your hostel to get started — once it's created you can add rooms and start accepting bookings.
        </p>
        <Link
          to="/my-hostel"
          className="mt-1 px-6 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] text-white font-bold text-xs rounded-full shadow-sm transition-all cursor-pointer"
        >
          Register My Hostel
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-[#2a1a12]">
      {/* Header greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-[#eaddd5]/40 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-[#2a1a12]">Operations Overview</h1>
          
        </div>
        <button
          onClick={fetchWardenData}
          className="p-2 text-[#9c8b83] hover:text-[#e6472d] hover:bg-[#fdece6] rounded-lg transition-all cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Active residents */}
        <button
          onClick={() => navigate('/students')}
          className="text-left bg-white border border-[#eaddd5]/40 p-5 rounded-xl flex items-start justify-between shadow-sm hover:shadow-md hover:border-[#e6472d]/30 transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Active Residents</span>
            <span className="text-2xl font-extrabold text-[#2a1a12]">{stats.activeResidents}</span>
            <span className="text-[10px] text-[#9c8b83] font-medium">Currently Checked In</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#fdece6] text-[#e6472d] flex items-center justify-center shrink-0 border border-[#f3b8a3]/20">
            <Users size={20} />
          </div>
        </button>

        {/* Booking requests */}
        <button
          onClick={() => navigate('/bookings')}
          className="text-left bg-white border border-[#eaddd5]/40 p-5 rounded-xl flex items-start justify-between shadow-sm hover:shadow-md hover:border-[#e6472d]/30 transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Booking Requests</span>
            <span className="text-2xl font-extrabold text-[#2a1a12]">{stats.bookingRequests}</span>
            <span className="text-[10px] text-[#9c8b83] font-medium">Pending Review</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#fdece6] text-[#e6472d] flex items-center justify-center shrink-0 border border-[#f3b8a3]/20">
            <FileSpreadsheet size={20} />
          </div>
        </button>

        {/* Pending complaints */}
        <button
          onClick={() => navigate('/complaints')}
          className="text-left bg-white border border-[#eaddd5]/40 p-5 rounded-xl flex items-start justify-between shadow-sm hover:shadow-md hover:border-[#ba1a1a]/30 transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Pending Complaints</span>
            <span className="text-2xl font-extrabold text-[#2a1a12]">{String(stats.pendingComplaints).padStart(2, '0')}</span>
            <span className="text-[10px] text-amber-600 font-bold">
              {stats.pendingComplaints > 0 ? 'Needs Resolution' : 'All Clear'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
        </button>

        {/* Available rooms */}
        <button
          onClick={() => navigate('/manage-rooms')}
          className="text-left bg-white border border-[#eaddd5]/40 p-5 rounded-xl flex items-start justify-between shadow-sm hover:shadow-md hover:border-[#e6472d]/30 transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-1.5 w-full">
            <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Available Rooms</span>
            <span className="text-2xl font-extrabold text-[#2a1a12]">{stats.availableRooms}</span>
            {/* Occupancy bar */}
            <div className="w-full bg-[#fdece6] h-1.5 rounded-full overflow-hidden border border-[#eaddd5]/25">
              <div className="bg-[#e6472d] h-full" style={{ width: `${stats.occupancyRate}%` }} />
            </div>
            <span className="text-[9px] text-[#9c8b83] font-medium">{stats.occupancyRate}% Occupancy Rate</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#fdece6] text-[#e6472d] flex items-center justify-center shrink-0 ml-3">
            <Bed size={20} />
          </div>
        </button>
      </div>

      {/* Recent bookings list */}
      <div className="bg-white border border-[#eaddd5]/40 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#eaddd5]/20 flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#2a1a12]">Recent Booking Requests</h3>
          <Link to="/bookings" className="text-xs font-bold text-[#e6472d] hover:underline flex items-center gap-1">
            View All Requests <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fdece6] text-[#6b5c54] text-[9px] font-bold uppercase tracking-wider border-b border-[#eaddd5]/40">
                <th className="px-6 py-3">Guest Name</th>
                <th className="px-6 py-3">Room Preference</th>
                <th className="px-6 py-3">Check-in Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaddd5]/20 text-xs text-[#6b5c54]">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#9c8b83]">
                    No pending booking requests. All caught up!
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-[#fdf8f5] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#f6d9cd] text-[#e6472d] flex items-center justify-center font-bold">
                          {b.userId?.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col truncate max-w-[120px]">
                          <span className="font-bold text-[#2a1a12] truncate">{b.userId?.name}</span>
                          <span className="text-[9px] text-[#9c8b83]">RMST-{b._id.slice(-4)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{b.roomType || 'N/A'}</td>
                    <td className="px-6 py-4">{new Date(b.checkInDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(b._id, 'approved')}
                          className="p-1.5 border border-[#eaddd5] hover:bg-emerald-50 text-emerald-600 rounded cursor-pointer transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleAction(b._id, 'rejected')}
                          className="p-1.5 border border-[#eaddd5] hover:bg-red-50 text-[#ba1a1a] rounded cursor-pointer transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Occupancy Summary */}
      <div className="bg-white border border-[#eaddd5]/40 p-6 rounded-xl flex flex-col gap-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-[#2a1a12]">Hostel Snapshot</h3>
            <p className="text-[10px] text-[#9c8b83]">Current occupancy and activity at {assignedHostel.name}.</p>
          </div>
          <ClipboardList size={20} className="text-[#d84e32]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#fdece6] border border-[#f3b8a3]/20">
            <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Occupancy Rate</span>
            <span className="text-xl font-extrabold text-[#e6472d]">{stats.occupancyRate}%</span>
          </div>
          <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#fdece6] border border-[#f3b8a3]/20">
            <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Active Residents</span>
            <span className="text-xl font-extrabold text-[#e6472d]">{stats.activeResidents}</span>
          </div>
          <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#fdece6] border border-[#f3b8a3]/20">
            <span className="text-[10px] font-bold text-[#9c8b83] uppercase tracking-wider">Available Rooms</span>
            <span className="text-xl font-extrabold text-[#e6472d]">{stats.availableRooms}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelAdminDashboard;
