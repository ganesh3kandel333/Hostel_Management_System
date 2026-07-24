import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Users, Phone, Mail, Calendar, Bed, LogOut, Hourglass, X } from 'lucide-react';
import { getAllBookings, checkoutStudent, declineCheckoutRequest } from '../../api/bookingApi.js';
import Loader from '../../components/Loader.jsx';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchActiveResidents = async () => {
    try {
      const res = await getAllBookings({ status: 'approved' });
      if (res.success) {
        setStudents(res.data);
        setFilteredStudents(res.data);
      }
    } catch (err) {
      toast.error('Failed to load active students roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveResidents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(
      (s) =>
        s.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.assignedRoomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleCheckout = async (bookingId) => {
    if (window.confirm('Are you sure you want to check out this student? This will release their room allocation.')) {
      try {
        const res = await checkoutStudent(bookingId);
        if (res.success) {
          toast.success('Student checked out successfully. Room released!');
          fetchActiveResidents();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to check out student');
      }
    }
  };

  const handleDeclineCheckout = async (bookingId) => {
    if (window.confirm('Decline this checkout application? The student will remain checked into their room.')) {
      try {
        const res = await declineCheckoutRequest(bookingId);
        if (res.success) {
          toast.success('Checkout application declined');
          fetchActiveResidents();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to decline checkout application');
      }
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a1a12]">Active Residents</h1>
          
        </div>

        {/* Search & Tabs control wrapper */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              placeholder='search Resident'
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 bg-white border border-[#eaddd5] focus:border-[#d84e32] rounded-xl text-sm text-[#2a1a12] placeholder-gray-400 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#eaddd5]/40 shadow-sm text-[#6b5c54] text-sm">
          No active residents matching search parameters.
        </div>
      ) : (
        /* Roster Grid View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredStudents.map((s) => (
            <div key={s._id} className="bg-white p-6 rounded-2xl border border-[#eaddd5]/40 shadow-sm flex flex-col gap-5 text-[#2a1a12]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fdece6] border border-[#d84e32]/20 text-[#d84e32] flex items-center justify-center font-bold">
                  {s.userId?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-[#2a1a12] truncate">{s.userId?.name}</span>
                  <span className="text-[10px] text-[#d84e32] font-semibold uppercase tracking-wider">
                    Room {s.assignedRoomNumber || 'N/A'}
                  </span>
                </div>
              </div>

              {s.checkoutRequested && (
                <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-semibold">
                  <Hourglass size={12} /> Applied for Check Out
                </span>
              )}

              <hr className="border-[#eaddd5]/30" />

              <div className="flex flex-col gap-2.5 text-xs text-[#6b5c54]">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-[#9c8b83] shrink-0" />
                  <span className="truncate">{s.userId?.email}</span>
                </div>
                {s.userId?.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-[#9c8b83] shrink-0" />
                    <span>{s.userId?.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#9c8b83] shrink-0" />
                  <span>
                    Checked-in: {new Date(s.checkInDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed size={14} className="text-[#9c8b83] shrink-0" />
                  <span className="truncate">Hostel: {s.hostelId?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#9c8b83] shrink-0" />
                  <span>Total Amount: Rs. {s.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              <hr className="border-[#eaddd5]/30" />

              {/* Checkout Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCheckout(s._id)}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-xl cursor-pointer transition-all border border-red-200/50"
                >
                  <LogOut size={14} /> {s.checkoutRequested ? 'Confirm Check Out' : 'Check Out Resident'}
                </button>
                {s.checkoutRequested && (
                  <button
                    onClick={() => handleDeclineCheckout(s._id)}
                    title="Decline checkout application"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#f1eeec] hover:bg-[#eaddd5] text-[#6b5c54] font-semibold text-xs rounded-xl cursor-pointer transition-all border border-[#eaddd5]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Students;
