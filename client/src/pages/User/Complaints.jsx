import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { AlertTriangle, Send, CheckCircle, Clock, Info } from 'lucide-react';
import { createComplaint, getMyComplaints } from '../../api/complaintApi.js';
import { getMyBookings } from '../../api/bookingApi.js';
import Loader from '../../components/Loader.jsx';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const loadComplaintsData = async () => {
    try {
      const res = await getMyComplaints();
      if (res.success) {
        setComplaints(res.data);
      }
      const bookingsRes = await getMyBookings();
      if (bookingsRes.success && bookingsRes.data.length > 0) {
        // Find approved booking for hostelId reference
        const approved = bookingsRes.data.find(b => b.status === 'approved');
        if (approved) {
          setActiveBooking(approved);
        }
      }
    } catch (err) {
      toast.error('Failed to load complaints list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaintsData();
  }, []);

  const onSubmit = async (data) => {
    if (!activeBooking) {
      toast.error('You must have an approved active accommodation booking to file complaints');
      return;
    }
    if (!activeBooking.hostelId?._id) {
      toast.error('Your hostel record is unavailable right now. Please contact support.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        hostelId: activeBooking.hostelId._id,
        subject: data.subject,
        description: data.description,
      };

      const res = await createComplaint(payload);
      if (res.success) {
        toast.success('Complaint submitted successfully!');
        reset();
        loadComplaintsData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
            <CheckCircle size={14} /> Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
            <Clock size={14} /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-[#6b5c54] rounded-full text-xs font-semibold">
            Pending Review
          </span>
        );
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* File complaint panel */}
      <div className="lg:col-span-1">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-extrabold text-[#2a1a12]">File Complaint</h1>
          <p className="text-[#6b5c54] text-sm">Submit maintenance issues or service concerns.</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-[#eaddd5]">
          {!activeBooking ? (
            <div className="text-center py-6 text-[#9c8b83] text-sm flex flex-col items-center gap-3">
              <Info size={30} />
              <p>You cannot submit complaints without an active approved booking.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Issue Subject</label>
                <input
                  type="text"
                  {...register('subject', { required: 'Subject is required' })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all"
                />
                {errors.subject && (
                  <span className="text-xs text-red-400 font-medium">{errors.subject.message}</span>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Issue Details</label>
                <textarea
                  rows={4}
                  {...register('description', { required: 'Details are required' })}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none transition-all resize-none"
                />
                {errors.description && (
                  <span className="text-xs text-red-400 font-medium">{errors.description.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#e6472d] hover:bg-[#c73a22] disabled:bg-[#e6472d]/50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader size="sm" /> : <><Send size={16} /> Submit Complaint</>}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Complaint logs */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-[#2a1a12]">Historical Complaint Logs</h2>

        {complaints.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-[#eaddd5] text-[#9c8b83] text-sm">
            No complaints filed yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
            {complaints.map((c) => (
              <div key={c._id} className="glass-panel p-5 rounded-2xl border border-[#eaddd5] flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-base font-bold text-[#2a1a12]">{c.subject}</h4>
                    <span className="text-[10px] text-[#9c8b83]">
                      Filed on: {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {getStatusBadge(c.status)}
                </div>
{/* className="text-xs text-[#6b5c54] leading-relaxed bg-[#f7f5f4] p-3 rounded-xl" */}
                <p className="text-xs text-[#6b5c54] leading-relaxed bg-[#f7f5f4] p-3 rounded-xl"> 
                  {c.description}
                </p>
{/* className="p-3 bg-[#fdece6] border border-[#f3b8a3]/40 rounded-xl text-xs" */}
                {c.reply && (
                  <div >
                    <p className="font-bold text-[#e6472d] mb-1">Admin Response:</p>
                    <p className="text-[#2a1a12] italic">{c.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaints;
