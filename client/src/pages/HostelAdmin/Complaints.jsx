import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { AlertTriangle, Check, Clock, User, MessageSquare, X } from 'lucide-react';
import { getAllComplaints, updateComplaintStatus } from '../../api/complaintApi.js';
import Loader from '../../components/Loader.jsx';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reply Modal States
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('resolved');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await getAllComplaints();
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      toast.error('Failed to load complaints logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleOpenReplyModal = (complaint) => {
    setSelectedComplaint(complaint);
    setReplyText(complaint.reply || '');
    setResolutionStatus(complaint.status === 'pending' ? 'in_progress' : complaint.status);
    setShowReplyModal(true);
  };

  const handleConfirmReply = async (e) => {
    e.preventDefault();
    if (!replyText) {
      toast.error('Please input a resolution comments reply');
      return;
    }

    try {
      const res = await updateComplaintStatus(selectedComplaint._id, {
        status: resolutionStatus,
        reply: replyText,
      });

      if (res.success) {
        toast.success('Complaint status updated and logged!');
        setShowReplyModal(false);
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update complaint status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold animate-pulse">
            <Check size={12} /> Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
            <Clock size={12} /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold">
            Pending
          </span>
        );
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#2a1a12]">Student Complaints</h1>
        <p className="text-[#6b5c54] text-sm">Review, respond, and resolve complaints submitted by residents.</p>
      </div>

      {complaints.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-[#eaddd5] text-[#9c8b83] text-sm">
          No student complaints filed in the system logs.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-[#eaddd5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f5f4] text-[#6b5c54] text-xs font-bold uppercase tracking-wider border-b border-[#eaddd5]">
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Hostel</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Filed</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaddd5] text-sm">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-[#fdece6]/50 text-[#2a1a12] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-[#f1eeec] text-[#6b5c54] rounded-lg">
                          <User size={16} />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#2a1a12]">{c.userId?.name}</span>
                          <span className="text-[10px] text-[#9c8b83]">{c.userId?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#2a1a12]">{c.hostelId?.name}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{c.subject}</td>
                    <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                    <td className="px-6 py-4 text-xs text-[#9c8b83]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenReplyModal(c)}
                        className="p-2 bg-[#fdece6] hover:bg-[#c73a22]/20 text-[#e6472d] rounded-lg cursor-pointer transition-colors"
                        title="Respond/Resolve"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowReplyModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div className="glass-panel border border-[#eaddd5] max-w-md w-full p-6 rounded-2xl shadow-xl relative z-10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#2a1a12]">Respond to Complaint</h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="p-1.5 text-[#6b5c54] hover:text-[#2a1a12] hover:bg-[#fdece6] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <p className="text-xs text-[#9c8b83] uppercase font-semibold">Subject</p>
                <p className="text-sm font-semibold text-[#2a1a12]">{selectedComplaint.subject}</p>
              </div>
              <div>
                <p className="text-xs text-[#9c8b83] uppercase font-semibold">Details</p>
                <p className="text-xs text-[#6b5c54] leading-relaxed bg-[#f7f5f4] p-3 rounded-xl mt-1">
                  {selectedComplaint.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReply} className="flex flex-col gap-4">
              {/* Set Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Resolution Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] outline-none"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved / Fixed</option>
                </select>
              </div>

              {/* Reply Comments */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b5c54]">Admin Response</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#eaddd5] focus:border-[#e6472d] rounded-xl text-sm text-[#2a1a12] placeholder-[#9c8b83] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2.5 bg-[#f1eeec] text-[#2a1a12] font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Log Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
